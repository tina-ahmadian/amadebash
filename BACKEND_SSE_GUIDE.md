# راهنمای پیاده‌سازی SSE Backend برای Live Location Tracking

## 📋 خلاصه

برای فعال‌سازی ردیابی زنده موقعیت امدادگران، باید این endpoint را روی backend پیاده‌سازی کنید.

---

## 🔌 Endpoint مورد نیاز

### GET `/api/api/v1/sse/location/stream`

**آدرس کامل بک‌اند:** `http://87.107.174.39/api/api/v1/sse/location/stream`

**نوع:** Server-Sent Events (SSE)  
**احراز هویت:** Bearer Token (Authorization header)

### Headers:
```http
GET /api/api/v1/sse/location/stream HTTP/1.1
Host: 87.107.174.39
Authorization: Bearer <token>
Accept: text/event-stream
Cache-Control: no-cache
```

### Response Format:
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

event: location_update
data: {"rescuerId": 1, "name": "امدادگر احمد", "latitude": 35.6892, "longitude": 51.3890, "status": "active", "timestamp": "2024-01-15T10:30:00Z"}

event: location_update
data: {"rescuerId": 2, "name": "امدادگر سارا", "latitude": 35.6992, "longitude": 51.4090, "status": "busy", "timestamp": "2024-01-15T10:30:05Z"}
```

---

## 🐍 مثال پیاده‌سازی با FastAPI (Python)

```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator
import asyncio
import json

app = FastAPI()

async def location_stream(user_id: int) -> AsyncGenerator[str, None]:
    """
    Stream location updates for rescuers
    """
    try:
        while True:
            # دریافت موقعیت‌های جدید از دیتابیس
            locations = await get_active_rescuer_locations()
            
            for location in locations:
                # Format SSE message
                event_data = {
                    "rescuerId": location.rescuer_id,
                    "name": location.rescuer_name,
                    "latitude": location.latitude,
                    "longitude": location.longitude,
                    "status": location.status,
                    "timestamp": location.updated_at.isoformat()
                }
                
                # Send SSE event
                yield f"event: location_update\n"
                yield f"data: {json.dumps(event_data)}\n\n"
            
            # فاصله بین update ها (5 ثانیه)
            await asyncio.sleep(5)
            
    except asyncio.CancelledError:
        # Client disconnected
        pass

@app.get("/api/api/v1/sse/location/stream")
async def stream_rescuer_locations(
    current_user = Depends(get_current_user)
):
    """
    SSE endpoint for live location streaming
    """
    return StreamingResponse(
        location_stream(current_user.id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # برای Nginx
        }
    )
```

---

## 🟢 مثال پیاده‌سازی با Node.js/Express

```javascript
const express = require('express');
const router = express.Router();

router.get('/api/api/v1/sse/location/stream', async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Verify authentication
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }

  // Send initial heartbeat
  res.write(': heartbeat\n\n');

  // Stream location updates
  const intervalId = setInterval(async () => {
    try {
      const locations = await getActiveRescuerLocations();
      
      locations.forEach(location => {
        const eventData = {
          rescuerId: location.rescuer_id,
          name: location.rescuer_name,
          latitude: location.latitude,
          longitude: location.longitude,
          status: location.status,
          timestamp: location.updated_at
        };
        
        res.write(`event: location_update\n`);
        res.write(`data: ${JSON.stringify(eventData)}\n\n`);
      });
    } catch (error) {
      console.error('Error streaming locations:', error);
    }
  }, 5000); // هر 5 ثانیه

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
});

module.exports = router;
```

---

## 🗄️ ساختار دیتابیس پیشنهادی

```sql
CREATE TABLE rescuer_locations (
    id SERIAL PRIMARY KEY,
    rescuer_id INTEGER NOT NULL REFERENCES users(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',  -- active, busy, inactive
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX idx_rescuer_locations_updated 
ON rescuer_locations(updated_at DESC);

CREATE INDEX idx_rescuer_locations_status 
ON rescuer_locations(status);
```

---

## ✅ تست Endpoint

### با curl:
```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: text/event-stream" \
     http://localhost:8000/api/api/v1/sse/location/stream
```

### انتظار خروجی:
```
event: location_update
data: {"rescuerId":1,"name":"امدادگر احمد","latitude":35.6892,"longitude":51.3890,"status":"active","timestamp":"2024-01-15T10:30:00Z"}

event: location_update
data: {"rescuerId":2,"name":"امدادگر سارا","latitude":35.6992,"longitude":51.4090,"status":"busy","timestamp":"2024-01-15T10:30:05Z"}
```

---

## 🔐 نکات امنیتی

1. ✅ **احراز هویت:** همیشه token را verify کنید
2. ✅ **مجوز دسترسی:** فقط admin ها باید دسترسی داشته باشند
3. ✅ **Rate Limiting:** محدودیت تعداد connection ها
4. ✅ **Timeout:** قطع connection های طولانی (مثلاً بعد از 1 ساعت)

---

## 📊 Performance Tips

1. **Caching:** از Redis برای cache کردن موقعیت‌های اخیر استفاده کنید
2. **Database Query:** فقط موقعیت‌های updated شده را query کنید
3. **Connection Pool:** تعداد connection های همزمان را محدود کنید
4. **Compression:** از gzip compression استفاده کنید

---

## 🚀 فعال‌سازی در Frontend

بعد از پیاده‌سازی backend، در فایل `RescuerLiveMap.jsx` این خطوط را uncomment کنید:

```javascript
// خطوط 93-99
console.log('[RescuerLiveMap] Component mounted, starting location stream...');
LiveLocationService.startStream(handleLocationUpdate, handleError);

return () => {
  console.log('[RescuerLiveMap] Component unmounting, stopping stream...');
  LiveLocationService.stopStream();
};
```

و پیام آبی در بالای نقشه را حذف کنید.

---

## 📞 پشتیبانی

در صورت نیاز به کمک برای پیاده‌سازی، به مستندات FastAPI یا Express SSE مراجعه کنید:
- FastAPI: https://fastapi.tiangolo.com/
- Express SSE: https://masteringjs.io/tutorials/express/server-sent-events

