# Live Location Tracking System Documentation

## Overview

This system provides real-time location tracking for rescuers using Server-Sent Events (SSE) and Google Maps integration.

## Components

### 1. LocationStreamService (`/services/LocationStreamService.js`)

A service class that handles:
- SSE connection to backend for real-time location updates
- Sending location updates to the backend
- Connection management and error handling

**Key Methods:**

```javascript
// Initialize with API base URL and auth token
locationStreamService.initialize(apiBaseUrl, authToken);

// Start streaming location updates
locationStreamService.startStreaming(onUpdate, onError);

// Send location update to backend
await locationStreamService.updateLocation(latitude, longitude);

// Stop streaming
locationStreamService.stopStreaming();
```

**Backend Endpoints:**
- `GET /api/v1/sse/location/stream` - SSE endpoint for real-time updates
- `POST /api/v1/location/update` - Endpoint to send location updates

### 2. RescuerLiveMap (`/components/RescuerLiveMap.jsx`)

Admin panel component that displays all rescuers on a Google Map with real-time updates.

**Features:**
- Real-time marker updates via SSE (no polling)
- Color-coded markers based on rescuer status:
  - 🟢 Green: active
  - 🔴 Red: inactive
  - 🟠 Orange: busy
  - 🔵 Blue: default
- InfoWindow with rescuer details on marker click
- Live statistics display
- Responsive and full-width design

**Props:**

```javascript
<RescuerLiveMap
  apiBaseUrl="/api"              // API base URL (default: /api)
  authToken={authToken}          // Auth token (default: from localStorage)
  initialRescuers={[]}           // Initial rescuers data (optional)
/>
```

### 3. RescuerLocationUpdater (`/components/RescuerLocationUpdater.jsx`)

Rescuer device component for sending location updates.

**Features:**
- Uses `navigator.geolocation.watchPosition()` for continuous tracking
- Automatic position updates on change
- Real-time status display (idle/updating/success/error)
- Geolocation permission handling
- Error reporting and retry logic
- Display of current coordinates and accuracy

**Props:**

```javascript
<RescuerLocationUpdater
  apiBaseUrl="/api"              // API base URL (default: /api)
  authToken={authToken}          // Auth token (default: from localStorage)
/>
```

## Installation

1. Install required dependencies:

```bash
npm install @react-google-maps/api
```

2. Set up environment variables in `.env`:

```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
REACT_APP_API_BASE_URL=/api
```

## Integration Guide

### Admin Dashboard Integration

Add to `AdminDashboard.tsx`:

```jsx
import RescuerLiveMap from './RescuerLiveMap';

// In your component:
<div className="h-screen">
  <RescuerLiveMap
    apiBaseUrl="/api"
    authToken={localStorage.getItem('authToken')}
  />
</div>
```

### Rescuer Dashboard Integration

Add to `ResponderDashboard.tsx`:

```jsx
import RescuerLocationUpdater from './RescuerLocationUpdater';

// In your component:
<RescuerLocationUpdater
  apiBaseUrl="/api"
  authToken={localStorage.getItem('authToken')}
/>
```

### Complete Demo

Use the `LocationTrackingDemo` component to see both features:

```jsx
import LocationTrackingDemo from './components/LocationTrackingDemo';

// In App.tsx or routing:
<LocationTrackingDemo />
```

## Backend Requirements

Your backend must implement these endpoints:

### 1. SSE Location Stream

```
GET /api/v1/sse/location/stream
Authorization: Bearer {token}
Accept: text/event-stream
```

**Response Format:**

```
event: location_update
data: {"rescuerId":"123","id":"123","name":"Ahmad","latitude":35.6892,"longitude":51.3890,"status":"active","timestamp":"2024-01-01T12:00:00Z"}

event: location_update
data: {"rescuerId":"456","id":"456","name":"Fatima","latitude":35.7000,"longitude":51.4000,"status":"busy","timestamp":"2024-01-01T12:01:00Z"}
```

### 2. Location Update

```
POST /api/v1/location/update
Authorization: Bearer {token}
Content-Type: application/json

{
  "latitude": 35.6892,
  "longitude": 51.3890,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "latitude": 35.6892,
    "longitude": 51.3890,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable "Maps JavaScript API"
4. Create credentials (API key)
5. Restrict the API key (optional but recommended):
   - Application restrictions: HTTP referrers
   - API restrictions: Maps JavaScript API
6. Add the key to your `.env` file

## Usage Examples

### Example 1: Basic Admin Map

```jsx
import React from 'react';
import RescuerLiveMap from './components/RescuerLiveMap';

function AdminPanel() {
  return (
    <div style={{ height: '600px' }}>
      <RescuerLiveMap />
    </div>
  );
}
```

### Example 2: Rescuer Location Sender

```jsx
import React from 'react';
import RescuerLocationUpdater from './components/RescuerLocationUpdater';

function RescuerDevice() {
  return (
    <div className="container mx-auto p-4">
      <RescuerLocationUpdater />
    </div>
  );
}
```

### Example 3: With Custom Initial Data

```jsx
const initialRescuers = [
  {
    id: '1',
    name: 'احمد رضایی',
    latitude: 35.6892,
    longitude: 51.3890,
    status: 'active',
    lastUpdate: new Date().toISOString(),
  },
];

<RescuerLiveMap
  initialRescuers={initialRescuers}
  apiBaseUrl="/api"
/>
```

## Troubleshooting

### Issue: Map not showing

**Solution:** 
- Verify `REACT_APP_GOOGLE_MAPS_API_KEY` is set correctly
- Check browser console for API key errors
- Ensure Maps JavaScript API is enabled in Google Cloud Console

### Issue: Geolocation not working

**Solution:**
- Ensure HTTPS is used (geolocation requires secure context)
- Check browser permissions for location access
- Verify device has GPS/location services enabled

### Issue: SSE not connecting

**Solution:**
- Verify backend SSE endpoint is working
- Check authentication token is valid
- Ensure CORS is configured correctly on backend
- Check network tab for SSE connection status

### Issue: Location updates not sending

**Solution:**
- Verify auth token is present in localStorage
- Check backend `/api/v1/location/update` endpoint
- Review browser console for error messages
- Ensure network connectivity

## Security Considerations

1. **Always use HTTPS** for production deployments
2. **Restrict Google Maps API key** to your domain
3. **Validate authentication tokens** on every backend request
4. **Rate limit location updates** on the backend
5. **Implement proper CORS** policies
6. **Don't expose sensitive data** in SSE streams

## Performance Tips

1. **Map rendering:** Initial markers are batched for better performance
2. **Location updates:** Automatic throttling prevents excessive updates
3. **SSE reconnection:** Automatic reconnection on connection loss
4. **Geolocation accuracy:** Set `enableHighAccuracy: true` only when needed

## Browser Compatibility

- **Chrome/Edge:** Full support
- **Firefox:** Full support
- **Safari:** Full support (iOS 13+)
- **Opera:** Full support

**Requirements:**
- ES6+ support
- Geolocation API
- Fetch API
- ReadableStream API (for SSE)

## License

Part of the Helal Ahmar (Red Crescent) emergency management system.

---

For questions or issues, please contact the development team.

