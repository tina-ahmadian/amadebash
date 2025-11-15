import React, { useState } from 'react';
import { Shield, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  onBack: () => void;
  loginType?: 'admin' | 'responder';
}

const Login: React.FC<LoginProps> = ({ onLogin, onBack, loginType = 'admin' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Demo credentials based on login type
  const DEMO_CREDENTIALS = {
    admin: { username: 'tina', password: 'tina1234' },
    responder: { username: '+989912626132', password: '12345678' }
  };

  const DEMO_USERNAME = DEMO_CREDENTIALS[loginType].username;
  const DEMO_PASSWORD = DEMO_CREDENTIALS[loginType].password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Determine API endpoint and body based on login type
      const apiEndpoint = loginType === 'admin' 
        ? '/api/api/v1/auth/admin/login'
        : '/api/api/v1/auth/rescuer/login';
      
      const requestBody = loginType === 'admin'
        ? { username: username, password: password }
        : { 
            phone_number: username, 
            password: password,
            fcm_token: 'web-client-' + Date.now() // Generate a unique FCM token for web client
          };

      // Call the login API via proxy
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      // Debug: Log the response to see the structure
      console.log('Login API Response:', data);

      if (response.ok) {
        // Login successful
        // Try different possible token keys from the API response
        const token = data.token || 
                      data.access_token || 
                      data.accessToken || 
                      data.data?.token || 
                      data.data?.access_token || 
                      data.data?.accessToken;
        
        if (token) {
          localStorage.setItem('authToken', token);
          console.log('Token saved successfully:', token.substring(0, 20) + '...');
        } else {
          console.warn('No token found in response:', data);
          // Still proceed with login but show warning
          localStorage.setItem('authToken', 'demo-token-' + Date.now());
        }
        
        // For responder login, fetch accidents list
        if (loginType === 'responder') {
          try {
            const accidentsResponse = await fetch('/api/api/v1/accidents', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token || 'demo-token'}`,
                'Content-Type': 'application/json',
              },
            });

            if (accidentsResponse.ok) {
              const accidentsData = await accidentsResponse.json();
              console.log('Accidents fetched successfully:', accidentsData);
              // Store accidents data in localStorage for later use
              localStorage.setItem('accidentsData', JSON.stringify(accidentsData));
            } else {
              console.warn('Failed to fetch accidents:', accidentsResponse.status);
            }
          } catch (error) {
            console.error('Error fetching accidents:', error);
            // Don't block login if accidents fetch fails
          }
        }
        
        setIsLoading(false);
        onLogin();
      } else {
        // Login failed
        setIsLoading(false);
        const errorMessage = loginType === 'admin' 
          ? 'نام کاربری یا رمز عبور اشتباه است'
          : 'شماره تلفن یا رمز عبور اشتباه است';
        setError(data.message || errorMessage);
      }
    } catch (error) {
      setIsLoading(false);
      setError('خطا در برقراری ارتباط با سرور');
      console.error('Login error:', error);
    }
  };

  // Get background image based on login type
  const backgroundImage = loginType === 'admin' ? '/images/adminlogin.png' : '/images/helal.png';

  // Full screen background with centered glassmorphism form
  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Full screen background image */}
      <img 
        src={backgroundImage} 
        alt={loginType === 'admin' ? 'امداد و نجات هلال احمر' : 'امداد و نجات'} 
        className="absolute inset-0 w-full h-full object-cover" 
      />
      
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      {/* Corner logo */}
      <img 
        src="/images/logo2.png" 
        alt="لوگوی هلال احمر" 
        className="absolute top-2 left-2 sm:top-4 sm:left-4 w-20 h-16 sm:w-24 sm:h-20 md:w-28 md:h-24 z-10 drop-shadow-lg" 
      />
      
      {/* Back Button - Top Right */}
      <button
        onClick={onBack}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 text-white/90 hover:text-white transition-all duration-200 transform hover:scale-110 flex items-center gap-1 sm:gap-2 group backdrop-blur-sm bg-black/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-white/20"
      >
        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 rotate-180 group-hover:translate-x-[-4px] transition-transform" />
        <span className="font-medium text-xs sm:text-sm">بازگشت</span>
      </button>
      
      {/* Centered login form */}
      <div className="relative h-full w-full flex items-center justify-center p-3 sm:p-4 md:p-8">
        <div className="w-full max-w-md">
          {/* Login Card with Glassmorphism */}
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-4 sm:p-5 md:p-6">
            {/* Header */}
            <div className="text-center mb-4 sm:mb-5">
              <div className="flex justify-center mb-2 sm:mb-3">
                <div className="rounded-full flex items-center bg-white/10 p-1 backdrop-blur-sm">
                  <img src="/images/logo2.png" alt="لوگوی هلال احمر" className="w-16 h-12 sm:w-20 sm:h-16" />
                </div>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white mb-1">
                ورود به {loginType === 'admin' ? 'پنل مدیریت' : 'پنل امدادگر'}
              </h1>
              <p className="text-white/80 text-xs">سامانه آماده باش هلال‌ احمر</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/30 backdrop-blur-sm border border-red-400/50 text-white px-2 sm:px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                  <Shield className="w-3 h-3 flex-shrink-0" />
                  <span className="text-xs">{error}</span>
                </div>
              )}

              {/* Username/Phone Field */}
              <div>
                <label htmlFor="username" className="block text-xs sm:text-sm font-semibold text-white/90 mb-1.5 sm:mb-2 text-right">
                  {loginType === 'admin' ? ':ورود ایمیل ' : ':شماره تلفن '}
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-white/50 text-white placeholder-white/60 py-1.5 sm:py-2 pr-7 sm:pr-8 pl-2 focus:outline-none focus:border-white transition-colors text-right text-xs sm:text-sm"
                    placeholder={loginType === 'admin' ? 'نام کاربری را وارد کنید' : 'شماره تلفن را وارد کنید'}
                    required
                    dir="rtl"
                  />
                  <div className="absolute inset-y-0 right-0 pr-1 sm:pr-2 flex items-center pointer-events-none">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-white/60" />
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-white/90 mb-1.5 sm:mb-2 text-right">
                  :رمز عبور را وارد کنید
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-white/50 text-white placeholder-white/60 py-1.5 sm:py-2 pr-7 sm:pr-8 pl-2 focus:outline-none focus:border-white transition-colors text-right text-xs sm:text-sm"
                    placeholder="رمز عبور را وارد کنید"
                    required
                    dir="rtl"
                  />
                  <div className="absolute inset-y-0 right-0 pr-1 sm:pr-2 flex items-center pointer-events-none">
                    <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-white/60" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-1 sm:pl-2 flex items-center hover:opacity-70 transition-opacity"
                  >
                    {showPassword ? (
                      <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-white/60" />
                    ) : (
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-white/60" />
                    )}
                  </button>
                </div>
              </div>

              {/* Demo Credentials Hint */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2.5 sm:p-3 text-xs">
                <p className="text-white font-semibold mb-1 sm:mb-1.5 text-right text-xs">:اطلاعات ورود </p>
                <div className="text-white/90 text-right flex items-center justify-between mb-0.5 sm:mb-1">
                  <span className="text-xs">{DEMO_USERNAME}</span>
                  <span className="font-medium text-xs">{loginType === 'admin' ? ' :نام کاربری' : ' :شماره تلفن'}</span>
                </div>
                <div className="text-white/90 text-right flex items-center justify-between">
                  <span className="text-xs">{DEMO_PASSWORD}</span>
                  <span className="font-medium text-xs"> :رمز عبور</span>
                </div>
                {loginType === 'responder' && (
                  <div className="mt-2 pt-2 border-t border-white/20">
                    <p className="text-white/80 text-xs text-right leading-relaxed">
                      .توجه کنید که مشخصات شما باید توسط مدیر ثبت شده باشد
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-gray-900 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-xs sm:text-sm"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>در حال ورود...</span>
                  </>
                ) : (
                  <>
                    <span>ورود</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


