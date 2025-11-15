import React, { useState } from 'react';
import { Settings, User, Lock, Save, Eye, EyeOff } from 'lucide-react';

interface SettingsPageProps {
  onSave?: (data: AdminSettings) => void;
}

export interface AdminSettings {
  name: string;
  email: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onSave }) => {
  const [settings, setSettings] = useState<AdminSettings>({
    name: 'مدیر سیستم',
    email: 'admin@helal-ahmar.ir',
    phone: '09123456789',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (field: keyof AdminSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    setSuccessMessage('');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!settings.name.trim()) {
      newErrors.name = 'نام الزامی است';
    }

    if (!settings.email.trim()) {
      newErrors.email = 'ایمیل الزامی است';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) {
      newErrors.email = 'ایمیل معتبر نیست';
    }

    if (!settings.phone.trim()) {
      newErrors.phone = 'شماره تماس الزامی است';
    } else if (!/^09\d{9}$/.test(settings.phone)) {
      newErrors.phone = 'شماره تماس معتبر نیست';
    }

    if (settings.newPassword || settings.confirmPassword || settings.currentPassword) {
      if (!settings.currentPassword) {
        newErrors.currentPassword = 'رمز عبور فعلی الزامی است';
      }

      if (settings.newPassword && settings.newPassword.length < 6) {
        newErrors.newPassword = 'رمز عبور باید حداقل 6 کاراکتر باشد';
      }

      if (settings.newPassword !== settings.confirmPassword) {
        newErrors.confirmPassword = 'رمز عبور جدید با تأیید آن مطابقت ندارد';
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      if (onSave) {
        onSave(settings);
      }
      setSuccessMessage('اطلاعات با موفقیت ذخیره شد');
      setSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 text-right">
      <div className="bg-gray-300 shadow-sm border-b border-gray-200 p-4 sm:p-5 md:p-6 text-right">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex justify-end">
          <span className="relative inline-flex items-center justify-center pr-10 sm:pr-12">
            <Settings
              className="absolute right-0 w-8 h-8 sm:w-10 sm:h-10 text-red-500 animate-bounce pointer-events-none"
              aria-hidden="true"
            />
            <span className="relative z-10">تنظیمات</span>
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-2 text-right">مدیریت اطلاعات حساب کاربری</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 text-right">
        <div className="max-w-6xl w-full ml-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 text-right">
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex justify-end">
                <span className="relative inline-flex items-center justify-center pr-10">
                  <User
                    className="absolute right-0 w-7 h-7 text-red-500 animate-pulse pointer-events-none"
                    aria-hidden="true"
                  />
                  <span className="relative z-10">اطلاعات شخصی</span>
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    :ایمیل
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    dir="rtl"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 text-right">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    :نام و نام خانوادگی
                  </label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    dir="rtl"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1 text-right">{errors.name}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    :شماره تماس
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="09123456789"
                    dir="rtl"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1 text-right">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Password Change */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex justify-end">
                <span className="relative inline-flex items-center justify-center pr-10">
                  <Lock
                    className="absolute right-0 w-7 h-7 text-red-500/70 animate-pulse pointer-events-none"
                    aria-hidden="true"
                  />
                  <span className="relative z-10">تغییر رمز عبور</span>
                </span>
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  :رمز عبور فعلی
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={settings.currentPassword}
                    onChange={(e) => handleChange('currentPassword', e.target.value)}
                    className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right ${
                      errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-red-500 text-xs mt-1 text-right">{errors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  :رمز عبور جدید
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={settings.newPassword}
                    onChange={(e) => handleChange('newPassword', e.target.value)}
                    className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-xs mt-1 text-right">{errors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  تأیید رمز عبور جدید
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={settings.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 text-right">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold flex flex-row-reverse items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
              >
                <Save className="w-5 h-5" />
                ذخیره تغییرات
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

