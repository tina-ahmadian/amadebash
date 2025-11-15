/**
 * RescuerLiveMap - Admin panel component for real-time rescuer location tracking
 * Shows all rescuers on Google Maps with real-time updates via SSE
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import locationStreamService from '../services/LocationStreamService';

// Map styles
const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '600px',
};

const defaultCenter = {
  lat: 35.6892, // Tehran coordinates as default
  lng: 51.3890,
};

// Marker colors based on rescuer status
const getMarkerColor = (status) => {
  switch (status) {
    case 'active':
      return '#10B981'; // green
    case 'inactive':
      return '#EF4444'; // red
    case 'busy':
      return '#F97316'; // orange
    default:
      return '#3B82F6'; // blue
  }
};

// Custom marker icon with dynamic color
const createMarkerIcon = (status) => {
  const color = getMarkerColor(status);
  return {
    path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
    scale: 10,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
  };
};

const RescuerLiveMap = ({ apiBaseUrl = '/api', authToken = null, initialRescuers = [] }) => {
  const [rescuers, setRescuers] = useState(initialRescuers);
  const [selectedRescuer, setSelectedRescuer] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const mapRef = useRef(null);

  // Format timestamp for display
  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'نامشخص';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'هم‌اکنون';
      if (diffMins < 60) return `${diffMins} دقیقه پیش`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} ساعت پیش`;
      
      return date.toLocaleDateString('fa-IR');
    } catch (error) {
      return 'نامشخص';
    }
  };

  // Handle location updates from SSE
  const handleLocationUpdate = useCallback((data) => {
    console.log('Received location update:', data);
    
    setRescuers((prevRescuers) => {
      const updatedRescuers = [...prevRescuers];
      const index = updatedRescuers.findIndex(
        (r) => r.id === data.rescuerId || r.id === data.id
      );

      if (index !== -1) {
        // Update existing rescuer
        updatedRescuers[index] = {
          ...updatedRescuers[index],
          latitude: data.latitude,
          longitude: data.longitude,
          status: data.status || updatedRescuers[index].status,
          lastUpdate: data.timestamp || new Date().toISOString(),
        };
      } else {
        // Add new rescuer
        updatedRescuers.push({
          id: data.rescuerId || data.id,
          name: data.name || 'امدادگر جدید',
          latitude: data.latitude,
          longitude: data.longitude,
          status: data.status || 'active',
          lastUpdate: data.timestamp || new Date().toISOString(),
        });
      }

      return updatedRescuers;
    });
  }, []);

  // Handle stream errors
  const handleStreamError = useCallback((error) => {
    console.error('Location stream error:', error);
    setStreamError(error.message || 'خطا در دریافت موقعیت‌ها');
  }, []);

  // Start streaming on component mount
  useEffect(() => {
    // Initialize service
    locationStreamService.initialize(apiBaseUrl, authToken);

    // Start streaming
    locationStreamService.startStreaming(handleLocationUpdate, handleStreamError);

    // Cleanup on unmount
    return () => {
      locationStreamService.stopStreaming();
    };
  }, [apiBaseUrl, authToken, handleLocationUpdate, handleStreamError]);

  // Update map center when rescuers change
  useEffect(() => {
    if (rescuers.length > 0) {
      // Calculate center based on all rescuers
      const avgLat = rescuers.reduce((sum, r) => sum + parseFloat(r.latitude), 0) / rescuers.length;
      const avgLng = rescuers.reduce((sum, r) => sum + parseFloat(r.longitude), 0) / rescuers.length;
      
      setMapCenter({ lat: avgLat, lng: avgLng });
    }
  }, [rescuers]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    setIsLoaded(true);
  }, []);

  const onMarkerClick = useCallback((rescuer) => {
    setSelectedRescuer(rescuer);
  }, []);

  const onInfoWindowClose = useCallback(() => {
    setSelectedRescuer(null);
  }, []);

  // Get status label in Persian
  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'فعال';
      case 'inactive':
        return 'غیرفعال';
      case 'busy':
        return 'مشغول';
      default:
        return 'نامشخص';
    }
  };

  return (
    <div className="w-full h-full relative">
      {/* Error notification */}
      {streamError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {streamError}
        </div>
      )}

      {/* Stats bar */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4">
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {rescuers.filter(r => r.status === 'active').length}
            </div>
            <div className="text-xs text-gray-600">فعال</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {rescuers.filter(r => r.status === 'busy').length}
            </div>
            <div className="text-xs text-gray-600">مشغول</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {rescuers.filter(r => r.status === 'inactive').length}
            </div>
            <div className="text-xs text-gray-600">غیرفعال</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {rescuers.length}
            </div>
            <div className="text-xs text-gray-600">کل</div>
          </div>
        </div>
      </div>

      {/* Google Map */}
      <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={12}
          onLoad={onMapLoad}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
          }}
        >
          {/* Render rescuer markers */}
          {rescuers.map((rescuer) => {
            const position = {
              lat: parseFloat(rescuer.latitude),
              lng: parseFloat(rescuer.longitude),
            };

            return (
              <Marker
                key={rescuer.id}
                position={position}
                onClick={() => onMarkerClick(rescuer)}
                icon={isLoaded ? createMarkerIcon(rescuer.status) : undefined}
                animation={window.google?.maps?.Animation?.DROP}
              />
            );
          })}

          {/* Info Window */}
          {selectedRescuer && (
            <InfoWindow
              position={{
                lat: parseFloat(selectedRescuer.latitude),
                lng: parseFloat(selectedRescuer.longitude),
              }}
              onCloseClick={onInfoWindowClose}
            >
              <div className="p-2" dir="rtl">
                <h3 className="font-bold text-lg mb-2">{selectedRescuer.name}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">وضعیت:</span>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: getMarkerColor(selectedRescuer.status) + '20',
                        color: getMarkerColor(selectedRescuer.status),
                      }}
                    >
                      {getStatusLabel(selectedRescuer.status)}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">آخرین بروزرسانی:</span>
                    <span className="mr-2">{formatLastUpdate(selectedRescuer.lastUpdate)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    <div>عرض: {parseFloat(selectedRescuer.latitude).toFixed(6)}</div>
                    <div>طول: {parseFloat(selectedRescuer.longitude).toFixed(6)}</div>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default RescuerLiveMap;

