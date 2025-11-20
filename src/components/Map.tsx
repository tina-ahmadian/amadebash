import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Responder, Alert, Base } from '../data/mockData';

type LatLngPoint = { lat: number; lng: number };

const calculateDistance = (a: LatLngPoint, b: LatLngPoint) => {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return Math.sqrt(dLat * dLat + dLng * dLng);
};

const createBezierPoints = (start: LatLngPoint, end: LatLngPoint, segments = 30): [number, number][] => {
  const distanceLat = end.lat - start.lat;
  const distanceLng = end.lng - start.lng;
  const distance = Math.sqrt(distanceLat * distanceLat + distanceLng * distanceLng);

  if (distance === 0) {
    return [[start.lat, start.lng]];
  }

  // محاسبه نقطه کنترل برای منحنی Bezier زیبا
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;

  // فاکتور انحنا - برای منحنی نرم و زیبا
  const curveFactor = distance * 0.25;
  
  // محاسبه بردار عمود بر خط اتصال
  const perpLat = -distanceLng / distance;
  const perpLng = distanceLat / distance;

  // نقطه کنترل برای منحنی
  const controlPoint: LatLngPoint = {
    lat: midLat + perpLat * curveFactor,
    lng: midLng + perpLng * curveFactor
  };

  // ایجاد نقاط منحنی Bezier درجه 2
  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const invT = 1 - t;
    
    // فرمول Bezier درجه 2: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
    const lat = invT * invT * start.lat + 
                2 * invT * t * controlPoint.lat + 
                t * t * end.lat;
    const lng = invT * invT * start.lng + 
                2 * invT * t * controlPoint.lng + 
                t * t * end.lng;
    
    points.push([lat, lng]);
  }

  return points;
};

// Green Person Icon - White person figure inside solid green circle with dark outline
const createPersonIcon = () => {
  const svg = `<svg width="56" height="68" viewBox="0 0 56 68" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.18"/>
      </filter>
    </defs>
    <g filter="url(#shadow)" transform="translate(0 2)">
      <circle cx="28" cy="26" r="22" fill="#22C55E"/>
      <circle cx="28" cy="26" r="14" fill="#FFFFFF"/>
      <path d="M28 18C26.3431 18 25 19.3431 25 21V24C25 25.6569 26.3431 27 28 27C29.6569 27 31 25.6569 31 24V21C31 19.3431 29.6569 18 28 18Z" fill="#16A34A"/>
      <path d="M20 33.5C20 29.9101 22.9101 27 26.5 27H29.5C33.0899 27 36 29.9101 36 33.5V34.5C36 35.0523 35.5523 35.5 35 35.5H21C20.4477 35.5 20 35.0523 20 34.5V33.5Z" fill="#16A34A"/>
    </g>
    <path d="M28 48C31.866 48 36 53 36 53C36 53 31.866 58 28 58C24.134 58 20 53 20 53C20 53 24.134 48 28 48Z" fill="rgba(0,0,0,0.08)"/>
  </svg>`;
  const encodedSvg = encodeURIComponent(svg);
  return new L.Icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodedSvg}`,
    iconSize: [56, 68],
    iconAnchor: [28, 28],
    popupAnchor: [0, -28]
  });
};

// Create incident icons based on type - Pin shape like map markers
const createIncidentIcon = (incidentType: string) => {
  let iconContent = '';
  
  switch (incidentType) {
    case 'سیل':
      // Flood icon - water waves
      iconContent = `
        <path d="M15 30C15 30 18 26 21 30C24 34 27 30 30 30C33 30 36 34 39 30C42 26 45 30 45 30" 
              stroke="#FFFFFF" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M15 36C15 36 18 32 21 36C24 40 27 36 30 36C33 36 36 40 39 36C42 32 45 36 45 36" 
              stroke="#FFFFFF" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M18 24C18 24 20 22 22 24C24 26 26 24 28 24C30 24 32 26 34 24C36 22 38 24 38 24" 
              stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round"/>`;
      break;
    
    case 'برف و کولاک':
      // Snow icon - snowflake
      iconContent = `
        <g transform="translate(30, 30)">
          <line x1="0" y1="-10" x2="0" y2="10" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="-10" y1="0" x2="10" y2="0" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="-7" y1="-7" x2="7" y2="7" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="7" y1="-7" x2="-7" y2="7" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="0" cy="0" r="3" fill="#FFFFFF"/>
        </g>`;
      break;
    
    case 'زلزله':
      // Earthquake icon - seismic waves
      iconContent = `
        <path d="M15 30 L20 30 L23 22 L27 38 L31 26 L34 30 L45 30" 
              stroke="#FFFFFF" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15 37 L20 37 L22 32 L26 42 L30 34 L33 37 L45 37" 
              stroke="#FFFFFF" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>`;
      break;
    
    case 'حمله ی نظامی':
      // Military attack icon - bomb
      iconContent = `
        <g transform="translate(30, 30)">
          <!-- Bomb fuse -->
          <line x1="-4" y1="-10" x2="-6" y2="-15" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
          <circle cx="-6" cy="-16" r="2" fill="#FFA500"/>
          
          <!-- Bomb body -->
          <ellipse cx="0" cy="0" rx="10" ry="12" fill="#FFFFFF"/>
          
          <!-- Bomb fins -->
          <path d="M-8 8 L-12 12 L-8 12 Z" fill="#FFFFFF"/>
          <path d="M8 8 L12 12 L8 12 Z" fill="#FFFFFF"/>
          <path d="M0 10 L-3 15 L3 15 Z" fill="#FFFFFF"/>
        </g>`;
      break;
    
    case 'مانور':
      // Drill/Exercise icon - target
      iconContent = `
        <g transform="translate(30, 30)">
          <circle cx="0" cy="0" r="12" fill="none" stroke="#FFFFFF" stroke-width="2.5"/>
          <circle cx="0" cy="0" r="8" fill="none" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="0" cy="0" r="4" fill="#FFFFFF"/>
          <line x1="0" y1="-15" x2="0" y2="-12" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
          <line x1="0" y1="12" x2="0" y2="15" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
          <line x1="-15" y1="0" x2="-12" y2="0" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
          <line x1="12" y1="0" x2="15" y2="0" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
        </g>`;
      break;
    
    default:
      // Default icon - alert triangle
      iconContent = `
        <path d="M30 20L38 38H22L30 20Z" fill="#DC2626"/>
        <rect x="28.6" y="28" width="2.8" height="8" rx="1.4" fill="#FFFFFF"/>
        <rect x="28.6" y="37" width="2.8" height="2.8" rx="1.4" fill="#FFFFFF"/>`;
  }

  const svg = `<svg width="60" height="74" viewBox="0 0 60 74" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow-${incidentType}" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <g filter="url(#shadow-${incidentType})">
      <!-- Pin shape body -->
      <path d="M 30 6 C 17 6 6 17 6 30 C 6 43 20 56 30 62 C 40 56 54 43 54 30 C 54 17 43 6 30 6 Z" 
            fill="#DC2626"/>
      <path d="M 30 6 C 17 6 6 17 6 30 C 6 43 20 56 30 62 C 40 56 54 43 54 30 C 54 17 43 6 30 6 Z" 
            fill="none" stroke="#991B1B" stroke-width="2"/>
      <!-- Inner circle for icon content -->
      <circle cx="30" cy="30" r="19" fill="#000000"/>
      <g transform="translate(30, 30) scale(0.65) translate(-30, -30)">
        ${iconContent}
      </g>
    </g>
    <!-- Ground shadow -->
    <ellipse cx="30" cy="68" rx="10" ry="3.5" fill="rgba(0,0,0,0.15)"/>
  </svg>`;
  
  const encodedSvg = encodeURIComponent(svg);
  return new L.Icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodedSvg}`,
    iconSize: [48, 59],
    iconAnchor: [24, 50],
    popupAnchor: [0, -50]
  });
};

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

const personIcon = createPersonIcon();
const baseIcon = createBaseIcon();

// Unused constant - kept for reference
/*
const isfahanRedCrescentBases = [
  {
    id: 'isf-hq',
    name: 'جمعیت هلال احمر استان اصفهان (مرکز استانی)',
    position: { lat: 32.6446, lng: 51.6676 },
    address: 'خیابان استاد نجات‌الهی، چهارراه بعثت، اصفهان'
  },
  {
    id: 'sofeh',
    name: 'پایگاه امداد و نجات کوهستان صفه',
    position: { lat: 32.6087, lng: 51.6469 },
    address: 'پارک کوهستان صفه، انتهای بلوار صفه، اصفهان'
  },
  {
    id: 'shahid-soltani',
    name: 'پایگاه امداد جاده‌ای شهید سلطانی (دولت‌آباد)',
    position: { lat: 32.7971, lng: 51.6804 },
    address: 'بزرگراه معلم، ورودی شهر دولت‌آباد، شهرستان برخوار'
  },
  {
    id: 'segzi',
    name: 'پایگاه امداد جاده‌ای سگزی',
    position: { lat: 32.6998, lng: 51.9252 },
    address: 'محور اصفهان به نائین، روبه‌روی شهرک سگزی'
  },
  {
    id: 'shahreza',
    name: 'پایگاه امداد جاده‌ای شهرضا',
    position: { lat: 32.0064, lng: 51.8416 },
    address: 'محور اصفهان به شیراز، کیلومتر 10 جنوب شهرضا'
  }
] as const;
*/

const formatRelativeTime = (timestamp: Date | string) => {
  const createdAt = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return 'کمتر از یک دقیقه پیش';
  }
  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute);
    return `${minutes} دقیقه پیش`;
  }
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `${hours} ساعت پیش`;
  }
  const days = Math.floor(diffMs / day);
  return `${days} روز پیش`;
};

interface MapProps {
  responders: Responder[];
  alerts?: Alert[];
  bases?: Base[];
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  center?: [number, number];
  zoom?: number;
  selectedLocation?: { lat: number; lng: number } | null;
  onAddressSelect?: (address: string) => void;
  onAlertSelect?: (alert: Alert) => void;
  onBaseSelect?: (base: { name: string; address: string; lat: number; lng: number }) => void;
  autoFitOnRender?: boolean;
  autoFitMinZoom?: number;
  autoClusterFocus?: boolean;
  clusterFocusZoom?: number;
}

const RecenterOnSelection: React.FC<{ selectedLocation?: { lat: number; lng: number } | null }> = ({ selectedLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation) {
      map.flyTo([selectedLocation.lat, selectedLocation.lng], Math.max(map.getZoom(), 16), {
        animate: true,
        duration: 0.6
      });
    }
  }, [map, selectedLocation]);

  return null;
};

const FitBoundsOnData: React.FC<{ points: [number, number][]; enabled: boolean; minZoom: number }> = ({ points, enabled, minZoom }) => {
  const map = useMap();

  useEffect(() => {
    if (!enabled || points.length === 0) {
      return;
    }

    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });

      setTimeout(() => {
        const currentZoom = map.getZoom();
        const targetZoom = Math.max(minZoom, currentZoom);
        const center = bounds.getCenter();

        if (currentZoom < minZoom) {
          map.flyTo(center, targetZoom, { animate: true, duration: 0.6 });
        } else {
          map.panTo(center, { animate: true });
        }
      }, 200);
    }
  }, [enabled, map, minZoom, points]);

  return null;
};

const ClusterFocusOnData: React.FC<{ points: [number, number][]; enabled: boolean; zoom: number }> = ({ points, enabled, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (!enabled || points.length === 0) {
      return;
    }

    const radius = 0.015;

    const scoredPoints = points.map(([lat, lng]) => {
      const score = points.reduce((acc, [otherLat, otherLng]) => {
        const dLat = lat - otherLat;
        const dLng = lng - otherLng;
        const distance = Math.sqrt(dLat * dLat + dLng * dLng);
        if (distance > radius) {
          return acc;
        }
        const influence = 1 - distance / radius;
        return acc + influence;
      }, 0);

      return { lat, lng, score };
    });

    const bestPoint = scoredPoints.reduce((best, current) => {
      if (!best || current.score > best.score) {
        return current;
      }
      return best;
    }, undefined as { lat: number; lng: number; score: number } | undefined);

    if (!bestPoint) {
      return;
    }

    const target = [bestPoint.lat, bestPoint.lng] as [number, number];

    setTimeout(() => {
      map.flyTo(target, zoom, {
        animate: true,
        duration: 0.8
      });
    }, 350);
  }, [enabled, map, points, zoom]);

  return null;
};

const Map: React.FC<MapProps> = ({
  responders,
  alerts = [],
  bases = [],
  onLocationSelect,
  center = [32.6539, 51.6660],
  zoom = 13,
  selectedLocation,
  onAddressSelect,
  onAlertSelect,
  onBaseSelect,
  autoFitOnRender = false,
  autoFitMinZoom = 13,
  autoClusterFocus = false,
  clusterFocusZoom = 15
}) => {
  const [showHighlight, setShowHighlight] = useState(true);

  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNFNjAwMDAiLz4KPC9zdmc+',
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNFNjAwMDAiLz4KPC9zdmc+',
      shadowUrl: ''
    });
  }, []);

  // Hide highlight after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHighlight(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Convert bases from API format to map format
  const mappedBases = useMemo(() => {
    if (bases && bases.length > 0) {
      return bases.map(base => ({
        id: base.id,
        name: base.address || base.code,
        position: { lat: base.location.lat, lng: base.location.lng },
        address: base.address
      }));
    }
    // Return empty array if no bases provided
    return [];
  }, [bases]);

  const displayedAlerts = useMemo(() => {
    const sortedAlerts = [...alerts];
    sortedAlerts.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
    return sortedAlerts;
  }, [alerts]);

  // Show all responders instead of limiting to 3
  const displayedResponders = useMemo(() => responders, [responders]);

  const responderBaseConnections = useMemo(() => {
    return displayedResponders.map(responder => {
      const nearestBase = mappedBases.reduce((closestBase, base) => {
        const currentDistance = calculateDistance(responder.position, base.position);
        const closestDistance = calculateDistance(responder.position, closestBase.position);
        return currentDistance < closestDistance ? base : closestBase;
      }, mappedBases[0]);

      return {
        responder,
        base: nearestBase,
        curvePoints: createBezierPoints(responder.position, nearestBase.position)
      };
    });
  }, [displayedResponders, mappedBases]);

  const adjustedAlerts = useMemo(() => {
    let overlapCounter = 0;

    return displayedAlerts.map(alert => {
      const hasResponderOverlap = responders.some(
        responder => calculateDistance(responder.position, alert.location) < 0.0004
      );

      if (!hasResponderOverlap) {
        return alert;
      }

      const angleInRadians = ((overlapCounter % 6) * 60 * Math.PI) / 180;
      const radius = 0.001 + Math.floor(overlapCounter / 6) * 0.0004;
      overlapCounter += 1;

      return {
        ...alert,
        location: {
          ...alert.location,
          lat: alert.location.lat + radius * Math.cos(angleInRadians),
          lng: alert.location.lng + radius * Math.sin(angleInRadians)
        }
      };
    });
  }, [displayedAlerts, responders]);

  const fitBoundsPoints = useMemo(() => {
    const points: [number, number][] = [];
    displayedResponders.forEach(responder => {
      points.push([responder.position.lat, responder.position.lng]);
    });
    adjustedAlerts.forEach(alert => {
      points.push([alert.location.lat, alert.location.lng]);
    });
    mappedBases.forEach(base => {
      points.push([base.position.lat, base.position.lng]);
    });
    return points;
  }, [displayedResponders, adjustedAlerts, mappedBases]);

  const clusterFocusPoints = useMemo(() => {
    const responderAndAlertPoints: [number, number][] = [];
    displayedResponders.forEach(responder => {
      responderAndAlertPoints.push([responder.position.lat, responder.position.lng]);
    });
    adjustedAlerts.forEach(alert => {
      responderAndAlertPoints.push([alert.location.lat, alert.location.lng]);
    });

    if (responderAndAlertPoints.length > 0) {
      return responderAndAlertPoints;
    }

    return mappedBases.map(base => [base.position.lat, base.position.lng] as [number, number]);
  }, [adjustedAlerts, displayedResponders, mappedBases]);

  // محاسبه مرکز و شعاع دایره برای هایلایت قرمز
  const highlightCircle = useMemo((): { center: [number, number]; radius: number } | null => {
    const allPoints: { lat: number; lng: number }[] = [];
    
    // اضافه کردن پایگاه‌ها
    mappedBases.forEach(base => {
      allPoints.push(base.position);
    });
    
    // اضافه کردن امدادگران
    displayedResponders.forEach(responder => {
      allPoints.push(responder.position);
    });

    if (allPoints.length === 0) {
      return null;
    }

    // محاسبه مرکز (میانگین نقاط)
    const centerLat = allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length;
    const centerLng = allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length;

    // محاسبه بیشترین فاصله از مرکز
    let maxDistance = 0;
    allPoints.forEach(point => {
      const distance = Math.sqrt(
        Math.pow((point.lat - centerLat) * 111000, 2) + 
        Math.pow((point.lng - centerLng) * 111000 * Math.cos(centerLat * Math.PI / 180), 2)
      );
      if (distance > maxDistance) {
        maxDistance = distance;
      }
    });

    // اضافه کردن padding 30% برای زیباتر شدن
    const radius = maxDistance * 1.3;

    return {
      center: [centerLat, centerLng],
      radius: radius
    };
  }, [mappedBases, displayedResponders]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      {/* OpenStreetMap tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        subdomains="abc"
      />
      <RecenterOnSelection selectedLocation={selectedLocation} />
      <FitBoundsOnData points={fitBoundsPoints} enabled={autoFitOnRender} minZoom={autoFitMinZoom} />
      <ClusterFocusOnData points={clusterFocusPoints} enabled={autoClusterFocus} zoom={clusterFocusZoom} />

      {/* هایلایت دایره‌ای قرمز محو برای ناحیه پایگاه‌ها و امدادگران */}
      {showHighlight && highlightCircle && (
        <Circle
          center={highlightCircle.center}
          radius={highlightCircle.radius}
          pathOptions={{
            color: '#dc2626',
            fillColor: '#ef4444',
            fillOpacity: 0.25,
            weight: 2,
            opacity: 0.5
          }}
        />
      )}

      {mappedBases.map(base => (
        <Marker
          key={base.id}
          position={[base.position.lat, base.position.lng]}
          icon={baseIcon}
          eventHandlers={{
            click: () => {
              if (onLocationSelect) {
                onLocationSelect({ lat: base.position.lat, lng: base.position.lng });
              }
              if (onAddressSelect) {
                onAddressSelect(`${base.name}, ${base.address}`);
              }
              if (onBaseSelect) {
                onBaseSelect({
                  name: base.name,
                  address: base.address,
                  lat: base.position.lat,
                  lng: base.position.lng
                });
              }
            }
          }}
        >
          <Popup>
            <div className="text-right font-samim text-black text-sm sm:text-base leading-relaxed" dir="rtl">
              <h3 className="font-bold text-lg sm:text-xl text-red-600">{base.name}</h3>
              <p className="mt-2 text-black text-xs sm:text-sm">{base.address}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {displayedResponders.map(responder => (
        <Marker
          key={responder.id}
          position={[responder.position.lat, responder.position.lng]}
          icon={personIcon}
        >
          <Popup>
            <div className="text-right" dir="rtl">
              <h3 className="font-bold text-base sm:text-lg">{responder.name}</h3>
              <p className="text-xs sm:text-sm">جنسیت: {responder.gender === 'male' ? 'مرد' : 'زن'}</p>
              <p className="text-xs sm:text-sm">وضعیت: {
                responder.status === 'active' ? 'فعال' :
                responder.status === 'on_duty' ? 'در مأموریت' : 'غیرفعال'
              }</p>
              <p className="text-xs sm:text-sm">تلفن: {responder.phone}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Draw smooth curved lines between responders and their nearest bases */}
      {responderBaseConnections.map(({ responder, base, curvePoints }) => (
        <Polyline
          key={`${responder.id}-${base.id}`}
          positions={curvePoints}
          color="#7c3aed"
          weight={3}
          opacity={0.75}
          lineCap="round"
          lineJoin="round"
          smoothFactor={1}
        />
      ))}

      {adjustedAlerts.map(alert => (
        <Marker
          key={alert.id}
          position={[alert.location.lat, alert.location.lng]}
          icon={createIncidentIcon(alert.incidentType)}
          eventHandlers={{
            click: () => {
              if (onAlertSelect) {
                onAlertSelect(alert);
              }
            }
          }}
        >
          <Popup>
            <div className="text-right font-samim text-black text-sm sm:text-base leading-relaxed bg-gray-200 p-3 rounded-lg" dir="rtl">
              <h3 className="font-bold text-lg sm:text-xl text-black">{alert.title}</h3>
              <p className="mt-2 text-black text-xs sm:text-sm">نوع حادثه: {alert.incidentType}</p>
              <p className="mt-1 text-black text-xs sm:text-sm">ثبت شده: {formatRelativeTime(alert.createdAt)}</p>
              <p className="mt-2 text-black text-xs sm:text-sm">{alert.location.address}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
