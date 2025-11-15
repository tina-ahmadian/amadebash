# Backend Endpoints Documentation

This document describes the backend endpoints required for the live location tracking system.

## Required Endpoints

### 1. SSE Location Stream (Server-Sent Events)

**Endpoint:** `GET /api/v1/sse/location/stream`

**Purpose:** Stream real-time location updates to admin clients

**Authentication:** Bearer token required

**Request:**
```http
GET /api/v1/sse/location/stream HTTP/1.1
Host: your-api-domain.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Response:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

event: location_update
data: {"rescuerId":"123","id":"123","name":"Ahmad Rezaei","latitude":35.6892,"longitude":51.3890,"status":"active","timestamp":"2024-11-15T10:30:00Z"}

event: location_update
data: {"rescuerId":"456","id":"456","name":"Fatima Ahmadi","latitude":35.7000,"longitude":51.4000,"status":"busy","timestamp":"2024-11-15T10:30:05Z"}

event: location_update
data: {"rescuerId":"789","id":"789","name":"Ali Mohammadi","latitude":35.6950,"longitude":51.3950,"status":"inactive","timestamp":"2024-11-15T10:30:10Z"}
```

**Event Data Format:**
```json
{
  "rescuerId": "string",      // Unique rescuer ID
  "id": "string",             // Same as rescuerId (for compatibility)
  "name": "string",           // Rescuer's full name
  "latitude": number,         // Latitude coordinate
  "longitude": number,        // Longitude coordinate
  "status": "string",         // One of: "active", "inactive", "busy"
  "timestamp": "string"       // ISO 8601 datetime
}
```

**Status Codes:**
- `200 OK` - Stream established successfully
- `401 Unauthorized` - Invalid or missing auth token
- `403 Forbidden` - User doesn't have admin permissions
- `500 Internal Server Error` - Server error

**Notes:**
- Keep connection open indefinitely
- Send heartbeat/ping every 30 seconds to keep connection alive
- Handle reconnection on client side

---

### 2. Update Location

**Endpoint:** `POST /api/v1/location/update`

**Purpose:** Receive location updates from rescuer devices

**Authentication:** Bearer token required

**Request:**
```http
POST /api/v1/location/update HTTP/1.1
Host: your-api-domain.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "latitude": 35.6892,
  "longitude": 51.3890,
  "timestamp": "2024-11-15T10:30:00Z"
}
```

**Request Body:**
```json
{
  "latitude": number,         // Required: Latitude coordinate
  "longitude": number,        // Required: Longitude coordinate
  "timestamp": "string"       // Required: ISO 8601 datetime
}
```

**Success Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "rescuerId": "123",
    "latitude": 35.6892,
    "longitude": 51.3890,
    "timestamp": "2024-11-15T10:30:00Z",
    "status": "active"
  }
}
```

**Error Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "message": "Invalid coordinates",
  "errors": {
    "latitude": "Latitude must be between -90 and 90",
    "longitude": "Longitude must be between -180 and 180"
  }
}
```

**Status Codes:**
- `200 OK` - Location updated successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid or missing auth token
- `403 Forbidden` - User doesn't have rescuer permissions
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Implementation Examples

### Node.js + Express (SSE Endpoint)

```javascript
const express = require('express');
const router = express.Router();

// Store active SSE clients
const sseClients = new Map();

// SSE Location Stream
router.get('/api/v1/sse/location/stream', authenticateToken, checkAdminRole, (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send initial connection message
  res.write('event: connected\n');
  res.write('data: {"message":"Connected to location stream"}\n\n');
  
  // Store client connection
  const clientId = Date.now();
  sseClients.set(clientId, res);
  
  console.log(`SSE Client connected: ${clientId}`);
  
  // Remove client on disconnect
  req.on('close', () => {
    console.log(`SSE Client disconnected: ${clientId}`);
    sseClients.delete(clientId);
  });
  
  // Keep-alive ping every 30 seconds
  const keepAliveInterval = setInterval(() => {
    if (sseClients.has(clientId)) {
      res.write(':ping\n\n');
    } else {
      clearInterval(keepAliveInterval);
    }
  }, 30000);
});

// Function to broadcast location updates to all SSE clients
function broadcastLocationUpdate(locationData) {
  const message = `event: location_update\ndata: ${JSON.stringify(locationData)}\n\n`;
  
  sseClients.forEach((client, clientId) => {
    try {
      client.write(message);
    } catch (error) {
      console.error(`Error sending to client ${clientId}:`, error);
      sseClients.delete(clientId);
    }
  });
}

// Update Location Endpoint
router.post('/api/v1/location/update', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, timestamp } = req.body;
    const rescuerId = req.user.id; // From auth token
    
    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90'
      });
    }
    
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180'
      });
    }
    
    // Update location in database
    await db.query(
      'UPDATE rescuers SET latitude = ?, longitude = ?, last_update = ? WHERE id = ?',
      [latitude, longitude, timestamp || new Date(), rescuerId]
    );
    
    // Get rescuer details
    const rescuer = await db.query(
      'SELECT id, name, status FROM rescuers WHERE id = ?',
      [rescuerId]
    );
    
    // Prepare location update data
    const locationUpdate = {
      rescuerId: rescuerId,
      id: rescuerId,
      name: rescuer[0].name,
      latitude: latitude,
      longitude: longitude,
      status: rescuer[0].status || 'active',
      timestamp: timestamp || new Date().toISOString()
    };
    
    // Broadcast to all SSE clients
    broadcastLocationUpdate(locationUpdate);
    
    // Send response
    res.json({
      success: true,
      message: 'Location updated successfully',
      data: locationUpdate
    });
    
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = { router, broadcastLocationUpdate };
```

### Python + Flask (SSE Endpoint)

```python
from flask import Flask, Response, request, jsonify
import json
import time
from datetime import datetime

app = Flask(__name__)

# Store active SSE clients
sse_clients = []

@app.route('/api/v1/sse/location/stream')
@require_auth
@require_admin_role
def location_stream():
    def event_stream():
        # Send initial connection message
        yield f"event: connected\ndata: {json.dumps({'message': 'Connected to location stream'})}\n\n"
        
        # Keep connection alive
        while True:
            # Send keep-alive ping every 30 seconds
            yield ":ping\n\n"
            time.sleep(30)
    
    return Response(
        event_stream(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        }
    )

@app.route('/api/v1/location/update', methods=['POST'])
@require_auth
def update_location():
    data = request.get_json()
    
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    timestamp = data.get('timestamp', datetime.utcnow().isoformat())
    
    # Validate
    if not latitude or not longitude:
        return jsonify({
            'success': False,
            'message': 'Latitude and longitude are required'
        }), 400
    
    if not (-90 <= latitude <= 90):
        return jsonify({
            'success': False,
            'message': 'Latitude must be between -90 and 90'
        }), 400
    
    if not (-180 <= longitude <= 180):
        return jsonify({
            'success': False,
            'message': 'Longitude must be between -180 and 180'
        }), 400
    
    # Update database
    rescuer_id = request.user_id  # From auth middleware
    
    # Update location in database
    db.execute(
        "UPDATE rescuers SET latitude = ?, longitude = ?, last_update = ? WHERE id = ?",
        (latitude, longitude, timestamp, rescuer_id)
    )
    
    # Get rescuer details
    rescuer = db.query("SELECT * FROM rescuers WHERE id = ?", (rescuer_id,))[0]
    
    # Broadcast to SSE clients
    location_update = {
        'rescuerId': rescuer_id,
        'id': rescuer_id,
        'name': rescuer['name'],
        'latitude': latitude,
        'longitude': longitude,
        'status': rescuer['status'],
        'timestamp': timestamp
    }
    
    broadcast_location_update(location_update)
    
    return jsonify({
        'success': True,
        'message': 'Location updated successfully',
        'data': location_update
    })
```

---

## Database Schema

### Suggested table structure:

```sql
CREATE TABLE rescuers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  status ENUM('active', 'inactive', 'busy') DEFAULT 'inactive',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_location (latitude, longitude)
);

CREATE TABLE location_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rescuer_id VARCHAR(36) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy FLOAT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rescuer_id) REFERENCES rescuers(id) ON DELETE CASCADE,
  INDEX idx_rescuer_timestamp (rescuer_id, timestamp)
);
```

---

## Security Considerations

1. **Authentication:**
   - Always validate JWT tokens
   - Check token expiration
   - Verify user permissions (admin for stream, rescuer for updates)

2. **Rate Limiting:**
   - Limit location updates to 1 per 5 seconds per rescuer
   - Limit SSE connections to 3 per admin user

3. **Input Validation:**
   - Validate latitude (-90 to 90)
   - Validate longitude (-180 to 180)
   - Sanitize all inputs

4. **CORS:**
   - Configure proper CORS headers
   - Whitelist allowed origins

5. **Connection Management:**
   - Clean up disconnected SSE clients
   - Implement timeout for inactive connections
   - Monitor memory usage

---

## Testing

### Test SSE with curl:

```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: text/event-stream" \
     http://localhost:3000/api/v1/sse/location/stream
```

### Test location update:

```bash
curl -X POST http://localhost:3000/api/v1/location/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 35.6892,
    "longitude": 51.3890,
    "timestamp": "2024-11-15T10:30:00Z"
  }'
```

---

## Performance Optimization

1. **Throttle updates:** Only send significant location changes (>10 meters)
2. **Batch processing:** Group updates if many rescuers update simultaneously
3. **Database indexing:** Index latitude, longitude, and timestamp columns
4. **Caching:** Cache rescuer details to avoid repeated database queries
5. **Connection pooling:** Use connection pooling for database
6. **Compression:** Enable gzip compression for SSE streams

---

For implementation questions, refer to the frontend documentation at `src/components/LOCATION_TRACKING_README.md`

