/**
 * LiveLocationIntegration - Integration examples for existing dashboards
 * This file shows how to add location tracking to AdminDashboard and ResponderDashboard
 */

import React, { useState } from 'react';
import RescuerLiveMap from './RescuerLiveMap';
import RescuerLocationUpdater from './RescuerLocationUpdater';
import { MapPin, X } from 'lucide-react';

/**
 * Example 1: Add Live Map to Admin Dashboard
 * 
 * Usage in AdminDashboard.tsx:
 * 
 * import { LiveMapPanel } from './LiveLocationIntegration';
 * 
 * // Add as a new tab or section:
 * <LiveMapPanel />
 */
export const LiveMapPanel: React.FC = () => {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '/api';
  const authToken = localStorage.getItem('authToken');

  return (
    <div className="h-full min-h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-red-600 text-white p-4 flex items-center gap-2">
        <MapPin className="w-6 h-6" />
        <h2 className="text-xl font-bold">نقشه زنده امدادگران</h2>
      </div>
      <div className="h-[calc(100%-64px)]">
        <RescuerLiveMap
          apiBaseUrl={apiBaseUrl}
          authToken={authToken}
        />
      </div>
    </div>
  );
};

/**
 * Example 2: Add Location Updater to Responder Dashboard
 * 
 * Usage in ResponderDashboard.tsx:
 * 
 * import { LocationUpdaterPanel } from './LiveLocationIntegration';
 * 
 * // Add to responder dashboard:
 * <LocationUpdaterPanel />
 */
export const LocationUpdaterPanel: React.FC = () => {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '/api';
  const authToken = localStorage.getItem('authToken');

  return (
    <div className="w-full">
      <RescuerLocationUpdater
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
      />
    </div>
  );
};

/**
 * Example 3: Floating Map Widget (can be added to any page)
 * 
 * Usage anywhere:
 * 
 * import { FloatingMapWidget } from './LiveLocationIntegration';
 * 
 * <FloatingMapWidget />
 */
export const FloatingMapWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '/api';
  const authToken = localStorage.getItem('authToken');

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 left-4 z-50 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-all"
          title="نمایش نقشه زنده"
        >
          <MapPin className="w-6 h-6" />
        </button>
      )}

      {/* Floating Map Panel */}
      {isOpen && (
        <div className="fixed bottom-4 left-4 z-50 w-[400px] h-[500px] bg-white rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-red-600 text-white p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span className="font-bold">نقشه زنده</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-red-700 p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="h-[calc(100%-48px)]">
            <RescuerLiveMap
              apiBaseUrl={apiBaseUrl}
              authToken={authToken}
            />
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Example 4: Full-screen Map Modal
 * 
 * Usage:
 * 
 * import { MapModal } from './LiveLocationIntegration';
 * 
 * const [showMap, setShowMap] = useState(false);
 * 
 * <button onClick={() => setShowMap(true)}>نمایش نقشه</button>
 * <MapModal isOpen={showMap} onClose={() => setShowMap(false)} />
 */
interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose }) => {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '/api';
  const authToken = localStorage.getItem('authToken');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="bg-red-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6" />
            <h2 className="text-2xl font-bold">نقشه زنده امدادگران</h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-red-700 p-2 rounded transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="h-[calc(100%-64px)]">
          <RescuerLiveMap
            apiBaseUrl={apiBaseUrl}
            authToken={authToken}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Example 5: Compact Location Status for Responder
 * Shows a minimal location status indicator
 */
export const CompactLocationStatus: React.FC = () => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
          <div>
            <div className="font-bold text-gray-800">
              {isActive ? 'ردیابی فعال' : 'ردیابی غیرفعال'}
            </div>
            <div className="text-xs text-gray-600">
              {isActive ? 'موقعیت شما در حال ارسال است' : 'ردیابی موقعیت خاموش است'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsActive(!isActive)}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${
            isActive
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-green-100 text-green-600 hover:bg-green-200'
          }`}
        >
          {isActive ? 'توقف' : 'شروع'}
        </button>
      </div>
    </div>
  );
};

/**
 * HOW TO INTEGRATE INTO YOUR EXISTING CODE:
 * 
 * 1. For AdminDashboard.tsx - Add a new tab for live map:
 * 
 *    import { LiveMapPanel } from './LiveLocationIntegration';
 * 
 *    // In your tabs/sections:
 *    {activeTab === 'liveMap' && <LiveMapPanel />}
 * 
 * 
 * 2. For ResponderDashboard.tsx - Add location updater:
 * 
 *    import { LocationUpdaterPanel } from './LiveLocationIntegration';
 * 
 *    // Add as a section:
 *    <LocationUpdaterPanel />
 * 
 * 
 * 3. For a floating widget anywhere:
 * 
 *    import { FloatingMapWidget } from './LiveLocationIntegration';
 * 
 *    // Add to your layout:
 *    <FloatingMapWidget />
 * 
 * 
 * 4. For a modal/popup map:
 * 
 *    import { MapModal } from './LiveLocationIntegration';
 *    
 *    const [showMap, setShowMap] = useState(false);
 *    
 *    <button onClick={() => setShowMap(true)}>نقشه</button>
 *    <MapModal isOpen={showMap} onClose={() => setShowMap(false)} />
 */

export default {
  LiveMapPanel,
  LocationUpdaterPanel,
  FloatingMapWidget,
  MapModal,
  CompactLocationStatus,
};

