import React, { useState } from 'react';
import { Bell, MapPin, Clock, CheckCircle, XCircle, Navigation, LogOut } from 'lucide-react';
import { useMapContext } from '../context/MapContext';
import Map from './Map';

const ResponderDashboard: React.FC = () => {
  const { alerts, updateAlertStatus } = useMapContext();
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleAccept = (alertId: string) => {
    updateAlertStatus(alertId, 'accepted');
    setGpsActive(true);
    setTimeout(() => {
      alert('GPS فعال شد. در مسیر حادثه هستید.');
    }, 300);
  };

  const handleReject = (alertId: string) => {
    updateAlertStatus(alertId, 'rejected');
    alert('اعلان رد شد');
  };

  const pendingAlerts = alerts.filter(alert => alert.status === 'pending');
  const selectedAlertData = alerts.find(alert => alert.id === selectedAlert);

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'همین الان';
    if (minutes < 60) return `${minutes.toLocaleString('fa-IR')} دقیقه پیش`;
    const hours = Math.floor(minutes / 60);
    return `${hours.toLocaleString('fa-IR')} ساعت پیش`;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-red-600 text-white py-3 sm:py-4 px-4 sm:px-6 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-0">
          <div className="flex items-center gap-2 flex-wrap">
            {gpsActive && (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-green-500 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
                <span>GPS فعال</span>
              </div>
            )}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/90 text-red-600 rounded-lg font-semibold flex items-center gap-1.5 sm:gap-2 hover:bg-white transition-colors shadow-sm text-xs sm:text-sm"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>خروج</span>
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right">
              <h1 className="text-base sm:text-xl md:text-2xl font-bold flex justify-end">
                <span className="relative inline-flex items-center justify-center pr-10 sm:pr-12 md:pr-14">
                  <span className="absolute right-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white border border-red-100 shadow-sm flex items-center justify-center select-none pointer-events-none">
                    <img
                      src="/images/logo2.png"
                      alt=""
                      aria-hidden="true"
                      className="w-10 h-6 sm:w-14 sm:h-8 md:w-18 md:h-10"
                    />
                  </span>
                  <span className="relative z-10 leading-tight text-right">
                    <span className="block">سامانه آماده‌باش هلال‌ احمر</span>
                    <span className="block text-red-100 text-xs sm:text-sm font-normal">پنل امدادگر</span>
                  </span>
                </span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 p-3 sm:p-4 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 justify-end">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex justify-end">
                  <span className="relative inline-flex items-center justify-center pr-10 sm:pr-12">
                    <Bell
                      className="absolute right-0 w-8 h-8 sm:w-10 sm:h-10 text-red-600 animate-bounce pointer-events-none"
                      aria-hidden="true"
                    />
                    <span className="relative z-10">اعلان‌های جدید</span>
                  </span>
                </h2>
              </div>

              {pendingAlerts.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <Bell className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
                  <p className="text-base sm:text-lg">اعلان جدیدی وجود ندارد</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {pendingAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className="border-2 border-red-200 rounded-lg p-3 sm:p-4 hover:shadow-lg transition-shadow bg-red-50"
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between mb-3 gap-3 sm:gap-0">
                        <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-1">
                          <button
                            onClick={() => handleReject(alert.id)}
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors transform transition-transform hover:scale-105 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold"
                          >
                            <span>رد</span>
                            <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleAccept(alert.id)}
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors transform transition-transform hover:scale-105 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold"
                          >
                            <span>قبول مأموریت</span>
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                        <div className="text-right flex-1 w-full sm:w-auto order-1 sm:order-2">
                          <div className="flex items-center gap-2 justify-end flex-wrap">
                            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-red-600 text-white rounded-full text-xs font-semibold">
                              {alert.incidentType}
                            </span>
                            <h3 className="text-base sm:text-lg font-bold text-gray-800">{alert.title}</h3>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mt-1 justify-end">
                            <span>{getTimeAgo(alert.createdAt)}</span>
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        </div>
                      </div>

                      <p className="text-sm sm:text-base text-gray-700 mb-3 text-right" dir="rtl">{alert.description}</p>

                      <div className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-3 justify-end">
                        <span className="text-right">{alert.location.address}</span>
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                      </div>

                      <button
                        onClick={() => setSelectedAlert(selectedAlert === alert.id ? null : alert.id)}
                        className="text-red-600 hover:text-red-700 font-semibold text-xs sm:text-sm flex items-center gap-1 mr-auto"
                      >
                        {selectedAlert === alert.id ? 'بستن نقشه' : 'نمایش روی نقشه'}
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>

                      {selectedAlert === alert.id && (
                        <div className="mt-3 sm:mt-4 h-48 sm:h-64 border-2 border-gray-300 rounded-lg overflow-hidden">
                          <Map
                            responders={[]}
                            alerts={[alert]}
                            center={[alert.location.lat, alert.location.lng]}
                            zoom={15}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5 md:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 text-right">نقشه عمومی</h3>
              <div className="h-64 sm:h-80 md:h-96 border-2 border-gray-300 rounded-lg overflow-hidden">
                <Map
                  responders={[]}
                  alerts={pendingAlerts}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xs sm:max-w-sm w-full p-5 sm:p-6 space-y-4 sm:space-y-5 text-right">
            <div className="flex items-center justify-between">
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">خروج از پنل</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-6">
              آیا مطمئن هستید می‌خواهید از پنل امدادگر خارج شوید؟
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors text-sm"
              >
                انصراف
              </button>
              <button
                onClick={async () => {
                  try {
                    // Get auth token from localStorage
                    const token = localStorage.getItem('authToken');
                    
                    // Call logout API
                    const response = await fetch('/api/v1/auth/logout', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                      }
                    });

                    console.log('Logout API Response:', response.status);
                    
                    if (response.ok) {
                      const data = await response.json();
                      console.log('Logout successful:', data);
                    } else {
                      console.warn('Logout API failed, but continuing with logout...');
                    }
                  } catch (error) {
                    console.error('Logout API error:', error);
                    // Continue with logout even if API fails
                  } finally {
                    // Clear token and logout regardless of API result
                    localStorage.removeItem('authToken');
                    setShowLogoutModal(false);
                    if (window.history.length > 1) {
                      window.history.back();
                    } else {
                      window.location.href = '/';
                    }
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow"
              >
                تایید خروج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponderDashboard;
