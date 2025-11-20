import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Menu, X, Users, AlertTriangle, Building2, Settings, Home, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import AlertForm from './AlertForm';
import IncidentsPage from './IncidentsPage';
import BasesPage from './BasesPage';
import SettingsPage from './SettingsPage';
import RespondersInfoPage from './RespondersInfoPage';
import RescuerLiveMap from './RescuerLiveMap';
import { useMapContext } from '../context/MapContext';
import { mockBases, Base } from '../data/mockData';

type PageView = 'dashboard' | 'incidents' | 'responders' | 'bases' | 'settings';

interface AdminDashboardProps {
  onLogout?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [bases, setBases] = useState<Base[]>(mockBases);
  const { responders, alerts } = useMapContext();

  // Fetch bases from API
  useEffect(() => {
    const fetchBases = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          console.warn('No auth token found for fetching bases');
          return;
        }

        const response = await fetch('/api/api/v1/bases', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch bases: ${response.status}`);
        }

        const data = await response.json();
        console.log('Dashboard - Bases API Response:', data);
        
        let basesData = Array.isArray(data) ? data : data.data || data.bases || [];
        
        // Map API data to expected Base structure
        basesData = basesData.map((base: any) => ({
          id: base.id || `${Date.now()}-${Math.random()}`,
          code: base.code || '',
          address: base.name || base.address || '',
          location: {
            lat: base.latitude || 0,
            lng: base.longitude || 0
          },
          activeResponders: base.activeResponders || 0,
          inactiveResponders: base.inactiveResponders || 0
        }));
        
        setBases(basesData);
        
      } catch (err) {
        console.error('Error fetching bases:', err);
        // Keep using mockBases as fallback
      }
    };

    fetchBases();
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'صفحه‌ی اصلی', icon: Home },
    { id: 'incidents', label: 'حوادث', icon: AlertTriangle },
    { id: 'responders', label: 'امدادگران', icon: Users },
    { id: 'bases', label: 'پایگاه‌های امدادی', icon: Building2 },
    { id: 'settings', label: 'تنظیمات', icon: Settings },
  ];

  const handleMenuClick = (pageId: string) => {
    if (pageId === 'logout') {
      setShowLogoutModal(true);
      return;
    }
    setCurrentPage(pageId as PageView);
    setIsMenuOpen(false);
  };

  const handleLogoutConfirm = async () => {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      // Call logout API
      const response = await fetch('/api/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          refresh_token: "tina"
        })
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
      if (onLogout) {
        onLogout();
      }
    }
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count today's incidents
    const todayIncidents = alerts.filter(alert => {
      const alertDate = new Date(alert.createdAt);
      alertDate.setHours(0, 0, 0, 0);
      return alertDate.getTime() === today.getTime();
    }).length;

    // Count active responders (active or on_duty)
    const activeResponders = responders.filter(r => 
      r.status === 'active' || r.status === 'on_duty'
    ).length;

    // Count total bases
    const totalBases = bases.length;

    return {
      todayIncidents,
      activeResponders,
      totalBases
    };
  }, [alerts, responders, bases]);

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <>
            <div className="flex flex-col h-full">
              {/* Statistics Dashboard */}
              <div className="p-3 sm:p-4 bg-gray-300 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  {/* Today's Incidents Card */}
                  <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 border-r-4 border-red-500 transition-all duration-200 transform hover:scale-105 hover:bg-gray-500 hover:text-white cursor-pointer group">
                    <div className="flex items-center justify-between flex-row-reverse">
                      <div className="flex flex-col items-end text-right">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 group-hover:text-white">تعداد حوادث رخ داده امروز در کشور</p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-800 group-hover:text-white">{statistics.todayIncidents.toLocaleString('fa-IR')}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 group-hover:text-white">حادثه ثبت شده</p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-125 group-hover:bg-white/30 animate-bounce flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 transition-transform duration-150 hover:scale-110 group-hover:text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Active Responders Card */}
                  <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 border-r-4 border-blue-500 transition-all duration-200 transform hover:scale-105 hover:bg-gray-500 hover:text-white cursor-pointer group">
                    <div className="flex items-center justify-between flex-row-reverse">
                      <div className="flex flex-col items-end text-right">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 group-hover:text-white">تعداد نیروهای امدادی استان</p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-800 group-hover:text-white">{statistics.activeResponders.toLocaleString('fa-IR')}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 group-hover:text-white">نفر آماده خدمت</p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-125 group-hover:bg-white/30 flex-shrink-0">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 transition-transform duration-150 hover:scale-110 group-hover:text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Active Bases Card */}
                  <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 border-r-4 border-green-500 transition-all duration-200 transform hover:scale-105 hover:bg-gray-500 hover:text-white cursor-pointer group">
                    <div className="flex items-center justify-between flex-row-reverse">
                      <div className="flex flex-col items-end text-right">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 group-hover:text-white">تعداد پایگاه های امدادی استان</p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-800 group-hover:text-white">{statistics.totalBases.toLocaleString('fa-IR')}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 group-hover:text-white">پایگاه ثبت شده</p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-125 group-hover:bg-white/30 flex-shrink-0">
                        <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 transition-transform duration-150 hover:scale-110 group-hover:text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Map Section */}
              <div className="flex-1 overflow-hidden p-3 sm:p-4">
                <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
                  <RescuerLiveMap />
                </div>
              </div>
            </div>
            {showAlertForm && (
              <AlertForm onClose={() => setShowAlertForm(false)} />
            )}
          </>
        );
      case 'incidents':
        return <IncidentsPage alerts={alerts} responders={responders} />;
      case 'bases':
        return <BasesPage bases={bases} />;
      case 'responders':
        return <RespondersInfoPage responders={responders} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-red-600 text-white py-3 sm:py-4 px-4 sm:px-6 shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4 md:gap-6">
          <div className="flex items-center gap-2 sm:gap-3">
            {currentPage === 'dashboard' && (
              <button
                onClick={() => setShowAlertForm(true)}
                className="bg-white text-red-600 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-lg font-semibold flex items-center gap-1.5 sm:gap-2 hover:bg-red-50 transition-all transform hover:scale-110 duration-150 shadow-md text-xs sm:text-sm md:text-base group"
              >
                <span className="hidden sm:inline">حادثه جدید</span>
                <span className="sm:hidden">اعلان</span>
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-150 group-hover:scale-125" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
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
                      <span className="block">سامانه آماده‌ باش هلال‌ احمر</span>
                      <span className="block text-red-100 text-xs sm:text-sm font-normal">پنل مدیریت</span>
                    </span>
                  </span>
                </h1>
              </div>
            </div>

            {/* Sidebar Toggle Button - Desktop */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex p-1.5 sm:p-2 rounded-lg hover:bg-red-700 transition-colors"
              aria-label="باز/بسته کردن منو"
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" /> : <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            {/* Hamburger Menu - Mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-red-700 transition-colors lg:hidden"
              aria-label="منو"
            >
              {isMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {renderContent()}
        </main>

        {/* Sidebar Menu - Right Side */}
        <aside
          className={`fixed top-[60px] sm:top-[68px] md:top-[72px] right-0 h-[calc(100vh-60px)] sm:h-[calc(100vh-68px)] md:h-[calc(100vh-72px)] bg-white shadow-2xl z-40 transform transition-all duration-300 ease-in-out
          ${isMenuOpen ? 'translate-x-0 w-72' : 'translate-x-full w-72'} 
          lg:translate-x-0 lg:static lg:top-0 lg:h-auto lg:shadow-none lg:border-l lg:border-gray-200 lg:z-auto 
          ${isSidebarOpen ? 'lg:w-64' : 'lg:w-16 lg:overflow-hidden'}
          `}
        >
          <nav className={`h-full ${isSidebarOpen ? 'overflow-y-auto p-3 sm:p-4' : 'lg:overflow-hidden lg:p-2 p-3 sm:p-4 overflow-y-auto'} space-y-1.5 sm:space-y-2`}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const iconHoverScaleClass = isSidebarOpen ? 'group-hover:scale-110' : 'group-hover:scale-125';
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full flex items-center rounded-lg transition-all duration-200 transform group ${
                    isSidebarOpen ? 'justify-start text-right gap-2.5 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3' : 'lg:justify-center lg:px-2 lg:py-3 justify-start text-right gap-2.5 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3'
                  } ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-500 hover:text-white hover:scale-105'
                  }`}
                  title={!isSidebarOpen ? item.label : ''}
                >
                  <Icon
                    className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-200 transform ${
                      isActive ? 'text-white' : 'text-current group-hover:text-white'
                    } ${iconHoverScaleClass}`}
                  />
                  {(isSidebarOpen || isMenuOpen) && (
                    <span
                      className={`font-medium flex-1 text-right transition-colors duration-200 text-sm sm:text-base ${
                        isActive ? 'text-white' : 'group-hover:text-white'
                      }`}
                    >
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
            
            {/* Logout Button */}
            <div className={`pt-3 sm:pt-4 border-t border-gray-200 mt-3 sm:mt-4 ${!isSidebarOpen ? 'lg:pt-2' : ''}`}>
              <button
                onClick={() => handleMenuClick('logout')}
                className={`w-full flex items-center rounded-lg transition-all duration-200 transform text-red-600 hover:bg-red-500 hover:text-white hover:scale-105 group ${
                  isSidebarOpen ? 'justify-start text-right gap-2.5 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3' : 'lg:justify-center lg:px-2 lg:py-3 justify-start text-right gap-2.5 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3'
                }`}
                title={!isSidebarOpen ? 'خروج' : ''}
              >
                <LogOut
                  className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-200 transform ${
                    isSidebarOpen ? 'group-hover:scale-110' : 'group-hover:scale-125'
                  } group-hover:text-white`}
                />
                {(isSidebarOpen || isMenuOpen) && (
                  <span className="font-medium flex-1 text-right transition-colors duration-200 text-sm sm:text-base group-hover:text-white">خروج</span>
                )}
              </button>
            </div>
          </nav>
        </aside>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xs sm:max-w-md w-full p-5 sm:p-6">
            <div className="text-center mb-5 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <LogOut className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">خروج از سیستم</h3>
              <p className="text-sm sm:text-base text-gray-600">آیا مطمئن هستید که می‌خواهید از سیستم خارج شوید؟</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                انصراف
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                خروج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
