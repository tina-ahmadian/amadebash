/**
 * RescuerLocationUpdater - Rescuer device component for sending location updates
 * Uses browser geolocation API to continuously track and send position
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import locationStreamService from '../services/LocationStreamService';

// Status types
const STATUS = {
  IDLE: 'idle',
  UPDATING: 'updating',
  SUCCESS: 'success',
  ERROR: 'error',
};

const RescuerLocationUpdater = ({ apiBaseUrl = '/api', authToken = null }) => {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [message, setMessage] = useState('در انتظار شروع ردیابی موقعیت');
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [errorCount, setErrorCount] = useState(0);
  const watchIdRef = useRef(null);

  // Format coordinates for display
  const formatCoordinate = (coord) => {
    return coord ? coord.toFixed(6) : 'نامشخص';
  };

  // Format time for display
  const formatTime = (timestamp) => {
    if (!timestamp) return 'نامشخص';
    try {
      return new Date(timestamp).toLocaleTimeString('fa-IR');
    } catch (error) {
      return 'نامشخص';
    }
  };

  // Send location to backend
  const sendLocationUpdate = async (latitude, longitude) => {
    try {
      setStatus(STATUS.UPDATING);
      setMessage('در حال ارسال موقعیت...');

      // Initialize service
      locationStreamService.initialize(apiBaseUrl, authToken);

      // Send update
      await locationStreamService.updateLocation(latitude, longitude);

      setStatus(STATUS.SUCCESS);
      setMessage('موقعیت با موفقیت ارسال شد');
      setLastUpdateTime(new Date().toISOString());
      setErrorCount(0);

      // Reset to idle after 2 seconds
      setTimeout(() => {
        if (isTracking) {
          setStatus(STATUS.IDLE);
          setMessage('در حال ردیابی موقعیت...');
        }
      }, 2000);

    } catch (error) {
      console.error('Error sending location:', error);
      setStatus(STATUS.ERROR);
      setMessage(`خطا در ارسال موقعیت: ${error.message}`);
      setErrorCount(prev => prev + 1);

      // Reset to idle after 3 seconds
      setTimeout(() => {
        if (isTracking) {
          setStatus(STATUS.IDLE);
          setMessage('در حال ردیابی موقعیت...');
        }
      }, 3000);
    }
  };

  // Handle successful position
  const handlePositionSuccess = (position) => {
    const { latitude, longitude } = position.coords;
    
    console.log('Position obtained:', { latitude, longitude });
    
    setCurrentPosition({
      latitude,
      longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    });

    // Send to backend
    sendLocationUpdate(latitude, longitude);
  };

  // Handle position error
  const handlePositionError = (error) => {
    console.error('Geolocation error:', error);
    
    let errorMessage = 'خطا در دریافت موقعیت';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'دسترسی به موقعیت مکانی رد شد. لطفاً دسترسی را فعال کنید.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'موقعیت مکانی در دسترس نیست.';
        break;
      case error.TIMEOUT:
        errorMessage = 'زمان دریافت موقعیت به پایان رسید.';
        break;
      default:
        errorMessage = error.message || 'خطای نامشخص در دریافت موقعیت';
    }
    
    setStatus(STATUS.ERROR);
    setMessage(errorMessage);
    setErrorCount(prev => prev + 1);
  };

  // Start tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      setStatus(STATUS.ERROR);
      setMessage('مرورگر شما از ردیابی موقعیت مکانی پشتیبانی نمی‌کند');
      return;
    }

    setIsTracking(true);
    setStatus(STATUS.IDLE);
    setMessage('در حال دریافت موقعیت...');
    setErrorCount(0);

    // Options for geolocation
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      options
    );

    console.log('Location tracking started');
  };

  // Stop tracking
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      console.log('Location tracking stopped');
    }

    setIsTracking(false);
    setStatus(STATUS.IDLE);
    setMessage('ردیابی موقعیت متوقف شد');
  };

  // Auto-start tracking on mount
  useEffect(() => {
    // Check for permissions
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          console.log('Geolocation permission granted');
        } else if (result.state === 'prompt') {
          console.log('Geolocation permission prompt');
        } else {
          console.warn('Geolocation permission denied');
        }
      });
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case STATUS.UPDATING:
        return <Activity className="w-6 h-6 text-blue-600 animate-pulse" />;
      case STATUS.SUCCESS:
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case STATUS.ERROR:
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <MapPin className="w-6 h-6 text-gray-600" />;
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case STATUS.UPDATING:
        return 'bg-blue-100 border-blue-500';
      case STATUS.SUCCESS:
        return 'bg-green-100 border-green-500';
      case STATUS.ERROR:
        return 'bg-red-100 border-red-500';
      default:
        return 'bg-gray-100 border-gray-500';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-8 h-8" />
            <h2 className="text-2xl font-bold">ردیابی موقعیت امدادگر</h2>
          </div>
          <p className="text-red-100">موقعیت شما به صورت خودکار به مرکز ارسال می‌شود</p>
        </div>

        {/* Status Card */}
        <div className={`p-6 border-b-4 ${getStatusColor()}`}>
          <div className="flex items-center gap-3 mb-3">
            {getStatusIcon()}
            <div>
              <div className="text-sm font-semibold text-gray-600">وضعیت:</div>
              <div className="text-lg font-bold">
                {status === STATUS.IDLE && 'آماده'}
                {status === STATUS.UPDATING && 'در حال بروزرسانی'}
                {status === STATUS.SUCCESS && 'موفقیت'}
                {status === STATUS.ERROR && 'خطا'}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-700">{message}</p>
        </div>

        {/* Controls */}
        <div className="p-6 bg-gray-50">
          <div className="flex gap-3">
            {!isTracking ? (
              <button
                onClick={startTracking}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Activity className="w-5 h-5" />
                شروع ردیابی
              </button>
            ) : (
              <button
                onClick={stopTracking}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                توقف ردیابی
              </button>
            )}
          </div>
        </div>

        {/* Position Info */}
        {currentPosition && (
          <div className="p-6 border-t">
            <h3 className="font-bold text-lg mb-4 text-gray-800">اطلاعات موقعیت فعلی</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">عرض جغرافیایی</div>
                <div className="font-mono text-lg font-bold text-blue-600">
                  {formatCoordinate(currentPosition.latitude)}
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">طول جغرافیایی</div>
                <div className="font-mono text-lg font-bold text-blue-600">
                  {formatCoordinate(currentPosition.longitude)}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">دقت (متر)</div>
                <div className="font-mono text-lg font-bold text-gray-600">
                  {currentPosition.accuracy?.toFixed(0) || 'نامشخص'}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">آخرین بروزرسانی</div>
                <div className="text-sm font-bold text-gray-600">
                  {formatTime(lastUpdateTime)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error warning */}
        {errorCount > 3 && (
          <div className="p-4 bg-yellow-50 border-r-4 border-yellow-500 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-yellow-800">تعداد خطاها زیاد است</div>
              <div className="text-sm text-yellow-700">
                لطفاً اتصال اینترنت و تنظیمات موقعیت مکانی خود را بررسی کنید
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-6 bg-gray-50 border-t">
          <div className="text-xs text-gray-600 space-y-2">
            <p>• برای عملکرد بهتر، GPS دستگاه خود را فعال کنید</p>
            <p>• مطمئن شوید اتصال اینترنت پایدار دارید</p>
            <p>• موقعیت شما تنها برای مرکز هلال احمر قابل مشاهده است</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescuerLocationUpdater;

