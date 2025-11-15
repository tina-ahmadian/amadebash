/**
 * LocationTrackingDemo - Example integration component
 * Shows how to use RescuerLiveMap and RescuerLocationUpdater
 */

import React, { useState } from 'react';
import RescuerLiveMap from './RescuerLiveMap';
import RescuerLocationUpdater from './RescuerLocationUpdater';
import { MapPin, Activity } from 'lucide-react';

const LocationTrackingDemo = () => {
  const [activeTab, setActiveTab] = useState('map'); // 'map' or 'updater'

  // Example initial rescuers data (optional)
  const initialRescuers = [
    {
      id: '1',
      name: 'احمد رضایی',
      latitude: 35.6892,
      longitude: 51.3890,
      status: 'active',
      lastUpdate: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'فاطمه احمدی',
      latitude: 35.7000,
      longitude: 51.4000,
      status: 'busy',
      lastUpdate: new Date().toISOString(),
    },
  ];

  // Get API configuration from environment or use defaults
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '/api';
  const authToken = localStorage.getItem('authToken');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-red-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold" dir="rtl">سیستم ردیابی موقعیت امدادگران</h1>
          <p className="text-red-100 text-sm" dir="rtl">
            ردیابی لحظه‌ای موقعیت امدادگران هلال احمر
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex gap-2" dir="rtl">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'map'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <MapPin className="w-5 h-5" />
              نقشه زنده (پنل مدیریت)
            </button>
            <button
              onClick={() => setActiveTab('updater')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'updater'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <Activity className="w-5 h-5" />
              ارسال موقعیت (دستگاه امدادگر)
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'map' ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
            <RescuerLiveMap
              apiBaseUrl={apiBaseUrl}
              authToken={authToken}
              initialRescuers={initialRescuers}
            />
          </div>
        ) : (
          <RescuerLocationUpdater
            apiBaseUrl={apiBaseUrl}
            authToken={authToken}
          />
        )}
      </div>

      {/* Instructions */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6" dir="rtl">
          <h2 className="text-lg font-bold text-blue-900 mb-3">راهنمای استفاده</h2>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>نقشه زنده (پنل مدیریت):</strong></p>
            <ul className="list-disc list-inside mr-4 space-y-1">
              <li>موقعیت تمام امدادگران را به صورت زنده نمایش می‌دهد</li>
              <li>رنگ نشانگرها بر اساس وضعیت امدادگر تغییر می‌کند (سبز: فعال، قرمز: غیرفعال، نارنجی: مشغول)</li>
              <li>با کلیک روی هر نشانگر، اطلاعات امدادگر نمایش داده می‌شود</li>
              <li>بروزرسانی‌ها از طریق SSE به صورت خودکار دریافت می‌شود</li>
            </ul>
            <p className="mt-3"><strong>ارسال موقعیت (دستگاه امدادگر):</strong></p>
            <ul className="list-disc list-inside mr-4 space-y-1">
              <li>دکمه "شروع ردیابی" را برای فعال‌سازی GPS بزنید</li>
              <li>موقعیت شما به صورت خودکار به سرور ارسال می‌شود</li>
              <li>مطمئن شوید که دسترسی به موقعیت مکانی را تایید کرده‌اید</li>
              <li>برای متوقف کردن، دکمه "توقف ردیابی" را بزنید</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationTrackingDemo;

