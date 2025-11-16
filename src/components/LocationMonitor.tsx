import React from 'react';
import { useLocationStream, RescuerLocation } from '../hooks/useLocationStream';
import { RefreshCw, Activity, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface LocationMonitorProps {
  token: string;
  enabled?: boolean;
}

/**
 * LocationMonitor Component
 * 
 * Displays a live-updating table of active rescuers with their locations
 * Shows connection status and provides manual reconnect functionality
 * 
 * @param token - Bearer token for authentication
 * @param enabled - Enable/disable the location stream (default: true)
 */
export const LocationMonitor: React.FC<LocationMonitorProps> = ({ token, enabled = true }) => {
  const { locations, isConnected, error, reconnect, connectionAttempts } = useLocationStream({
    token,
    enabled,
  });

  /**
   * Format timestamp to relative time
   */
  const formatLastUpdate = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;

      return date.toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'busy':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  /**
   * Get status label
   */
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'busy':
        return 'Busy';
      case 'inactive':
        return 'Inactive';
      default:
        return status;
    }
  };

  // Convert locations Map to array for rendering
  const locationsArray = Array.from(locations.values());

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with connection status */}
      <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Live Location Monitoring</h2>
              <p className="text-sm text-red-100">Real-time rescuer tracking via SSE</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  <span className="text-sm font-medium">Connected</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm font-medium">
                    Disconnected {connectionAttempts > 0 && `(${connectionAttempts} attempts)`}
                  </span>
                </>
              )}
            </div>

            {/* Reconnect Button */}
            <button
              onClick={reconnect}
              disabled={isConnected}
              className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg font-medium transition-all hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Manual reconnect"
            >
              <RefreshCw className="w-4 h-4" />
              Reconnect
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-3 flex items-start gap-2 px-4 py-3 bg-red-900/30 border border-red-400/30 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Connection Error</p>
              <p className="text-sm text-red-100 mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{locationsArray.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Rescuers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {locationsArray.filter((l) => l.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Active</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {locationsArray.filter((l) => l.status === 'busy').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Busy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {locationsArray.filter((l) => l.status === 'inactive').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Inactive</div>
          </div>
        </div>
      </div>

      {/* Rescuers Table */}
      <div className="flex-1 overflow-auto">
        {locationsArray.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <Activity className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">No rescuers tracking yet</p>
            <p className="text-sm mt-2">Waiting for location updates...</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rescuer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Latitude
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Longitude
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Update
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locationsArray.map((location: RescuerLocation) => (
                <tr
                  key={location.rescuer_id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{location.rescuer_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {location.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                        location.status
                      )}`}
                    >
                      {getStatusLabel(location.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                    {parseFloat(String(location.latitude)).toFixed(6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                    {parseFloat(String(location.longitude)).toFixed(6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatLastUpdate(location.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LocationMonitor;

