/**
 * LocationStreamService - Handles real-time location streaming via SSE
 * and location updates to the backend
 */

class LocationStreamService {
  constructor() {
    this.eventSource = null;
    this.isStreaming = false;
    this.apiBaseUrl = '/api';
    this.authToken = null;
  }

  /**
   * Initialize the service with API base URL and auth token
   */
  initialize(apiBaseUrl, authToken) {
    this.apiBaseUrl = apiBaseUrl || '/api';
    this.authToken = authToken || localStorage.getItem('authToken');
  }

  /**
   * Start streaming location updates from the server
   * @param {Function} onUpdate - Callback for location updates
   * @param {Function} onError - Callback for errors
   */
  startStreaming(onUpdate, onError) {
    if (this.isStreaming) {
      console.warn('Already streaming location updates');
      return;
    }

    try {
      // Get auth token
      const token = this.authToken || localStorage.getItem('authToken');
      
      if (!token) {
        const error = new Error('Authentication token not found');
        if (onError) onError(error);
        return;
      }

      // Construct SSE endpoint URL
      const sseUrl = `${this.apiBaseUrl}/api/v1/sse/location/stream`;
      
      console.log('Connecting to SSE:', sseUrl);

      // Create EventSource with fetch alternative for auth headers
      this.connectWithFetch(sseUrl, token, onUpdate, onError);

    } catch (error) {
      console.error('Error starting stream:', error);
      if (onError) onError(error);
    }
  }

  /**
   * Connect to SSE endpoint using fetch with text/event-stream
   */
  async connectWithFetch(url, token, onUpdate, onError) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      this.isStreaming = true;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Read the stream
      const readStream = async () => {
        try {
          while (this.isStreaming) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('Stream ended');
              this.isStreaming = false;
              break;
            }

            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete messages (separated by double newline)
            const messages = buffer.split('\n\n');
            buffer = messages.pop() || ''; // Keep incomplete message in buffer

            // Parse each complete message
            for (const message of messages) {
              if (message.trim()) {
                this.parseSSEMessage(message, onUpdate);
              }
            }
          }
        } catch (error) {
          console.error('Stream reading error:', error);
          this.isStreaming = false;
          if (onError) onError(error);
        }
      };

      readStream();

    } catch (error) {
      console.error('Fetch SSE error:', error);
      this.isStreaming = false;
      if (onError) onError(error);
    }
  }

  /**
   * Parse SSE message format
   */
  parseSSEMessage(message, onUpdate) {
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

      // Process location_update events
      if (eventType === 'location_update' && eventData) {
        try {
          const data = JSON.parse(eventData);
          console.log('Location update received:', data);
          if (onUpdate) onUpdate(data);
        } catch (parseError) {
          console.error('Error parsing location data:', parseError);
        }
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  }

  /**
   * Update location to the backend
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<Object>} Response data
   */
  async updateLocation(latitude, longitude) {
    try {
      const token = this.authToken || localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const url = `${this.apiBaseUrl}/api/v1/location/update`;
      
      console.log('Updating location:', { latitude, longitude });

      const response = await fetch(url, {
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Update failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Location updated successfully:', data);
      return data;

    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  /**
   * Stop streaming location updates
   */
  stopStreaming() {
    console.log('Stopping location stream');
    this.isStreaming = false;
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Check if currently streaming
   */
  getStreamingStatus() {
    return this.isStreaming;
  }
}

// Export singleton instance
const locationStreamService = new LocationStreamService();
export default locationStreamService;

