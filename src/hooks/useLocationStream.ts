import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../services/apiConfig';

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
  maxReconnectAttempts?: number;
  baseReconnectDelay?: number;
}

/**
 * Custom hook for SSE-based live location tracking
 * 
 * @param config - Configuration object with token, enabled flag, and reconnection settings
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
  maxReconnectAttempts = 5,
  baseReconnectDelay = 1000,
}: UseLocationStreamConfig): UseLocationStreamReturn {
  // State management
  const [locations, setLocations] = useState<Map<string | number, RescuerLocation>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Refs to maintain values across renders without triggering re-renders
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualDisconnectRef = useRef(false);

  /**
   * Calculate exponential backoff delay
   */
  const getReconnectDelay = useCallback((attempt: number): number => {
    return Math.min(baseReconnectDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
  }, [baseReconnectDelay]);

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
   * Parse SSE message format
   */
  const parseSSEMessage = useCallback((message: string) => {
    const lines = message.split('\n');
    let eventType = 'message';
    let eventData = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        eventData = line.substring(5).trim();
      }
    }

    // Handle different event types
    switch (eventType) {
      case 'location_update':
        try {
          const data: RescuerLocation = JSON.parse(eventData);
          console.log('[useLocationStream] Location update:', data);
          updateLocation(data);
        } catch (err) {
          console.error('[useLocationStream] Failed to parse location data:', err);
        }
        break;

      case 'ping':
        console.log('[useLocationStream] Ping received - connection alive');
        break;

      default:
        console.log('[useLocationStream] Unknown event type:', eventType, eventData);
    }
  }, [updateLocation]);

  // Use ref to avoid circular dependency
  const connectRef = useRef<() => void>();
  
  /**
   * Schedule reconnection with exponential backoff
   */
  const scheduleReconnect = useCallback(() => {
    if (isManualDisconnectRef.current) {
      return;
    }

    setConnectionAttempts((prev) => {
      const nextAttempt = prev + 1;
      
      if (nextAttempt >= maxReconnectAttempts) {
        console.error('[useLocationStream] Max reconnection attempts reached');
        setError(`Failed to connect after ${maxReconnectAttempts} attempts`);
        return prev;
      }

      const delay = getReconnectDelay(nextAttempt);
      console.log(`[useLocationStream] Reconnecting in ${delay}ms (attempt ${nextAttempt}/${maxReconnectAttempts})`);

      reconnectTimeoutRef.current = setTimeout(() => {
        if (connectRef.current) {
          connectRef.current();
        }
      }, delay);

      return nextAttempt;
    });
  }, [maxReconnectAttempts, getReconnectDelay]);

  /**
   * Connect using fetch API with manual SSE parsing
   * This allows us to use Authorization headers
   */
  const connectWithFetch = useCallback(async (authToken: string) => {
    // Clean up any existing connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      const response = await fetch(`${API_BASE_URL}/sse/location/stream`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      console.log('[useLocationStream] Connected successfully');
      setIsConnected(true);
      setConnectionAttempts(0);
      setError(null);

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('[useLocationStream] Stream ended');
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete messages (separated by double newline)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer

        for (const message of messages) {
          if (message.trim()) {
            parseSSEMessage(message);
          }
        }
      }

      // If we reach here, connection closed normally
      if (!isManualDisconnectRef.current) {
        console.log('[useLocationStream] Connection closed, reconnecting...');
        setIsConnected(false);
        scheduleReconnect();
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[useLocationStream] Connection aborted');
        return;
      }

      console.error('[useLocationStream] Fetch error:', err);
      setError(err.message || 'Connection failed');
      setIsConnected(false);

      if (!isManualDisconnectRef.current) {
        scheduleReconnect();
      }
    }
  }, [parseSSEMessage, scheduleReconnect]);

  /**
   * Connect to SSE endpoint
   */
  const connect = useCallback(() => {
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

    // Don't connect if max attempts reached
    if (connectionAttempts >= maxReconnectAttempts) {
      console.error('[useLocationStream] Max reconnection attempts reached');
      setError(`Maximum reconnection attempts (${maxReconnectAttempts}) reached`);
      return;
    }

    console.log(`[useLocationStream] Connecting... (attempt ${connectionAttempts + 1}/${maxReconnectAttempts})`);
    setError(null);
    isManualDisconnectRef.current = false;

    // Use fetch with streaming for better control
    connectWithFetch(token);
  }, [enabled, token, connectionAttempts, maxReconnectAttempts, isConnected, connectWithFetch]);

  // Store connect in ref
  connectRef.current = connect;

  // Store connect in ref
  connectRef.current = connect;

  /**
   * Manual reconnect function (resets attempt counter)
   */
  const reconnect = useCallback(() => {
    console.log('[useLocationStream] Manual reconnect requested');
    
    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

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

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

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

