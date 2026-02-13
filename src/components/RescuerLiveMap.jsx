import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
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

// Create custom location pin icon with person for rescuers based on status color
const createCustomIcon = (color, rescuerId) => {
  // Map color to darker shade for the person icon
  const darkColor = color === '#10B981' ? '#16A34A' : // green -> darker green
                    color === '#EF4444' ? '#DC2626' : // red -> darker red
                    color === '#F97316' ? '#EA580C' : // orange -> darker orange
                    '#3B82F6'; // default blue
  
  // Generate unique filter ID to avoid conflicts
  const filterId = `shadow-rescuer-${rescuerId}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Create HTML element for custom icon with photo circle and arrow
  const html = `
    <div class="custom-rescuer-marker-wrapper" data-rescuer-id="${rescuerId}" style="position: relative; width: 48px; height: 100px; display: flex; flex-direction: column; align-items: center; pointer-events: none;">
      <!-- Photo circle at top -->
      <div style="position: relative; z-index: 10; pointer-events: auto;">
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
        ">👤</div>
        <!-- Arrow button -->
        <div 
          class="arrow-btn-rescuer" 
          data-rescuer-id="${rescuerId}"
          style="
            position: absolute;
            right: -12px;
            top: 50%;
            transform: translateY(-50%);
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #9333EA;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            padding: 0;
            z-index: 11;
            pointer-events: auto;
            transition: background 0.2s;
          "
        >▶</div>
      </div>
      <!-- Small circle connector -->
      <div style="
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #9333EA;
        border: 2px solid #9333EA;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        margin-top: 2px;
        margin-bottom: 2px;
        z-index: 9;
        flex-shrink: 0;
      "></div>
      <!-- Location pin icon -->
      <div style="margin-top: 0;">
        <svg width="48" height="64" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
            </filter>
          </defs>
          <g filter="url(#${filterId})">
            <path d="M 24 4 C 14 4 6 12 6 22 C 6 32 18 48 24 56 C 30 48 42 32 42 22 C 42 12 34 4 24 4 Z" 
                  fill="${color}" stroke="#FFFFFF" stroke-width="1.5"/>
            <circle cx="24" cy="22" r="13" fill="#FFFFFF"/>
            <circle cx="24" cy="16" r="4" fill="#000000"/>
            <path d="M16 27C16 24.7909 17.7909 23 20 23H28C30.2091 23 32 24.7909 32 27V28C32 28.5523 31.5523 29 31 29H17C16.4477 29 16 28.5523 16 28V27Z" fill="#000000"/>
          </g>
        </svg>
      </div>
    </div>
  `;
  
  return new L.DivIcon({
    html: html,
    className: 'custom-rescuer-icon',
    iconSize: [48, 100],
    iconAnchor: [24, 100],
    popupAnchor: [32, -20] // Position popup next to the arrow button
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
  const [incidents, setIncidents] = useState([]);
  const [center, setCenter] = useState(defaultCenter);
  const [error, setError] = useState(null);
  const [showMockData, setShowMockData] = useState(false);
  const markerRefs = useRef({});

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
        baseId: 'mock-base-1',
      },
      {
        id: 2,
        name: 'امدادگر سارا محمدی',
        latitude: 35.6792,
        longitude: 51.4090,
        status: 'busy',
        lastUpdate: new Date(Date.now() - 300000).toISOString(),
        baseId: 'mock-base-2',
      },
      {
        id: 3,
        name: 'امدادگر علی کریمی',
        latitude: 35.7092,
        longitude: 51.3690,
        status: 'active',
        lastUpdate: new Date(Date.now() - 120000).toISOString(),
        baseId: 'mock-base-1',
      },
      {
        id: 4,
        name: 'امدادگر فاطمه حسینی',
        latitude: 35.6892,
        longitude: 51.4190,
        status: 'inactive',
        lastUpdate: new Date(Date.now() - 600000).toISOString(),
        baseId: 'mock-base-3',
      },
    ];
    
    // Mock bases for demonstration
    const mockBases = [
      {
        id: 'mock-base-1',
        code: 'پایگاه 1',
        name: 'پایگاه مرکزی',
        address: 'تهران، میدان ولیعصر',
        latitude: 35.6942,
        longitude: 51.3890,
      },
      {
        id: 'mock-base-2',
        code: 'پایگاه 2',
        name: 'پایگاه شمالی',
        address: 'تهران، میدان ونک',
        latitude: 35.7192,
        longitude: 51.4090,
      },
      {
        id: 'mock-base-3',
        code: 'پایگاه 3',
        name: 'پایگاه جنوبی',
        address: 'تهران، میدان آزادی',
        latitude: 35.6692,
        longitude: 51.3490,
      },
    ];
    
    setRescuers(mockRescuers);
    setBases(mockBases);
    setShowMockData(true);
  };

  const handleLocationUpdate = useCallback((data) => {
    console.log('[RescuerLiveMap] Location update received:', data);
    setRescuers((prev) => {
      console.log('[RescuerLiveMap] Previous rescuers count:', prev.length);
      // Try to find rescuer by different possible ID fields
      const rescuerId = data.rescuerId || data.rescuer_id || data.id;
      const idStr = rescuerId?.toString();
      
      console.log('[RescuerLiveMap] Looking for rescuer with ID:', idStr);
      console.log('[RescuerLiveMap] Available rescuer IDs:', prev.map(r => r.id?.toString()));
      
      const index = prev.findIndex((r) => {
        const rIdStr = r.id?.toString();
        const match = rIdStr === idStr || r.id === rescuerId || r.id?.toString() === rescuerId?.toString();
        if (match) {
          console.log('[RescuerLiveMap] Found matching rescuer:', r.id, 'with data ID:', idStr);
        }
        return match;
      });
      
      if (index !== -1) {
        // Update existing rescuer
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          latitude: data.latitude || data.lat || updated[index].latitude,
          longitude: data.longitude || data.lng || updated[index].longitude,
          status: data.status || updated[index].status,
          lastUpdate: data.timestamp || data.last_update || new Date().toISOString(),
          baseId: data.base_id || data.baseId || updated[index].baseId,
          baseName: data.base_name || data.baseName || updated[index].baseName,
        };
        console.log('[RescuerLiveMap] Updated rescuer:', updated[index]);
        console.log('[RescuerLiveMap] Total rescuers after update:', updated.length);
        return updated;
      } else {
        // Add new rescuer if not found
        const newRescuer = {
          id: idStr || `${Date.now()}-${Math.random()}`,
          name: data.name || 'امدادگر',
          latitude: data.latitude || data.lat || 0,
          longitude: data.longitude || data.lng || 0,
          status: data.status || 'active',
          lastUpdate: data.timestamp || data.last_update || new Date().toISOString(),
          baseId: data.base_id || data.baseId || null,
          baseName: data.base_name || data.baseName || null,
        };
        console.log('[RescuerLiveMap] Added new rescuer:', newRescuer);
        const newList = [...prev, newRescuer];
        console.log('[RescuerLiveMap] Total rescuers after adding:', newList.length);
        return newList;
      }
    });
  }, []);

  const handleError = useCallback((err) => {
    setError(err.message);
    setTimeout(() => setError(null), 5000);
  }, []);

  // Fetch responders from API on mount
  useEffect(() => {
    const fetchResponders = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('[RescuerLiveMap] No auth token for fetching responders');
          return;
        }

        const response = await fetch('/apis/rescue-link/v1/rescuers', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[RescuerLiveMap] Rescuers API Response:', data);
          
          // Handle different possible response structures
          let respondersData = Array.isArray(data) ? data : data.data || data.rescuers || [];
          
          // Map API data to rescuers format
          const mappedRescuers = respondersData.map((rescuer) => ({
            id: rescuer.id?.toString() || `${Date.now()}-${Math.random()}`,
            name: rescuer.name || 'امدادگر',
            latitude: rescuer.latitude || 0,
            longitude: rescuer.longitude || 0,
            status: rescuer.status || 'inactive',
            lastUpdate: rescuer.last_update || new Date().toISOString(),
            baseId: rescuer.base_id || rescuer.baseId || null,
            baseName: rescuer.base_name || rescuer.baseName || null,
          }));
          
          console.log('[RescuerLiveMap] Mapped rescuers:', mappedRescuers);
          console.log('[RescuerLiveMap] Total rescuers count:', mappedRescuers.length);
          console.log('[RescuerLiveMap] Rescuers with valid locations:', mappedRescuers.filter(r => {
            const lat = parseFloat(r.latitude);
            const lng = parseFloat(r.longitude);
            return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
          }).length);
          setRescuers(mappedRescuers);
        } else {
          console.error('[RescuerLiveMap] Failed to fetch responders:', response.status);
        }
      } catch (error) {
        console.error('[RescuerLiveMap] Error fetching responders:', error);
      }
    };

    fetchResponders();
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

        const response = await fetch('/apis/rescue-link/v1/bases', {
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

  // Fetch incidents/accidents on mount
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('[RescuerLiveMap] No auth token for fetching incidents');
          return;
        }

        const response = await fetch('/apis/rescue-link/v1/accidents', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[RescuerLiveMap] Incidents API Response:', data);
          
          // Handle different possible response structures
          let incidentsData = [];
          if (data.success && Array.isArray(data.data)) {
            incidentsData = data.data;
          } else if (Array.isArray(data)) {
            incidentsData = data;
          } else if (data.data && Array.isArray(data.data)) {
            incidentsData = data.data;
          }
          
          console.log('[RescuerLiveMap] Incidents loaded:', incidentsData);
          setIncidents(incidentsData);
        } else {
          console.error('[RescuerLiveMap] Failed to fetch incidents:', response.status);
        }
      } catch (error) {
        console.error('[RescuerLiveMap] Error fetching incidents:', error);
      }
    };

    fetchIncidents();
  }, []);

  useEffect(() => {
    console.log('[RescuerLiveMap] Component mounted, starting location stream...');
    LiveLocationService.startStream(handleLocationUpdate, handleError);
    
    return () => {
      console.log('[RescuerLiveMap] Component unmounting, stopping stream...');
      LiveLocationService.stopStream();
    };
  }, [handleLocationUpdate, handleError]);

  // Add event listeners for arrow buttons to open popup
  useEffect(() => {
    const handleArrowClick = (e) => {
      const arrowBtn = e.target.closest('.arrow-btn-rescuer');
      if (arrowBtn) {
        e.stopPropagation();
        e.preventDefault();
        const rescuerId = arrowBtn.getAttribute('data-rescuer-id');
        if (rescuerId && markerRefs.current[rescuerId]) {
          const marker = markerRefs.current[rescuerId];
          if (marker && marker.leafletElement) {
            // Close popup first if open, then open it to ensure it always opens
            marker.leafletElement.closePopup();
            setTimeout(() => {
              marker.leafletElement.openPopup();
            }, 10);
          }
        }
      }
    };

    // Use event delegation on document with a small delay to ensure markers are rendered
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleArrowClick, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleArrowClick, true);
    };
  }, [rescuers]);

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

  const getBaseName = (rescuer) => {
    // First check if baseName is directly available
    if (rescuer.baseName) return rescuer.baseName;
    
    // Then check if baseId is available and find the base
    if (rescuer.baseId) {
      const base = bases.find(b => b.id?.toString() === rescuer.baseId?.toString());
      if (base) {
        return base.name || base.code || 'نامشخص';
      }
    }
    
    return 'نامشخص';
  };

  const activeCount = rescuers.filter(r => r.status === 'active').length;
  const busyCount = rescuers.filter(r => r.status === 'busy').length;
  const inactiveCount = rescuers.filter(r => r.status === 'inactive').length;

  // Helper function to calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Helper function to create curved line points (Bezier curve)
  const createCurvedLine = (start, end) => {
    const [startLat, startLng] = start;
    const [endLat, endLng] = end;
    
    // Calculate midpoint
    const midLat = (startLat + endLat) / 2;
    const midLng = (startLng + endLng) / 2;
    
    // Calculate distance to determine curve height
    const distance = calculateDistance(startLat, startLng, endLat, endLng);
    const curveHeight = distance * 0.15; // 15% of distance as curve height
    
    // Calculate perpendicular direction for curve
    const dx = endLng - startLng;
    const dy = endLat - startLat;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Perpendicular vector (rotated 90 degrees)
    const perpX = -dy / length;
    const perpY = dx / length;
    
    // Control point for Bezier curve (offset from midpoint)
    const controlLat = midLat + perpY * (curveHeight / 111); // Convert km to degrees (approx)
    const controlLng = midLng + perpX * (curveHeight / (111 * Math.cos(midLat * Math.PI / 180)));
    
    // Generate points along the Bezier curve
    const points = [];
    const numPoints = 50; // Number of points for smooth curve
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      // Quadratic Bezier curve formula
      const lat = (1 - t) * (1 - t) * startLat + 2 * (1 - t) * t * controlLat + t * t * endLat;
      const lng = (1 - t) * (1 - t) * startLng + 2 * (1 - t) * t * controlLng + t * t * endLng;
      points.push([lat, lng]);
    }
    
    return points;
  };

  // Calculate connection lines between bases and accepted rescuers
  const connectionLines = useMemo(() => {
    const lines = [];
    
    // If showing mock data, connect each rescuer to nearest base
    if (showMockData && bases.length > 0) {
      rescuers.forEach((rescuer) => {
        if (!rescuer.latitude || !rescuer.longitude) return;
        
        const rescuerLat = parseFloat(rescuer.latitude);
        const rescuerLng = parseFloat(rescuer.longitude);
        
        if (isNaN(rescuerLat) || isNaN(rescuerLng) || rescuerLat === 0 || rescuerLng === 0) {
          return;
        }
        
        // Find nearest base
        let nearestBase = null;
        let minDistance = Infinity;
        
        bases.forEach((base) => {
          if (!base.latitude || !base.longitude) return;
          
          const baseLat = parseFloat(base.latitude);
          const baseLng = parseFloat(base.longitude);
          
          if (isNaN(baseLat) || isNaN(baseLng) || baseLat === 0 || baseLng === 0) {
            return;
          }
          
          const distance = calculateDistance(rescuerLat, rescuerLng, baseLat, baseLng);
          if (distance < minDistance) {
            minDistance = distance;
            nearestBase = base;
          }
        });
        
        // Create curved line from rescuer to nearest base
        if (nearestBase) {
          const baseLat = parseFloat(nearestBase.latitude);
          const baseLng = parseFloat(nearestBase.longitude);
          
          const startPoint = [baseLat, baseLng];
          const endPoint = [rescuerLat, rescuerLng];
          const curvedPoints = createCurvedLine(startPoint, endPoint);
          
          lines.push({
            id: `mock-${rescuer.id}-${nearestBase.id}`,
            positions: curvedPoints,
            baseId: nearestBase.id,
            rescuerId: rescuer.id,
            incidentId: 'mock'
          });
        }
      });
    } else {
      // For real data, use incidents with base_id and accepted_responders
      incidents.forEach((incident) => {
        const baseId = incident.base_id || incident.baseId;
        const acceptedResponderIds = incident.accepted_responders || incident.acceptedResponders || [];
        
        if (!baseId || !acceptedResponderIds || acceptedResponderIds.length === 0) {
          return;
        }
        
        // Find the base
        const base = bases.find(b => b.id?.toString() === baseId?.toString());
        if (!base || !base.latitude || !base.longitude) {
          return;
        }
        
        const basePosition = [parseFloat(base.latitude), parseFloat(base.longitude)];
        
        // For each accepted rescuer, create a line
        acceptedResponderIds.forEach((rescuerId) => {
          const rescuer = rescuers.find(r => {
            const rId = r.id?.toString();
            const acceptedId = rescuerId?.toString();
            return rId === acceptedId;
          });
          
          if (rescuer && rescuer.latitude && rescuer.longitude) {
            const rescuerLat = parseFloat(rescuer.latitude);
            const rescuerLng = parseFloat(rescuer.longitude);
            
            // Only add line if coordinates are valid
            if (!isNaN(rescuerLat) && !isNaN(rescuerLng) && rescuerLat !== 0 && rescuerLng !== 0) {
              const startPoint = basePosition;
              const endPoint = [rescuerLat, rescuerLng];
              const curvedPoints = createCurvedLine(startPoint, endPoint);
              
              lines.push({
                id: `${incident.id}-${rescuerId}`,
                positions: curvedPoints,
                baseId: base.id,
                rescuerId: rescuer.id,
                incidentId: incident.id
              });
            }
          }
        });
      });
    }
    
    console.log('[RescuerLiveMap] Connection lines:', lines);
    return lines;
  }, [incidents, bases, rescuers, showMockData]);

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
            onClick={async () => {
              setRescuers([]);
              setBases([]);
              setShowMockData(false);
              
              // Reload real bases from API
              try {
                const token = localStorage.getItem('authToken');
                if (token) {
                  const response = await fetch('/apis/rescue-link/v1/bases', {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                      setBases(result.data);
                    }
                  }
                }
              } catch (error) {
                console.error('[RescuerLiveMap] Error reloading bases:', error);
              }
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
        
        {/* Draw connection lines between bases and accepted rescuers */}
        {connectionLines.map((line) => (
          <Polyline
            key={line.id}
            positions={line.positions}
            pathOptions={{
              color: '#9333EA', // Purple color like in the image
              weight: 2,
              opacity: 0.8,
              smoothFactor: 1
            }}
          />
        ))}
        
        {rescuers
          .filter((rescuer) => {
            // Only show rescuers with valid coordinates
            const lat = parseFloat(rescuer.latitude);
            const lng = parseFloat(rescuer.longitude);
            return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
          })
          .map((rescuer) => (
          <Marker
            key={rescuer.id}
            ref={(ref) => {
              if (ref) {
                markerRefs.current[rescuer.id] = ref;
              }
            }}
            position={[parseFloat(rescuer.latitude), parseFloat(rescuer.longitude)]}
            icon={createCustomIcon(getMarkerColor(rescuer.status), rescuer.id)}
            eventHandlers={{
              click: () => {
                // Open popup on marker click
                if (markerRefs.current[rescuer.id]?.leafletElement) {
                  markerRefs.current[rescuer.id].leafletElement.openPopup();
                }
              },
            }}
          >
            <Popup 
              className="custom-popup-arrow"
              autoPan={false}
              closeButton={true}
            >
              <div className="p-3 bg-gray-700 rounded-lg" dir="rtl" style={{ minWidth: '200px', maxWidth: '250px'}}>
                <h3 className="text-xl text-base mb-3 text-white border-b pb-2 mt-4">{rescuer.name}</h3>
                <div className="space-y-2.5 text-md bg-red-100 px-2">
                  <div>
                    <span className="text-sm font-bold text-gray-800">پایگاه ارجاعی:</span>
                    <span className="mr-2 text-red-800 text-sm">{getBaseName(rescuer)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-800 font-bold"> آخرین بروزرسانی موقعیت:</span>
                    <span className="mr-2 text-red-800 text-sm">{formatTime(rescuer.lastUpdate)}</span>
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