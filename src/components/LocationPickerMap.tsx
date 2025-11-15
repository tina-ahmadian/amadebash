import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// ایکون marker قابل جابه‌جایی
const createDraggableMarkerIcon = () => {
  const svg = `<svg width="60" height="72" viewBox="0 0 60 72" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.22"/>
      </filter>
    </defs>
    <g filter="url(#shadow)" transform="translate(0 4)">
      <circle cx="30" cy="28" r="24" fill="#DC2626" />
      <circle cx="30" cy="28" r="16" fill="#FFFFFF" />
      <path d="M30 18 L30 38 M22 28 L38 28" stroke="#DC2626" stroke-width="3" stroke-linecap="round"/>
      <circle cx="30" cy="28" r="4" fill="#DC2626"/>
    </g>
    <ellipse cx="30" cy="58" rx="12" ry="4" fill="rgba(0,0,0,0.08)"/>
  </svg>`;
  const encodedSvg = encodeURIComponent(svg);
  return new L.Icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodedSvg}`,
    iconSize: [60, 72],
    iconAnchor: [30, 62],
    popupAnchor: [0, -60]
  });
};

const markerIcon = createDraggableMarkerIcon();

interface LocationPickerMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialPosition?: { lat: number; lng: number };
}

// کامپوننت داخلی برای مدیریت کلیک روی نقشه
const MapClickHandler: React.FC<{
  onLocationSelect: (lat: number, lng: number) => void;
  markerPosition: { lat: number; lng: number } | null;
  setMarkerPosition: (pos: { lat: number; lng: number }) => void;
}> = ({ onLocationSelect, markerPosition, setMarkerPosition }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setMarkerPosition({ lat, lng });
      onLocationSelect(lat, lng);
    },
  });

  return markerPosition ? (
    <Marker 
      position={[markerPosition.lat, markerPosition.lng]} 
      icon={markerIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          setMarkerPosition({ lat: position.lat, lng: position.lng });
          onLocationSelect(position.lat, position.lng);
        },
      }}
    />
  ) : null;
};

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ 
  onLocationSelect, 
  initialPosition 
}) => {
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    initialPosition || null
  );

  // مرکز پیش‌فرض اصفهان
  const defaultCenter: [number, number] = initialPosition 
    ? [initialPosition.lat, initialPosition.lng]
    : [32.6539, 51.6660];

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          subdomains="abc"
        />
        <MapClickHandler
          onLocationSelect={onLocationSelect}
          markerPosition={markerPosition}
          setMarkerPosition={setMarkerPosition}
        />
      </MapContainer>
      
      {/* راهنمای استفاده */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-1.5 sm:px-4 sm:py-2 z-[1000] border border-gray-200 max-w-[90%] sm:max-w-none">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-700">
          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 flex-shrink-0" />
          <span className="font-medium">روی نقشه کلیک کنید تا موقعیت را انتخاب کنید</span>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerMap;

