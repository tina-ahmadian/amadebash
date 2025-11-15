# Quick Integration Guide - Live Location Tracking

This guide shows you exactly how to add live location tracking to your existing dashboards.

## 📋 Prerequisites

1. ✅ Google Maps library installed (`@react-google-maps/api`)
2. ✅ All location tracking components created in `/src/components/`
3. ✅ LocationStreamService created in `/src/services/`
4. ✅ Environment variable `REACT_APP_GOOGLE_MAPS_API_KEY` set

## 🎯 Quick Start - Add to AdminDashboard

### Step 1: Import the Component

Add this import to `src/components/AdminDashboard.tsx` (around line 8):

```typescript
import RescuerLiveMap from './RescuerLiveMap';
```

### Step 2: Add "Live Map" to Menu Items

Update the `menuItems` array (around line 79):

```typescript
const menuItems = [
  { id: 'dashboard', label: 'صفحه‌ی اصلی', icon: Home },
  { id: 'liveMap', label: 'نقشه زنده', icon: MapPin },  // ← ADD THIS LINE
  { id: 'incidents', label: 'حوادث', icon: AlertTriangle },
  { id: 'responders', label: 'امدادگران', icon: Users },
  { id: 'bases', label: 'پایگاه‌های امدادی', icon: Building2 },
  { id: 'settings', label: 'تنظیمات', icon: Settings },
];
```

### Step 3: Update PageView Type

Update the `PageView` type (around line 12):

```typescript
type PageView = 'dashboard' | 'liveMap' | 'incidents' | 'responders' | 'bases' | 'settings';
//                              ↑ ADD THIS
```

### Step 4: Add the Live Map Page

Find the section where pages are rendered (look for where `currentPage === 'dashboard'` is checked), and add this case:

```typescript
{currentPage === 'liveMap' && (
  <div className="h-[calc(100vh-80px)]">
    <RescuerLiveMap
      apiBaseUrl="/api"
      authToken={localStorage.getItem('authToken') || undefined}
    />
  </div>
)}
```

**Complete example of the content section:**

```typescript
{/* Content Area */}
<div className="flex-1 overflow-auto">
  {currentPage === 'dashboard' && (
    <>
      {/* ... existing dashboard content ... */}
    </>
  )}

  {currentPage === 'liveMap' && (
    <div className="h-[calc(100vh-80px)]">
      <RescuerLiveMap
        apiBaseUrl="/api"
        authToken={localStorage.getItem('authToken') || undefined}
      />
    </div>
  )}

  {currentPage === 'incidents' && <IncidentsPage alerts={alerts} />}
  {currentPage === 'responders' && <RespondersInfoPage />}
  {currentPage === 'bases' && <BasesPage bases={bases} />}
  {currentPage === 'settings' && <SettingsPage />}
</div>
```

## 🎯 Quick Start - Add to ResponderDashboard

### Step 1: Import the Component

Add this import to `src/components/ResponderDashboard.tsx` (around line 3):

```typescript
import RescuerLocationUpdater from './RescuerLocationUpdater';
```

### Step 2: Add Location Updater Section

Add this section before or after the alerts section (around line 180-200):

```typescript
{/* Location Tracking Section */}
<div className="mb-6">
  <RescuerLocationUpdater
    apiBaseUrl="/api"
    authToken={localStorage.getItem('authToken') || undefined}
  />
</div>
```

**Example placement in ResponderDashboard:**

```typescript
return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
    {/* Header */}
    <header className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
      {/* ... existing header content ... */}
    </header>

    {/* Main Content */}
    <main className="max-w-7xl mx-auto px-4 py-6">
      
      {/* ADD LOCATION TRACKING HERE */}
      <div className="mb-6">
        <RescuerLocationUpdater
          apiBaseUrl="/api"
          authToken={localStorage.getItem('authToken') || undefined}
        />
      </div>

      {/* Existing Alerts Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">اعلان‌های فعال</h2>
        {/* ... existing alerts rendering ... */}
      </div>
    </main>
  </div>
);
```

## 🔧 Alternative: Collapsible Location Tracker

For a cleaner UI, make it collapsible:

```typescript
const [showLocationTracker, setShowLocationTracker] = useState(false);

// In your render:
<div className="mb-6">
  <button
    onClick={() => setShowLocationTracker(!showLocationTracker)}
    className="w-full bg-white rounded-lg shadow p-4 flex items-center justify-between hover:bg-gray-50 transition"
  >
    <div className="flex items-center gap-2">
      <MapPin className="w-5 h-5 text-red-600" />
      <span className="font-bold text-gray-800">ردیابی موقعیت</span>
    </div>
    <ChevronDown className={`w-5 h-5 transform transition ${showLocationTracker ? 'rotate-180' : ''}`} />
  </button>
  
  {showLocationTracker && (
    <div className="mt-4">
      <RescuerLocationUpdater
        apiBaseUrl="/api"
        authToken={localStorage.getItem('authToken') || undefined}
      />
    </div>
  )}
</div>
```

## 🌍 Environment Setup

Create a `.env` file in the project root (`amadebash/project/.env`):

```env
# Google Maps API Key (REQUIRED)
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# API Base URL (Optional - defaults to /api)
REACT_APP_API_BASE_URL=/api
```

### How to get Google Maps API Key:

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "Maps JavaScript API"
4. Go to Credentials → Create Credentials → API Key
5. Copy the API key
6. (Optional) Restrict the key to your domain

## 🧪 Testing

### Test Admin Live Map:

1. Start your dev server: `npm run dev`
2. Login as admin
3. Click on "نقشه زنده" in the sidebar
4. You should see the Google Map with rescuers

### Test Rescuer Location Updater:

1. Login as responder
2. You should see the location tracker component
3. Click "شروع ردیابی"
4. Grant location permissions when prompted
5. Your location should be sent to the backend

## 🔍 Troubleshooting

### Issue: "Google is not defined"

**Cause:** API key not set or invalid

**Solution:** 
- Check `.env` file exists and has `REACT_APP_GOOGLE_MAPS_API_KEY`
- Restart dev server after adding `.env`
- Verify API key is valid in Google Cloud Console

### Issue: Map not showing

**Cause:** Missing API key or height not set

**Solution:**
```typescript
// Ensure parent div has height
<div className="h-[600px]">  {/* or h-screen, h-full */}
  <RescuerLiveMap ... />
</div>
```

### Issue: Geolocation error "Permission denied"

**Cause:** Browser blocked location access

**Solution:**
- Click the location icon in browser address bar
- Allow location access
- Use HTTPS (geolocation requires secure context)

### Issue: SSE not connecting

**Cause:** Backend endpoint not implemented

**Solution:**
- Verify backend implements `GET /api/v1/sse/location/stream`
- Check backend CORS settings
- Check auth token is valid

## 📱 Mobile Considerations

For best mobile experience, add viewport meta tag in `index.html`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

## 🎨 Customization

### Change marker colors:

Edit `RescuerLiveMap.jsx`, find `getMarkerColor()` function:

```javascript
const getMarkerColor = (status) => {
  switch (status) {
    case 'active':
      return '#YOUR_COLOR'; // Change colors here
    // ...
  }
};
```

### Change update frequency:

Edit `LocationStreamService.js`, add throttling:

```javascript
async updateLocation(latitude, longitude) {
  // Add minimum time between updates
  const now = Date.now();
  if (now - this.lastUpdateTime < 5000) { // 5 seconds minimum
    return;
  }
  this.lastUpdateTime = now;
  
  // ... rest of code
}
```

## ✅ Verification Checklist

- [ ] `@react-google-maps/api` installed
- [ ] `.env` file created with Google Maps API key
- [ ] Dev server restarted after adding `.env`
- [ ] Import statements added to dashboards
- [ ] Components added to UI
- [ ] Location permissions granted in browser
- [ ] Backend endpoints implemented
- [ ] HTTPS enabled for production

## 📞 Need Help?

If you encounter issues:

1. Check browser console for errors
2. Check network tab for failed requests
3. Verify auth token is present in localStorage
4. Ensure backend endpoints are running
5. Review the detailed README at `src/components/LOCATION_TRACKING_README.md`

---

🎉 **That's it!** You now have a complete real-time location tracking system integrated into your application.

