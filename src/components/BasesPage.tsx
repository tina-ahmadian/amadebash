import React, { useEffect, useMemo, useState } from 'react';
import { Building2, MapPin, Users, CheckCircle, XCircle, Plus, X, Search, AlertCircle, Trash2, Copy } from 'lucide-react';
import { Base } from '../data/mockData';
import LocationPickerMap from './LocationPickerMap';

interface BasesPageProps {
  bases: Base[];
}

const BasesPage: React.FC<BasesPageProps> = ({ bases }) => {
  const [baseList, setBaseList] = useState<Base[]>(bases);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newBase, setNewBase] = useState({
    name: '',
    code: '',
    latitude: '',
    longitude: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [successBase, setSuccessBase] = useState<Base | null>(null);
  const [baseToDelete, setBaseToDelete] = useState<Base | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch bases from API
  const fetchBases = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      console.log('Fetching bases with token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
      
      if (!token) {
        setError('توکن ورودی یافت نشد. لطفاً دوباره وارد شوید.');
        setIsLoading(false);
        return;
      }

      // Call API
      const response = await fetch('/api/api/v1/bases', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Bases API Response Status:', response.status);

      if (!response.ok) {
        throw new Error(`خطا در دریافت اطلاعات: ${response.status}`);
      }

      const data = await response.json();
      console.log('Bases API Response:', data);
      
      // Update bases list
      // Assuming the API returns an array of bases or an object with a data property
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
      
      setBaseList(basesData);
      
    } catch (err) {
      console.error('Error fetching bases:', err);
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات پایگاه‌ها');
      // Fallback to mock data if API fails
      setBaseList(bases);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBases();
  }, []);

  const resetForm = () => {
    setNewBase({
      name: '',
      code: '',
      latitude: '',
      longitude: ''
    });
    setErrors({});
  };

  const handleInputChange = (field: keyof typeof newBase, value: string) => {
    setNewBase(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '', submit: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!newBase.name.trim()) {
      newErrors.name = 'نام پایگاه الزامی است';
    }

    if (!newBase.code.trim()) {
      newErrors.code = 'کد پایگاه الزامی است';
    }

    if (!newBase.latitude.trim() || !newBase.longitude.trim()) {
      newErrors.location = 'لطفاً موقعیت جغرافیایی را روی نقشه انتخاب کنید';
    } else {
      const lat = Number(newBase.latitude);
      const lng = Number(newBase.longitude);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        newErrors.location = 'موقعیت جغرافیایی نامعتبر است';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddBase = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    const latitude = Number(newBase.latitude);
    const longitude = Number(newBase.longitude);

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setErrors(prev => ({ ...prev, submit: 'توکن ورودی یافت نشد. لطفاً دوباره وارد شوید.' }));
        return;
      }

      // Prepare request body
      const requestBody = {
        code: newBase.code.trim(),
        name: newBase.name.trim(),
        latitude: latitude,
        longitude: longitude
      };

      console.log('Sending base data:', requestBody);

      // Call API (استفاده از مسیر نسبی برای عبور از پروکسی)
      const response = await fetch('/api/api/v1/bases', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Base API Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `خطا در ثبت پایگاه: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Base created successfully:', responseData);

      // Extract the actual base data from response
      const apiBase = responseData.data || responseData;
      
      // Create base object for local state
      const baseToAdd: Base = {
        id: apiBase.id || `${Date.now()}`,
        code: apiBase.code || newBase.code.trim(),
        address: apiBase.name || newBase.name.trim(),
        location: {
          lat: apiBase.latitude || latitude,
          lng: apiBase.longitude || longitude
        },
        activeResponders: apiBase.activeResponders || 0,
        inactiveResponders: apiBase.inactiveResponders || 0
      };

      setBaseList(prev => [baseToAdd, ...prev]);
      resetForm();
      setIsFormOpen(false);
      setSuccessBase(baseToAdd);
      
      // Refresh the bases list from API
      fetchBases();

    } catch (err) {
      console.error('Error creating base:', err);
      setErrors(prev => ({ 
        ...prev, 
        submit: err instanceof Error ? err.message : 'خطا در ثبت پایگاه. لطفاً دوباره تلاش کنید.' 
      }));
    }
  };

  const handleCancel = () => {
    resetForm();
    setIsFormOpen(false);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setNewBase(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));
    setErrors(prev => ({ ...prev, location: '', submit: '' }));
  };

  const handleDeleteBase = async () => {
    if (!baseToDelete) return;

    setIsDeleting(true);

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        alert('توکن ورودی یافت نشد. لطفاً دوباره وارد شوید.');
        setIsDeleting(false);
        setBaseToDelete(null);
        return;
      }

      console.log('Deleting base with ID:', baseToDelete.id);

      // Call delete API
      const response = await fetch(`/api/api/v1/bases/${baseToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Delete API Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `خطا در حذف پایگاه: ${response.status}`);
      }

      // Remove base from local state
      setBaseList(prev => prev.filter(base => base.id !== baseToDelete.id));
      
      console.log('Base deleted successfully');
      
      // Close modal
      setBaseToDelete(null);
      
      // Refresh bases list
      fetchBases();

    } catch (err) {
      console.error('Error deleting base:', err);
      alert(err instanceof Error ? err.message : 'خطا در حذف پایگاه. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBases = useMemo(() => {
    if (!searchQuery.trim()) {
      return baseList;
    }

    const query = searchQuery.trim().toLowerCase();

    return baseList.filter((base) => {
      const codeMatch = base.code?.toLowerCase().includes(query);
      const addressMatch = base.address?.toLowerCase().includes(query);

      return codeMatch || addressMatch;
    });
  }, [baseList, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-gray-50 text-right">
      <div className="bg-gray-300 shadow-sm border-b border-gray-200 p-4 sm:p-5 md:p-6 text-right">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex justify-end">
          <span className="relative inline-flex items-center justify-center pr-10 sm:pr-12">
            <Building2
              className="absolute right-0 w-8 h-8 sm:w-10 sm:h-10 text-red-600 animate-bounce pointer-events-none"
              aria-hidden="true"
            />
            <span className="relative z-10">اطلاعات پایگاه‌های امدادی</span>
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-2 text-right">لیست تمام پایگاه‌های امدادی و اطلاعات مربوطه</p>
        <div className="mt-3 sm:mt-4 flex flex-col md:flex-row-reverse md:items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors transform transition-transform hover:scale-110 shadow order-first md:order-none self-stretch md:self-auto text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            افزودن پایگاه جدید
          </button>
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="جستجو بر اساس آدرس یا کد پایگاه..."
              className="w-full pr-9 sm:pr-10 pl-3 sm:pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right text-sm sm:text-base"
              dir="rtl"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 text-right relative">

        {isFormOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-3 sm:px-4"
            onClick={handleCancel}
          >
            <div
              className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl sm:rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative bg-gradient-to-l from-red-700 via-red-600 to-red-500 text-white px-4 sm:px-6 py-4 sm:py-5">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-1">افزودن پایگاه جدید</h3>
                  <p className="text-xs sm:text-sm text-red-100">لطفاً اطلاعات پایگاه را جهت ثبت در سامانه تکمیل کنید.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="absolute top-1/2 left-4 sm:left-6 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors w-8 h-8 sm:w-9 sm:h-9"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </div>

              <form
                onSubmit={handleAddBase}
                className="p-4 sm:p-6 space-y-3 sm:space-y-4 text-right overflow-y-auto max-h-[90vh]"
              >
                <div>
                  <label className="block text-md font-medium text-gray-700 mb-2">نام پایگاه</label>
                  <input
                    type="text"
                    value={newBase.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="مثال: پایگاه امداد کوهستان صفه"
                    dir="rtl"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        const demoCode = 'NK5BiNn1gxheo0POYja5';
                        navigator.clipboard.writeText(demoCode);
                        // Show a brief success indicator
                        const btn = document.getElementById('copy-base-code-btn');
                        if (btn) {
                          const originalText = btn.innerHTML;
                          btn.innerHTML = '<span class="text-green-600">✓ کپی شد</span>';
                          setTimeout(() => {
                            btn.innerHTML = originalText;
                          }, 1500);
                        }
                      }}
                      id="copy-base-code-btn"
                      className="group flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300"
                    >
                      <Copy className="w-3 h-3" />
                      <span className="font-mono">NK5BiNn1gxheo0POYja5</span>
                      <span className="text-[10px]">(نمونه)</span>
                    </button>
                    <label className="text-md font-medium text-gray-700">کد پایگاه</label>
                  </div>
                  <input
                    type="text"
                    value={newBase.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right ${
                      errors.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="مثال: ISF-001"
                    dir="rtl"
                  />
                  {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
                </div>

                {/* نقشه انتخاب موقعیت */}
                <div>
                  <label className="block text-md font-medium text-gray-700 mb-2">
                    انتخاب موقعیت جغرافیایی پایگاه
                  </label>
                  <div className={`w-full h-80 border-2 rounded-lg overflow-hidden ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}>
                    <LocationPickerMap 
                      onLocationSelect={handleLocationSelect}
                      initialPosition={
                        newBase.latitude && newBase.longitude
                          ? { lat: Number(newBase.latitude), lng: Number(newBase.longitude) }
                          : undefined
                      }
                    />
                  </div>
                  {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
                </div>

                {/* نمایش مختصات جغرافیایی */}
                {(newBase.latitude && newBase.longitude) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2 justify-end">
                      <span className="font-semibold text-green-800">مختصات انتخاب شده:</span>
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white rounded px-3 py-2 text-right">
                        <span className="text-gray-600">عرض جغرافیایی: </span>
                        <span className="font-mono font-bold text-gray-800">{newBase.latitude}</span>
                      </div>
                      <div className="bg-white rounded px-3 py-2 text-right">
                        <span className="text-gray-600">طول جغرافیایی: </span>
                        <span className="font-mono font-bold text-gray-800">{newBase.longitude}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* نمایش خطای submit */}
                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-red-700 text-sm">{errors.submit}</span>
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-green-400 text-gray-700 hover:bg-green-500 transition-colors font-semibold shadow"
                  >
                    ثبت پایگاه
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {successBase && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
            onClick={() => setSuccessBase(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm p-6 space-y-6 text-right"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">!ثبت موفق</h4>
                    <p className="text-sm text-gray-500">.اطلاعات پایگاه با موفقیت ثبت شد</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessBase(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSuccessBase(null)}
                className="w-full py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {baseToDelete && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => !isDeleting && setBaseToDelete(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md p-6 space-y-6 text-right"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">تأیید حذف پایگاه</h4>
                  </div>
                </div>
                {!isDeleting && (
                  <button
                    type="button"
                    onClick={() => setBaseToDelete(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">آیا از حذف این پایگاه اطمینان دارید؟</p>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-gray-800">{baseToDelete.code} :کد پایگاه</p>
                  <p className="text-gray-600">آدرس: {baseToDelete.address}</p>
                </div>
                <p className="text-red-600 text-xs mt-3 font-medium">!این عملیات قابل بازگشت نیست</p>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setBaseToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleDeleteBase}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>در حال حذف...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>حذف پایگاه</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 text-lg">در حال دریافت اطلاعات پایگاه‌ها...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="text-center py-12">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md mx-auto">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 text-lg font-semibold mb-2">خطا در دریافت اطلاعات</p>
              <p className="text-gray-600 text-sm mb-4">{error}</p>
              <button
                onClick={fetchBases}
                className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Building2 className="w-5 h-5" />
                تلاش مجدد
              </button>
            </div>
          </div>
        ) : baseList.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">هیچ پایگاهی ثبت نشده است</p>
          </div>
        ) : filteredBases.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">پایگاهی مطابق جستجو یافت نشد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 text-right">
            {filteredBases.map((base) => (
              <div
                key={base.id}
                className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 hover:shadow-lg transition-shadow border border-gray-100 text-right"
              >
                <div className="flex flex-row-reverse items-start justify-between mb-4">
                  <div className="flex flex-row-reverse items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">{base.code}</h3>
                      <p className="text-xs text-gray-500">کد پایگاه</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-row-reverse items-start gap-2 text-sm text-gray-700">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span>{base.address}</span>
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex items-center justify-between flex-row-reverse">
                      <div className="flex flex-row-reverse items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>:امدادگران فعال</span>
                      </div>
                      <span className="font-bold text-green-600">نفر {(base.activeResponders || 0).toLocaleString('fa-IR')}</span>
                    </div>
                    <div className="flex items-center justify-between flex-row-reverse">
                      <div className="flex flex-row-reverse items-center gap-2 text-sm text-gray-700">
                        <XCircle className="w-4 h-4 text-gray-500" />
                        <span>:امدادگران غیرفعال</span>
                      </div>
                      <span className="font-bold text-gray-600">نفر {(base.inactiveResponders || 0).toLocaleString('fa-IR')}</span>
                    </div>
                    <div className="flex items-center justify-between flex-row-reverse pt-2 border-t border-gray-100">
                      <div className="flex flex-row-reverse items-center gap-2 text-sm font-medium text-gray-800">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span>:مجموع</span>
                      </div>
                      <span className="font-bold text-blue-600">
                        نفر {((base.activeResponders || 0) + (base.inactiveResponders || 0)).toLocaleString('fa-IR')}
                      </span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setBaseToDelete(base)}
                      className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف پایگاه</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BasesPage;

