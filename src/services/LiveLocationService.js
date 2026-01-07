/**
 * LiveLocationService - Minimal SSE service for real-time location tracking
 */

import { API_BASE_URL } from './apiConfig';

class LiveLocationService {
  constructor() {
    this.isStreaming = false;
    this.abortController = null;
    this.reconnectTimeout = null;
    this.reconnectDelay = 3000;
  }

  /**
   * Start SSE stream for location updates
   */
  async startStream(onLocationUpdate, onError) {
    if (this.isStreaming) {
      console.log('[LiveLocation] Already streaming, skipping...');
      return;
    }

    console.log('[LiveLocation] Starting SSE stream...');
    this.isStreaming = true;
    await this.connectSSE(onLocationUpdate, onError);
  }

  /**
   * Connect to SSE endpoint with auto-reconnect
   */
  async connectSSE(onLocationUpdate, onError) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('[LiveLocation] No auth token found in localStorage');
        throw new Error('No auth token found');
      }

      console.log('[LiveLocation] Token found, connecting to SSE endpoint...');
      console.log(`[LiveLocation] Endpoint: ${API_BASE_URL}/sse/location/stream`);

      this.abortController = new AbortController();

      const response = await fetch(`${API_BASE_URL}/sse/location/stream`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: this.abortController.signal,
      });

      console.log('[LiveLocation] SSE Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error text');
        console.error('[LiveLocation] SSE connection failed:', response.status, errorText);
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      console.log('[LiveLocation] SSE connection established successfully');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      console.log('[LiveLocation] Starting to read SSE stream...');

      while (this.isStreaming) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('[LiveLocation] Stream ended');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            console.log('[LiveLocation] Received SSE message:', line.substring(0, 100));
            this.parseSSEMessage(line, onLocationUpdate);
          }
        }
      }

      // Auto-reconnect if still supposed to be streaming
      if (this.isStreaming) {
        console.log('[LiveLocation] Stream disconnected, scheduling reconnect...');
        this.scheduleReconnect(onLocationUpdate, onError);
      }

    } catch (error) {
      console.error('[LiveLocation] SSE error:', error);
      console.error('[LiveLocation] Error name:', error.name);
      console.error('[LiveLocation] Error message:', error.message);
      if (onError) onError(error);
      
      // Auto-reconnect on error
      if (this.isStreaming && error.name !== 'AbortError') {
        console.log('[LiveLocation] Scheduling reconnect after error...');
        this.scheduleReconnect(onLocationUpdate, onError);
      }
    }
  }

  /**
   * Parse SSE message format
   */
  parseSSEMessage(message, onLocationUpdate) {
    try {
      const lines = message.split('\n');
      let eventType = '';
      let eventData = '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          eventData = line.substring(5).trim();
        }
      }

      console.log('[LiveLocation] Parsed event type:', eventType);

      if (eventType === 'location_update' && eventData) {
        const data = JSON.parse(eventData);
        console.log('[LiveLocation] Location update received:', data);
        if (onLocationUpdate) onLocationUpdate(data);
      }
    } catch (error) {
      console.error('[LiveLocation] Error parsing SSE message:', error);
    }
  }

  /**
   * Schedule reconnection
   */
  scheduleReconnect(onLocationUpdate, onError) {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      console.log('Reconnecting SSE...');
      this.connectSSE(onLocationUpdate, onError);
    }, this.reconnectDelay);
  }

  /**
   * Stop SSE stream
   */
  stopStream() {
    this.isStreaming = false;
    
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Send location update to backend
   */
  async updateLocation(latitude, longitude) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('[LiveLocation] No auth token for update');
        throw new Error('No auth token found');
      }

      console.log('[LiveLocation] Sending location update:', { latitude, longitude });

      const response = await fetch(`${API_BASE_URL}/location/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        }),
      });

      console.log('[LiveLocation] Update response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error text');
        console.error('[LiveLocation] Update failed:', response.status, errorText);
        throw new Error(`Update failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('[LiveLocation] Location updated successfully:', result);
      return result;
    } catch (error) {
      console.error('[LiveLocation] Error updating location:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new LiveLocationService();

