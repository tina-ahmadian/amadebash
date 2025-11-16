import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import LiveLocationService from '../services/LiveLocationService';

const STATUS = {
  IDLE: 'idle',
  UPDATING: 'updating',
  SUCCESS: 'success',
  ERROR: 'error',
};

const RescuerLocationUpdater = () => {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [message, setMessage] = useState('در انتظار شروع ردیابی');
  const [isTracking, setIsTracking] = useState(false);
  const [position, setPosition] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [errorCount, setErrorCount] = useState(0);
  const watchIdRef = useRef(null);

  const sendLocation = async (latitude, longitude) => {
    try {
      console.log('[RescuerLocationUpdater] Sending location:', { latitude, longitude });
      setStatus(STATUS.UPDATING);
      setMessage('در حال ارسال موقعیت...');

      await LiveLocationService.updateLocation(latitude, longitude);

      setStatus(STATUS.SUCCESS);
      setMessage('موقعیت با موفقیت ارسال شد');
      setLastUpdate(new Date().toISOString());
      setErrorCount(0);

      setTimeout(() => {
        if (isTracking) {
          setStatus(STATUS.IDLE);
          setMessage('در حال ردیابی...');
        }
      }, 2000);
    } catch (error) {
      setStatus(STATUS.ERROR);
      setMessage(`خطا: ${error.message}`);
      setErrorCount(prev => prev + 1);

      setTimeout(() => {
        if (isTracking) {
          setStatus(STATUS.IDLE);
          setMessage('در حال ردیابی...');
        }
      }, 3000);
    }
  };

  const handleSuccess = (pos) => {
    const { latitude, longitude, accuracy } = pos.coords;
    
    setPosition({
      latitude,
      longitude,
      accuracy,
      timestamp: pos.timestamp,
    });

    sendLocation(latitude, longitude);
  };

  const handleError = (error) => {
    const messages = {
      [error.PERMISSION_DENIED]: 'دسترسی به موقعیت مکانی رد شد',
      [error.POSITION_UNAVAILABLE]: 'موقعیت مکانی در دسترس نیست',
      [error.TIMEOUT]: 'زمان دریافت موقعیت به پایان رسید',
    };
    
    setStatus(STATUS.ERROR);
    setMessage(messages[error.code] || 'خطای نامشخص');
    setErrorCount(prev => prev + 1);
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      console.error('[RescuerLocationUpdater] Geolocation not supported');
      setStatus(STATUS.ERROR);
      setMessage('مرورگر از ردیابی موقعیت پشتیبانی نمی‌کند');
      return;
    }

    console.log('[RescuerLocationUpdater] Starting GPS tracking...');
    setIsTracking(true);
    setStatus(STATUS.IDLE);
    setMessage('در حال دریافت موقعیت...');
    setErrorCount(0);

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
    console.log('[RescuerLocationUpdater] GPS watch started with ID:', watchIdRef.current);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setStatus(STATUS.IDLE);
    setMessage('ردیابی متوقف شد');
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const getIcon = () => {
    switch (status) {
      case STATUS.UPDATING: return <Activity className="w-6 h-6 text-blue-600 animate-pulse" />;
      case STATUS.SUCCESS: return <CheckCircle className="w-6 h-6 text-green-600" />;
      case STATUS.ERROR: return <XCircle className="w-6 h-6 text-red-600" />;
      default: return <MapPin className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case STATUS.UPDATING: return 'bg-blue-100 border-blue-500';
      case STATUS.SUCCESS: return 'bg-green-100 border-green-500';
      case STATUS.ERROR: return 'bg-red-100 border-red-500';
      default: return 'bg-gray-100 border-gray-500';
    }
  };

  const formatCoord = (coord) => coord ? coord.toFixed(6) : 'نامشخص';
  const formatTime = (ts) => {
    if (!ts) return 'نامشخص';
    try {
      return new Date(ts).toLocaleTimeString('fa-IR');
    } catch {
      return 'نامشخص';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-8 h-8" />
            <h2 className="text-2xl font-bold">ردیابی موقعیت امدادگر</h2>
          </div>
          <p className="text-red-100">موقعیت شما به صورت خودکار ارسال می‌شود</p>
        </div>

        <div className={`p-6 border-b-4 ${getStatusColor()}`}>
          <div className="flex items-center gap-3 mb-3">
            {getIcon()}
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

        {position && (
          <div className="p-6 border-t">
            <h3 className="font-bold text-lg mb-4 text-gray-800">موقعیت فعلی</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">عرض جغرافیایی</div>
                <div className="font-mono text-lg font-bold text-blue-600">
                  {formatCoord(position.latitude)}
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">طول جغرافیایی</div>
                <div className="font-mono text-lg font-bold text-blue-600">
                  {formatCoord(position.longitude)}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">دقت (متر)</div>
                <div className="font-mono text-lg font-bold text-gray-600">
                  {position.accuracy?.toFixed(0) || 'نامشخص'}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">آخرین بروزرسانی</div>
                <div className="text-sm font-bold text-gray-600">
                  {formatTime(lastUpdate)}
                </div>
              </div>
            </div>
          </div>
        )}

        {errorCount > 3 && (
          <div className="p-4 bg-yellow-50 border-r-4 border-yellow-500 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-yellow-800">تعداد خطاها زیاد است</div>
              <div className="text-sm text-yellow-700">
                لطفاً اتصال اینترنت و GPS خود را بررسی کنید
              </div>
            </div>
          </div>
        )}

        <div className="p-6 bg-gray-50 border-t">
          <div className="text-xs text-gray-600 space-y-2">
            <p>• GPS دستگاه را فعال کنید</p>
            <p>• اتصال اینترنت پایدار داشته باشید</p>
            <p>• موقعیت شما محرمانه است</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescuerLocationUpdater;

