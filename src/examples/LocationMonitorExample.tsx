import React, { useState, useEffect } from 'react';
import { LocationMonitor } from '../components/LocationMonitor';
import { AlertCircle } from 'lucide-react';

/**
 * Example integration of LocationMonitor component
 * 
 * This demonstrates how to:
 * 1. Get token from localStorage
 * 2. Handle missing token case
 * 3. Integrate LocationMonitor into your app
 */
export const LocationMonitorExample: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get token from localStorage
    // You might use 'authToken', 'adminToken', or your own key
    const savedToken = 
      localStorage.getItem('authToken') || 
      localStorage.getItem('adminToken') ||
      null;

    setToken(savedToken);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Authentication Required</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Please login first to access the live location monitoring system.
          </p>
          <button
            onClick={() => {
              // Redirect to login page or show login modal
              window.location.href = '/login';
            }}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Live Rescuer Location Tracking
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time monitoring of all active rescuers using Server-Sent Events (SSE)
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg" style={{ height: 'calc(100vh - 200px)' }}>
          <LocationMonitor token={token} enabled={true} />
        </div>
      </div>
    </div>
  );
};

export default LocationMonitorExample;

