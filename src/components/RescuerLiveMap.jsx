import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LiveLocationService from '../services/LiveLocationService';

const defaultCenter = [35.6892, 51.3890];

const getMarkerColor = (status) => {
  const colors = {
    active: '#10B981',
    inactive: '#EF4444',
    busy: '#F97316',
    default: '#3B82F6',
  };
  return colors[status] || colors.default;
};

// Component to update map center and fix size issues
const MapUpdater = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    // Fix map size on mount
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
};

// Create custom marker icon for rescuers
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: ${color};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Create base icon (Red Crescent)
const createBaseIcon = () => {
  const svg = `<svg width="58" height="70" viewBox="0 0 58 70" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow-base" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.25"/>
      </filter>
    </defs>
    <g filter="url(#shadow-base)" transform="translate(0 3)">
      <!-- Background circle -->
      <circle cx="29" cy="28" r="24" fill="#FFFFFF" />
      
      <!-- Red Crescent (Hilal) -->
      <g transform="translate(29, 28)">
        <!-- Main red circle representing the moon -->
        <circle cx="0" cy="0" r="16" fill="#E60000"/>
        
        <!-- White circle to create the crescent shape -->
        <circle cx="4" cy="-2" r="13" fill="#FFFFFF"/>
      </g>
      
      <!-- Border circle -->
      <circle cx="29" cy="28" r="24" fill="none" stroke="#E60000" stroke-width="2.5"/>
    </g>
    <!-- Shadow -->
    <ellipse cx="29" cy="58" rx="12" ry="4" fill="rgba(0,0,0,0.12)"/>
  </svg>`;

  const encodedSvg = encodeURIComponent(svg);
  return new L.Icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodedSvg}`,
    iconSize: [58, 70],
    iconAnchor: [29, 31],
    popupAnchor: [0, -31]
  });
};

const baseIcon = createBaseIcon();

const RescuerLiveMap = () => {
  const [rescuers, setRescuers] = useState([]);
  const [bases, setBases] = useState([]);
  const [selectedRescuer, setSelectedRescuer] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [error, setError] = useState(null);
  const [showMockData, setShowMockData] = useState(false);

  // Mock data for demonstration
  const loadMockData = () => {
    const mockRescuers = [
      {
        id: 1,
        name: 'امدادگر احمد رضایی',
        latitude: 35.6992,
        longitude: 51.3890,
        status: 'active',
        lastUpdate: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'امدادگر سارا محمدی',
        latitude: 35.6792,
        longitude: 51.4090,
        status: 'busy',
        lastUpdate: new Date(Date.now() - 300000).toISOString(),
      },
      {
        id: 3,
        name: 'امدادگر علی کریمی',
        latitude: 35.7092,
        longitude: 51.3690,
        status: 'active',
        lastUpdate: new Date(Date.now() - 120000).toISOString(),
      },
      {
        id: 4,
        name: 'امدادگر فاطمه حسینی',
        latitude: 35.6892,
        longitude: 51.4190,
        status: 'inactive',
        lastUpdate: new Date(Date.now() - 600000).toISOString(),
      },
    ];
    setRescuers(mockRescuers);
    setShowMockData(true);
  };

  const handleLocationUpdate = useCallback((data) => {
    setRescuers((prev) => {
      const index = prev.findIndex((r) => r.id === data.rescuerId || r.id === data.id);
      
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          latitude: data.latitude,
          longitude: data.longitude,
          status: data.status || updated[index].status,
          lastUpdate: data.timestamp || new Date().toISOString(),
        };
        return updated;
      } else {
        return [...prev, {
          id: data.rescuerId || data.id,
          name: data.name || 'امدادگر',
          latitude: data.latitude,
          longitude: data.longitude,
          status: data.status || 'active',
          lastUpdate: data.timestamp || new Date().toISOString(),
        }];
      }
    });
  }, []);

  const handleError = useCallback((err) => {
    setError(err.message);
    setTimeout(() => setError(null), 5000);
  }, []);

  // Fetch bases on mount
  useEffect(() => {
    const fetchBases = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('[RescuerLiveMap] No auth token for fetching bases');
          return;
        }

        const response = await fetch('/api/api/v1/bases', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            console.log('[RescuerLiveMap] Bases loaded:', result.data);
            console.log('[RescuerLiveMap] First base structure:', result.data[0]);
            setBases(result.data);
          }
        } else {
          console.error('[RescuerLiveMap] Failed to fetch bases:', response.status);
        }
      } catch (error) {
        console.error('[RescuerLiveMap] Error fetching bases:', error);
      }
    };

    fetchBases();
  }, []);

  useEffect(() => {
    console.log('[RescuerLiveMap] Component mounted, starting location stream...');
    LiveLocationService.startStream(handleLocationUpdate, handleError);
    
    return () => {
      console.log('[RescuerLiveMap] Component unmounting, stopping stream...');
      LiveLocationService.stopStream();
    };
  }, [handleLocationUpdate, handleError]);

  useEffect(() => {
    if (rescuers.length > 0) {
      const avgLat = rescuers.reduce((sum, r) => sum + parseFloat(r.latitude), 0) / rescuers.length;
      const avgLng = rescuers.reduce((sum, r) => sum + parseFloat(r.longitude), 0) / rescuers.length;
      setCenter([avgLat, avgLng]);
    }
  }, [rescuers]);

  const getStatusLabel = (status) => {
    const labels = {
      active: 'فعال',
      inactive: 'غیرفعال',
      busy: 'مشغول',
    };
    return labels[status] || 'نامشخص';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'نامشخص';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'هم‌اکنون';
      if (diffMins < 60) return `${diffMins} دقیقه پیش`;
      
      const diffHours = Math.floor(diffMins / 60);
      return diffHours < 24 ? `${diffHours} ساعت پیش` : date.toLocaleDateString('fa-IR');
    } catch {
      return 'نامشخص';
    }
  };

  const activeCount = rescuers.filter(r => r.status === 'active').length;
  const busyCount = rescuers.filter(r => r.status === 'busy').length;
  const inactiveCount = rescuers.filter(r => r.status === 'inactive').length;

  return (
    <div className="w-full h-full relative">
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {/* Info message and controls */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-3">
        <span>📍 ردیابی زنده فعال - اتصال به سرور برقرار است</span>
        {!showMockData ? (
          <button
            onClick={loadMockData}
            className="bg-white text-green-600 px-3 py-1 rounded text-xs font-semibold hover:bg-green-50 transition-colors"
          >
            نمایش داده‌های نمونه
          </button>
        ) : (
          <button
            onClick={() => {
              setRescuers([]);
              setShowMockData(false);
            }}
            className="bg-white text-green-600 px-3 py-1 rounded text-xs font-semibold hover:bg-green-50 transition-colors"
          >
            پاک کردن
          </button>
        )}
      </div>

      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4">
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <div className="text-xs text-gray-600">فعال</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{busyCount}</div>
            <div className="text-xs text-gray-600">مشغول</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{inactiveCount}</div>
            <div className="text-xs text-gray-600">غیرفعال</div>
          </div>
          <div className="text-center border-r-2 border-gray-300 pr-4">
            <div className="text-2xl font-bold text-gray-600">{rescuers.length}</div>
            <div className="text-xs text-gray-600">کل امدادگران</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{bases.length}</div>
            <div className="text-xs text-gray-600">🏥 پایگاه‌ها</div>
          </div>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={12}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        zoomControl={true}
        className="z-0"
        whenReady={(map) => {
          setTimeout(() => {
            map.target.invalidateSize();
          }, 100);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} />
        
        {rescuers.map((rescuer) => (
          <Marker
            key={rescuer.id}
            position={[parseFloat(rescuer.latitude), parseFloat(rescuer.longitude)]}
            icon={createCustomIcon(getMarkerColor(rescuer.status))}
            eventHandlers={{
              click: () => setSelectedRescuer(rescuer),
            }}
          >
            <Popup>
              <div className="p-2" dir="rtl">
                <h3 className="font-bold text-lg mb-2">{rescuer.name}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">وضعیت:</span>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: getMarkerColor(rescuer.status) + '20',
                        color: getMarkerColor(rescuer.status),
                      }}
                    >
                      {getStatusLabel(rescuer.status)}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">آخرین بروزرسانی:</span>
                    <span className="mr-2">{formatTime(rescuer.lastUpdate)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    <div>عرض: {parseFloat(rescuer.latitude).toFixed(6)}</div>
                    <div>طول: {parseFloat(rescuer.longitude).toFixed(6)}</div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Display bases */}
        {bases.map((base) => {
          // Check if base has valid coordinates
          if (!base.latitude || !base.longitude) return null;
          
          return (
            <Marker
              key={base.id}
              position={[parseFloat(base.latitude), parseFloat(base.longitude)]}
              icon={baseIcon}
            >
              <Popup>
                <div className="p-2" dir="rtl">
                  <h3 className="font-bold text-lg mb-2 text-red-600">🏥 {base.code || base.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="font-semibold">آدرس:</span>
                      <p className="text-gray-700 mt-1">{base.address}</p>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      <div>عرض: {parseFloat(base.latitude).toFixed(6)}</div>
                      <div>طول: {parseFloat(base.longitude).toFixed(6)}</div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default RescuerLiveMap;

