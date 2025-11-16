# 📍 Live Location Tracking with Server-Sent Events (SSE)

Complete React + TypeScript implementation for real-time rescuer location tracking using Server-Sent Events.

## 📦 Installation

```bash
# No additional dependencies required for the custom implementation
# The custom hook uses native fetch API

# Optional: For the alternative implementation
npm install @microsoft/fetch-event-source
```

## 🚀 Quick Start

### 1. Import and Use

```tsx
import { LocationMonitor } from './components/LocationMonitor';

function App() {
  const token = localStorage.getItem('authToken');

  if (!token) {
    return <div>Please login first</div>;
  }

  return (
    <div style={{ height: '100vh' }}>
      <LocationMonitor token={token} enabled={true} />
    </div>
  );
}
```

### 2. Full Example

See `src/examples/LocationMonitorExample.tsx` for a complete example including:
- Token management from localStorage
- Loading states
- Error handling
- Redirect to login when not authenticated

## 📚 API Reference

### `useLocationStream` Hook

Custom hook for managing SSE connections.

```tsx
import { useLocationStream } from './hooks/useLocationStream';

const { locations, isConnected, error, reconnect, connectionAttempts } = useLocationStream({
  token: 'your-auth-token',
  enabled: true,
  maxReconnectAttempts: 5,      // Optional, default: 5
  baseReconnectDelay: 1000,      // Optional, default: 1000ms
});
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `token` | `string` | Yes | - | Bearer token for authentication |
| `enabled` | `boolean` | No | `true` | Enable/disable the connection |
| `maxReconnectAttempts` | `number` | No | `5` | Maximum reconnection attempts |
| `baseReconnectDelay` | `number` | No | `1000` | Base delay for exponential backoff (ms) |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `locations` | `Map<string\|number, RescuerLocation>` | Map of rescuer ID to location data |
| `isConnected` | `boolean` | Current connection status |
| `error` | `string \| null` | Current error message, if any |
| `reconnect` | `() => void` | Function to manually trigger reconnection |
| `connectionAttempts` | `number` | Current number of connection attempts |

#### `RescuerLocation` Interface

```typescript
interface RescuerLocation {
  rescuer_id: string | number;
  name: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'busy' | 'inactive';
  timestamp: string;  // ISO 8601 format
}
```

### `LocationMonitor` Component

Pre-built React component for displaying live location data.

```tsx
<LocationMonitor 
  token="your-auth-token"
  enabled={true}  // Optional, default: true
/>
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `token` | `string` | Yes | - | Bearer token for authentication |
| `enabled` | `boolean` | No | `true` | Enable/disable location tracking |

#### Features

- ✅ Live-updating table of rescuers
- ✅ Connection status indicator
- ✅ Error messages with details
- ✅ Manual reconnect button
- ✅ Statistics dashboard (total, active, busy, inactive)
- ✅ Color-coded status badges
- ✅ Relative time formatting
- ✅ Responsive design

## 🔄 SSE Event Format

The backend should send events in this format:

### Location Update Event

```
event: location_update
data: {"rescuer_id": 1, "name": "John Doe", "latitude": 35.6892, "longitude": 51.3890, "status": "active", "timestamp": "2024-01-15T10:30:00Z"}

```

### Ping/Keep-Alive Event

```
event: ping
data: {"timestamp": "2024-01-15T10:30:05Z"}

```

## 🛠️ Advanced Usage

### Custom Event Handling

```tsx
import { useLocationStream } from './hooks/useLocationStream';

function CustomTracker() {
  const { locations, isConnected } = useLocationStream({
    token: myToken,
    enabled: true,
  });

  // Convert Map to array
  const rescuers = Array.from(locations.values());

  // Filter by status
  const activeRescuers = rescuers.filter(r => r.status === 'active');

  // Custom rendering
  return (
    <div>
      <h2>Active Rescuers: {activeRescuers.length}</h2>
      {activeRescuers.map(rescuer => (
        <div key={rescuer.rescuer_id}>
          {rescuer.name} - Lat: {rescuer.latitude}, Lng: {rescuer.longitude}
        </div>
      ))}
    </div>
  );
}
```

### Conditional Connection

```tsx
function ConditionalTracker() {
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  
  const { locations } = useLocationStream({
    token: myToken,
    enabled: trackingEnabled,  // Only connect when enabled
  });

  return (
    <div>
      <button onClick={() => setTrackingEnabled(!trackingEnabled)}>
        {trackingEnabled ? 'Stop' : 'Start'} Tracking
      </button>
      {/* ... render locations ... */}
    </div>
  );
}
```

## 🔀 Alternative Implementation

### Using `@microsoft/fetch-event-source`

For more robust error handling and automatic retries:

```bash
npm install @microsoft/fetch-event-source
```

```tsx
// Simply change the import
import { useLocationStream } from './hooks/useLocationStreamFetchEventSource';

// Usage is identical
const { locations, isConnected, error } = useLocationStream({
  token: myToken,
  maxRetries: 5,  // Note: parameter name changed from maxReconnectAttempts
});
```

#### Benefits

- ✅ More reliable connection management
- ✅ Better error recovery
- ✅ Maintained by Microsoft
- ✅ Widely tested in production

## 🐛 Troubleshooting

### Connection Issues

**Problem:** Connection keeps failing with 404

**Solutions:**
1. Verify the endpoint is correct: `http://87.107.174.39/api/api/v1/sse/location/stream`
2. Check that the backend server is running
3. Verify the token is valid and not expired
4. Check CORS settings on the backend

**Problem:** "Maximum reconnection attempts reached"

**Solutions:**
1. Increase `maxReconnectAttempts` in the hook config
2. Check backend logs for errors
3. Verify network connectivity
4. Use the manual reconnect button after fixing backend issues

**Problem:** No location updates appearing

**Solutions:**
1. Check browser console for parsing errors
2. Verify SSE message format matches expected structure
3. Ensure `event` field is set to `location_update`
4. Check that `data` field contains valid JSON

### Performance Issues

**Problem:** UI freezing with many rescuers

**Solutions:**
1. Implement pagination in the table
2. Add virtualization (e.g., `react-window`)
3. Limit the number of visible rescuers
4. Throttle location updates on the backend

## 📊 Backend Implementation Guide

### Required Endpoint

```
GET http://87.107.174.39/api/api/v1/sse/location/stream
```

### Headers

```
Authorization: Bearer <token>
Accept: text/event-stream
Cache-Control: no-cache
```

### Response

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### Example Backend (FastAPI)

```python
from fastapi import FastAPI, Depends
from fastapi.responses import StreamingResponse
import asyncio
import json

app = FastAPI()

async def location_stream():
    while True:
        # Get locations from database
        locations = get_active_rescuers()
        
        for location in locations:
            event_data = {
                "rescuer_id": location.id,
                "name": location.name,
                "latitude": location.lat,
                "longitude": location.lng,
                "status": location.status,
                "timestamp": location.updated_at.isoformat()
            }
            
            yield f"event: location_update\n"
            yield f"data: {json.dumps(event_data)}\n\n"
        
        await asyncio.sleep(5)  # Update every 5 seconds

@app.get("/api/api/v1/sse/location/stream")
async def stream_locations(token: str = Depends(verify_token)):
    return StreamingResponse(
        location_stream(),
        media_type="text/event-stream"
    )
```

### Example Backend (Node.js/Express)

```javascript
app.get('/api/api/v1/sse/location/stream', authenticate, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const intervalId = setInterval(async () => {
    const locations = await getActiveRescuers();
    
    locations.forEach(location => {
      const data = JSON.stringify({
        rescuer_id: location.id,
        name: location.name,
        latitude: location.lat,
        longitude: location.lng,
        status: location.status,
        timestamp: location.updatedAt
      });
      
      res.write(`event: location_update\n`);
      res.write(`data: ${data}\n\n`);
    });
  }, 5000);

  req.on('close', () => {
    clearInterval(intervalId);
  });
});
```

## 🔐 Security Considerations

1. **Always use HTTPS in production** (not HTTP)
2. **Validate tokens on the backend** for every SSE connection
3. **Implement rate limiting** to prevent abuse
4. **Set appropriate CORS headers**
5. **Don't expose sensitive location data** to unauthorized users
6. **Implement connection timeouts** on the backend
7. **Log connection attempts** for security monitoring

## 📈 Performance Tips

1. **Throttle updates**: Don't send location updates more often than necessary (e.g., every 5-10 seconds)
2. **Use server-side filtering**: Only send locations the user is authorized to see
3. **Implement pagination**: Don't send all rescuers at once if you have many
4. **Add compression**: Use gzip compression for SSE responses
5. **Monitor connections**: Track active SSE connections and limit per user
6. **Clean up old data**: Remove inactive rescuers from the stream

## 📝 License

This implementation is provided as-is for the amadebash project.

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console logs
3. Check backend logs
4. Verify SSE message format

---

**Built with ❤️ for real-time rescuer tracking**

