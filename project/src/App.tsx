import React, { useState } from 'react';
import { MapProvider } from './context/MapContext';
import { mockResponders, mockAlerts } from './data/mockData';
import AdminDashboard from './components/AdminDashboard';
import ResponderDashboard from './components/ResponderDashboard';
import Login from './components/Login';
import { Shield, User } from 'lucide-react';

type ViewMode = 'selection' | 'login' | 'loginResponder' | 'admin' | 'responder';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (viewMode === 'selection') {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="absolute inset-0 bg-[url('/images/emdad2.png')] bg-cover bg-center bg-fixed blur-sm"></div>
        <div className="relative max-w-4xl w-full z-10">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <div className="bg-white py-3 px-4 sm:py-4 sm:px-5 rounded-lg">
              <div className="flex items-center justify-center gap-3 mb-1">
                <img src="/images/logo.svg" alt="هلال احمر" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4">سامانه آماده‌باش هلال‌احمر</h1>
              <p className="text-sm sm:text-base text-gray-600">سیستم مدیریت امدادگران و اعلان‌های حوادث</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            <button
              onClick={() => setViewMode('login')}
              className="bg-white p-6 sm:p-7 md:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-red-600 group"
            >
              <div className="flex flex-col items-center gap-3 sm:gap-4">
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors">
                  <Shield className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-red-600 group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">پنل مدیریت</h2>
                <p className="text-sm sm:text-base text-gray-600 text-center">مدیریت امدادگران و ارسال اعلان‌های حوادث</p>
              </div>
            </button>

            <button
              onClick={() => setViewMode('loginResponder')}
              className="bg-white p-6 sm:p-7 md:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-red-600 group"
            >
              <div className="flex flex-col items-center gap-3 sm:gap-4">
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors">
                  <User className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-red-600 group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">پنل امدادگر</h2>
                <p className="text-sm sm:text-base text-gray-600 text-center">مشاهده و پاسخ به اعلان‌های حوادث</p>
              </div>
            </button>
          </div>

          <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-white px-2">
            <p>این سیستم برای مدیریت امدادگران و هماهنگی در مواقع اضطراری طراحی شده است</p>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'login') {
    return (
      <Login
        loginType="admin"
        onLogin={() => {
          setIsAuthenticated(true);
          setViewMode('admin');
        }}
        onBack={() => setViewMode('selection')}
      />
    );
  }

  if (viewMode === 'loginResponder') {
    return (
      <Login
        loginType="responder"
        onLogin={() => {
          setIsAuthenticated(true);
          setViewMode('responder');
        }}
        onBack={() => setViewMode('selection')}
      />
    );
  }

  return (
    <MapProvider initialAlerts={mockAlerts} initialResponders={mockResponders}>
      <div className="relative">
        {viewMode === 'admin' ? (
          <AdminDashboard 
            onLogout={() => {
              setIsAuthenticated(false);
              setViewMode('login');
            }}
          />
        ) : (
          <ResponderDashboard />
        )}
      </div>
    </MapProvider>
  );
}

export default App;
