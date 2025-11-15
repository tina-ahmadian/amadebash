import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert, Responder } from '../data/mockData';

interface MapContextType {
  selectedLocation: { lat: number; lng: number } | null;
  setSelectedLocation: (location: { lat: number; lng: number } | null) => void;
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  updateAlertStatus: (alertId: string, status: 'pending' | 'accepted' | 'rejected') => void;
  responders: Responder[];
  setResponders: (responders: Responder[]) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within MapProvider');
  }
  return context;
};

interface MapProviderProps {
  children: ReactNode;
  initialAlerts: Alert[];
  initialResponders: Responder[];
}

export const MapProvider: React.FC<MapProviderProps> = ({
  children,
  initialAlerts,
  initialResponders
}) => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [responders, setResponders] = useState<Responder[]>(initialResponders);

  const addAlert = (alert: Alert) => {
    setAlerts(prev => [alert, ...prev]);
  };

  const updateAlertStatus = (alertId: string, status: 'pending' | 'accepted' | 'rejected') => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, status } : alert
    ));
  };

  return (
    <MapContext.Provider
      value={{
        selectedLocation,
        setSelectedLocation,
        alerts,
        addAlert,
        updateAlertStatus,
        responders,
        setResponders
      }}
    >
      {children}
    </MapContext.Provider>
  );
};
