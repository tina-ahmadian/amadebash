/**
 * Alternative implementation using @microsoft/fetch-event-source
 * 
 * This library provides better error handling, automatic retries,
 * and more robust SSE connection management.
 * 
 * Installation:
 * npm install @microsoft/fetch-event-source
 * 
 * Usage is identical to the custom hook:
 * import { useLocationStream } from './hooks/useLocationStreamFetchEventSource';
 */

import { useState, useEffect, useCallback, useRef } from 'react';
// @ts-ignore - Optional dependency
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - Optional dependency, may not be installed
import { fetchEventSource, EventSourceMessage } from '@microsoft/fetch-event-source';

/**
 * Location data structure for a rescuer
 */
export interface RescuerLocation {
  rescuer_id: string | number;
  name: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'busy' | 'inactive';
  timestamp: string;
}

/**
 * Hook return type
 */
interface UseLocationStreamReturn {
  locations: Map<string | number, RescuerLocation>;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
  connectionAttempts: number;
}

/**
 * Hook configuration
 */
interface UseLocationStreamConfig {
  token: string;
  enabled?: boolean;
  maxRetries?: number;
}

/**
 * Custom hook for SSE-based live location tracking using @microsoft/fetch-event-source
 * 
 * @param config - Configuration object with token, enabled flag
 * @returns Object containing locations map, connection status, error, and reconnect function
 * 
 * @example
 * ```tsx
 * const { locations, isConnected, error, reconnect } = useLocationStream({
 *   token: 'your-auth-token',
 *   enabled: true
 * });
 * ```
 */
export function useLocationStream({
  token,
  enabled = true,
  maxRetries = 5,
}: UseLocationStreamConfig): UseLocationStreamReturn {
  // State management
  const [locations, setLocations] = useState<Map<string | number, RescuerLocation>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const isManualDisconnectRef = useRef(false);

  /**
   * Update a single rescuer's location
   */
  const updateLocation = useCallback((data: RescuerLocation) => {
    setLocations((prev) => {
      const newMap = new Map(prev);
      newMap.set(data.rescuer_id, data);
      return newMap;
    });
  }, []);

  /**
   * Connect to SSE endpoint using fetch-event-source
   */
  const connect = useCallback(async () => {
    // Don't connect if disabled or no token
    if (!enabled || !token) {
      console.log('[useLocationStream] Connection disabled or no token provided');
      return;
    }

    // Don't connect if already connected
    if (abortControllerRef.current && isConnected) {
      console.log('[useLocationStream] Already connected');
      return;
    }

    console.log('[useLocationStream] Connecting with fetch-event-source...');
    setError(null);
    isManualDisconnectRef.current = false;

    // Clean up any existing connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      await fetchEventSource('http://87.107.174.39/api/api/v1/sse/location/stream', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
        signal: abortController.signal,

        // Called when connection opens
        onopen: async (response: Response) => {
          if (response.ok) {
            console.log('[useLocationStream] Connected successfully');
            setIsConnected(true);
            setConnectionAttempts(0);
            setError(null);
          } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            // Client error (4xx) - don't retry
            const errorText = await response.text();
            console.error('[useLocationStream] Client error:', response.status, errorText);
            setError(`Connection failed: ${response.status} ${response.statusText}`);
            setIsConnected(false);
            throw new Error(`Connection failed: ${response.status}`);
          } else {
            // Server error (5xx) or rate limit (429) - will retry
            console.error('[useLocationStream] Server error:', response.status);
            setError(`Server error: ${response.status}. Retrying...`);
            setIsConnected(false);
          }
        },

        // Called for each SSE message
        onmessage: (event: EventSourceMessage) => {
          console.log('[useLocationStream] Message received:', event);

          // Handle different event types
          if (event.event === 'location_update') {
            try {
              const data: RescuerLocation = JSON.parse(event.data);
              console.log('[useLocationStream] Location update:', data);
              updateLocation(data);
            } catch (err) {
              console.error('[useLocationStream] Failed to parse location data:', err);
            }
          } else if (event.event === 'ping') {
            console.log('[useLocationStream] Ping received - connection alive');
          } else {
            // Default message event
            try {
              const data: RescuerLocation = JSON.parse(event.data);
              updateLocation(data);
            } catch (err) {
              console.log('[useLocationStream] Unparseable message:', event.data);
            }
          }
        },

        // Called on connection close
        onclose: () => {
          console.log('[useLocationStream] Connection closed');
          setIsConnected(false);

          if (!isManualDisconnectRef.current) {
            // Will auto-retry via library's retry mechanism
            console.log('[useLocationStream] Connection will be retried automatically');
          }
        },

        // Called on error
        onerror: (err: any) => {
          console.error('[useLocationStream] Connection error:', err);
          setError(err instanceof Error ? err.message : 'Connection failed');
          setIsConnected(false);

          setConnectionAttempts((prev) => {
            const nextAttempt = prev + 1;

            if (nextAttempt >= maxRetries) {
              console.error('[useLocationStream] Max retries reached');
              setError(`Failed to connect after ${maxRetries} attempts`);
              throw new Error('Max retries reached'); // Stop retrying
            }

            console.log(`[useLocationStream] Retry attempt ${nextAttempt}/${maxRetries}`);
            return nextAttempt;
          });

          // Throw to retry
          throw err;
        },

        // Open timeout (ms)
        openWhenHidden: true,
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[useLocationStream] Connection aborted');
        return;
      }

      console.error('[useLocationStream] fetchEventSource error:', err);
      setError(err.message || 'Connection failed');
      setIsConnected(false);
    }
  }, [enabled, token, isConnected, maxRetries, updateLocation]);

  /**
   * Manual reconnect function (resets attempt counter)
   */
  const reconnect = useCallback(() => {
    console.log('[useLocationStream] Manual reconnect requested');

    // Abort existing connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset attempts and connect
    setConnectionAttempts(0);
    setError(null);
    isManualDisconnectRef.current = false;
    connect();
  }, [connect]);

  /**
   * Disconnect and cleanup
   */
  const disconnect = useCallback(() => {
    console.log('[useLocationStream] Disconnecting...');
    isManualDisconnectRef.current = true;

    // Abort the fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsConnected(false);
  }, []);

  /**
   * Connect on mount or when enabled/token changes
   */
  useEffect(() => {
    if (enabled && token) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [enabled, token]); // Only reconnect when these change

  return {
    locations,
    isConnected,
    error,
    reconnect,
    connectionAttempts,
  };
}

