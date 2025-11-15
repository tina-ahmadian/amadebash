import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Search, User, Phone, MapPin, Shield, CheckCircle, XCircle, Clock, Plus, X, AlertCircle, ChevronDown, Trash2, Copy } from 'lucide-react';
import { Responder, ResponderStatus, Base } from '../data/mockData';
import { useMapContext } from '../context/MapContext';

const expertCategoryOptions = [
  { value: '', label: 'انتخاب کنید' },
  { value: 'medical', label: 'پزشکی' },
  { value: 'fire', label: 'آتش‌نشانی' },
  { value: 'water_rescue', label: 'نجات آبی' },
  { value: 'mountain_rescue', label: 'نجات کوهستان' },
  { value: 'technical_rescue', label: 'نجات فنی' },
];

interface RespondersInfoPageProps {
  responders: Responder[];
}

const RespondersInfoPage: React.FC<RespondersInfoPageProps> = ({ responders }) => {
  const { setResponders } = useMapContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [responderList, setResponderList] = useState<Responder[]>(responders);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bases, setBases] = useState<Base[]>([]);
  const [isLoadingBases, setIsLoadingBases] = useState(false);
  const [newResponder, setNewResponder] = useState({
    name: '',
    gender: 'male' as 'male' | 'female',
    phone: '',
    organizationalCode: '',
    nationalId: '',
    age: '',
    expertCategory: '',
    status: 'active' as ResponderStatus,
    baseId: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpertCategoryOpen, setIsExpertCategoryOpen] = useState(false);
  const expertCategoryHoverTimeout = useRef<number | null>(null);
  const expertCategoryCloseTimeout = useRef<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ show: boolean; responderId: string | null }>({
    show: false,
    responderId: null
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAddSuccessModal, setShowAddSuccessModal] = useState(false);

  // Fetch bases from API
  const fetchBases = async () => {
    setIsLoadingBases(true);
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.warn('No auth token found for fetching bases');
        setIsLoadingBases(false);
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
      console.log('Bases API Response:', data);
      
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
    } finally {
      setIsLoadingBases(false);
    }
  };

  // Fetch responders from API
  const fetchResponders = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      console.log('Fetching rescuers with token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
      
      if (!token) {
        setError('توکن ورودی یافت نشد. لطفاً دوباره وارد شوید.');
        setIsLoading(false);
        return;
      }

      // Call API
      const response = await fetch('/api/api/v1/rescuers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('API Response Status:', response.status);

      if (!response.ok) {
        throw new Error(`خطا در دریافت اطلاعات: ${response.status}`);
      }

      const data = await response.json();
      console.log('Rescuers API Response:', data);
      
      // Update responder list
      let respondersData = Array.isArray(data) ? data : data.data || data.rescuers || [];
      
      // Map API data to Responder structure
      const mappedResponders: Responder[] = respondersData.map((rescuer: any) => ({
        id: rescuer.id?.toString() || `${Date.now()}-${Math.random()}`,
        name: rescuer.name || 'بدون نام',
        gender: rescuer.gender || 'male',
        status: rescuer.status || 'inactive',
        organizationalCode: rescuer.organization_code || '',
        nationalId: rescuer.iranian_identity_code || '',
        address: rescuer.address || `موقعیت: ${rescuer.latitude || 0}, ${rescuer.longitude || 0}`,
        age: rescuer.age || 0,
        specialty: rescuer.expert_category || '',
        acceptedIncidentsCount: rescuer.accepted_incidents_count || 0,
        completedMissions: rescuer.completed_missions || [],
        position: {
          lat: rescuer.latitude || 0,
          lng: rescuer.longitude || 0
        },
        phone: rescuer.phone_number || ''
      }));
      
      console.log('Mapped Responders:', mappedResponders);
      setResponderList(mappedResponders);
      setResponders(mappedResponders);
      
    } catch (err) {
      console.error('Error fetching responders:', err);
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات امدادگران');
      // Fallback to mock data if API fails
      setResponderList(responders);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBases();
    fetchResponders();
  }, []);

  const filteredResponders = useMemo(() => {
    if (!searchQuery.trim()) return responderList;
    
    const query = searchQuery.toLowerCase();
    return responderList.filter(responder => {
      return (
        responder.name.toLowerCase().includes(query) ||
        responder.phone.includes(query) ||
        responder.status.toLowerCase().includes(query) ||
        responder.organizationalCode.toLowerCase().includes(query) ||
        responder.nationalId.includes(query) ||
        responder.address.toLowerCase().includes(query) ||
        responder.specialty.toLowerCase().includes(query) ||
        (responder.acceptedIncidentsCount && responder.acceptedIncidentsCount.toString().includes(query)) ||
        (responder.completedMissions && responder.completedMissions.length > 0 && responder.completedMissions.some(mission => mission.toLowerCase().includes(query))) ||
        (responder.gender === 'male' ? 'مرد' : 'زن').includes(query)
      );
    });
  }, [responderList, searchQuery]);

  const resetForm = () => {
    setNewResponder({
      name: '',
      gender: 'male',
      phone: '',
      organizationalCode: '',
      nationalId: '',
      age: '',
      expertCategory: '',
      status: 'active',
      baseId: '',
      password: ''
    });
    setFormErrors({});
  };

  // Expert Category Dropdown handlers
  const clearTimeoutRef = (ref: React.MutableRefObject<number | null>) => {
    if (ref.current !== null) {
      clearTimeout(ref.current);
      ref.current = null;
    }
  };

  const handleExpertCategoryHover = () => {
    if (expertCategoryHoverTimeout.current !== null) return;
    clearTimeoutRef(expertCategoryCloseTimeout);
    expertCategoryHoverTimeout.current = window.setTimeout(() => {
      setIsExpertCategoryOpen(true);
      expertCategoryHoverTimeout.current = null;
    }, 200);
  };

  const handleExpertCategoryLeave = () => {
    clearTimeoutRef(expertCategoryHoverTimeout);
    clearTimeoutRef(expertCategoryCloseTimeout);
    expertCategoryCloseTimeout.current = window.setTimeout(() => {
      setIsExpertCategoryOpen(false);
      expertCategoryCloseTimeout.current = null;
    }, 150);
  };

  const handleExpertCategorySelect = (value: string) => {
    setNewResponder(prev => ({ ...prev, expertCategory: value }));
    setFormErrors(prev => ({ ...prev, expertCategory: '' }));
    setIsExpertCategoryOpen(false);
  };

  const handleFieldChange = (field: keyof typeof newResponder, value: string) => {
    setNewResponder(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!newResponder.name.trim()) errors.name = 'نام الزامی است';
    if (!newResponder.phone.trim()) {
      errors.phone = 'شماره همراه الزامی است';
    }
    if (!newResponder.organizationalCode.trim()) errors.organizationalCode = 'کد سازمانی الزامی است';
    if (!newResponder.nationalId.trim()) errors.nationalId = 'کد ملی الزامی است';
    if (!/^\d{10}$/.test(newResponder.nationalId)) errors.nationalId = 'کد ملی باید ۱۰ رقم باشد';
    if (!newResponder.age.trim()) {
      errors.age = 'سن الزامی است';
    } else if (isNaN(Number(newResponder.age)) || Number(newResponder.age) <= 0) {
      errors.age = 'سن معتبر وارد کنید';
    }
    if (!newResponder.expertCategory) errors.expertCategory = 'انتخاب تخصص الزامی است';
    if (!newResponder.baseId) errors.baseId = 'انتخاب سازمان الزامی است';
    if (!newResponder.password.trim()) {
      errors.password = 'رمز عبور الزامی است';
    } else if (newResponder.password.trim().length < 8) {
      errors.password = 'رمز عبور باید حداقل ۸ کاراکتر باشد';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddResponder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setFormErrors({ submit: 'توکن ورودی یافت نشد. لطفاً دوباره وارد شوید.' });
        return;
      }

      // Map status to API format
      const mapStatusToAPI = (status: ResponderStatus): string => {
        if (status === 'active') return 'active';
        if (status === 'inactive') return 'deactive';
        return 'deactive'; // default
      };

      // Format phone number to international format
      const formatPhoneNumber = (phone: string): string => {
        const cleanPhone = phone.trim().replace(/\s/g, '');
        // اگر با + شروع می‌شود، همان را برگردان
        if (cleanPhone.startsWith('+')) {
          return cleanPhone;
        }
        // اگر با 0 شروع می‌شود، 0 را با +98 جایگزین کن
        if (cleanPhone.startsWith('0')) {
          return '+98' + cleanPhone.substring(1);
        }
        // در غیر این صورت + را اضافه کن
        return '+' + cleanPhone;
      };

      // Prepare API payload
      const payload = {
        name: newResponder.name.trim(),
        gender: newResponder.gender,
        phone_number: formatPhoneNumber(newResponder.phone),
        organization_code: newResponder.organizationalCode.trim(),
        iranian_identity_code: newResponder.nationalId.trim(),
        expert_category: newResponder.expertCategory,
        age: Number(newResponder.age),
        base_id: newResponder.baseId,
        status: mapStatusToAPI(newResponder.status),
        fcm_token: 'default_fcm_token',
        password: newResponder.password.trim()
      };

      console.log('Creating new rescuer with payload:', payload);

      // Call API
      const response = await fetch('/api/api/v1/rescuers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('Create rescuer API Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error creating rescuer:', errorData);
        throw new Error(errorData.message || `خطا در ثبت امدادگر: ${response.status}`);
      }

      const data = await response.json();
      console.log('Create rescuer success:', data);

      // Refresh responder list
      await fetchResponders();
      
      resetForm();
      setIsFormOpen(false);
      
      // Show success modal
      setShowAddSuccessModal(true);
      
      // Auto close success modal after 3 seconds
      setTimeout(() => {
        setShowAddSuccessModal(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error adding responder:', err);
      setFormErrors({ 
        submit: err instanceof Error ? err.message : 'خطا در ثبت امدادگر. لطفاً دوباره تلاش کنید.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    resetForm();
    setIsFormOpen(false);
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (responderId: string) => {
    setDeleteConfirmModal({ show: true, responderId });
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirmModal({ show: false, responderId: null });
  };

  // Confirm and delete responder
  const confirmDeleteResponder = async () => {
    const responderId = deleteConfirmModal.responderId;
    if (!responderId) return;

    try {
      setDeletingId(responderId);
      setDeleteConfirmModal({ show: false, responderId: null });
      
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        alert('توکن ورودی یافت نشد. لطفاً دوباره وارد شوید.');
        return;
      }

      console.log('Deleting rescuer with ID:', responderId);

      const response = await fetch(`/api/api/v1/rescuers/${responderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Delete rescuer API Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error deleting rescuer:', errorData);
        throw new Error(errorData.message || `خطا در حذف امدادگر: ${response.status}`);
      }

      console.log('Rescuer deleted successfully');
      
      // Refresh the list
      await fetchResponders();
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Auto close success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error deleting rescuer:', err);
      alert(err instanceof Error ? err.message : 'خطا در حذف امدادگر. لطفاً دوباره تلاش کنید.');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: ResponderStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4" />
            فعال
          </span>
        );
      case 'on_duty':
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
            <Clock className="w-4 h-4" />
            در حال خدمت
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
            <XCircle className="w-4 h-4" />
            غیرفعال
          </span>
        );
      default:
        return null;
    }
  };

  const getGenderLabel = (gender: 'male' | 'female') => {
    return gender === 'male' ? 'مرد' : 'زن';
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 text-right">
      <div className="bg-gray-300 shadow-sm border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 text-right">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="text-xs sm:text-sm text-gray-700 font-semibold text-right order-2 md:order-1">
            تعداد کل: <span className="font-extrabold text-red-600">{responderList.length}</span> نفر
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex justify-end order-1 md:order-2">
            <span className="relative inline-flex items-center justify-center pr-10 sm:pr-12">
              <User
                className="absolute right-0 w-8 h-8 sm:w-10 sm:h-10 text-red-600 animate-bounce pointer-events-none"
                aria-hidden="true"
              />
              <span className="relative z-10">اطلاعات کل امدادگران</span>
            </span>
          </h2>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="جستجو بر اساس نام، شماره تماس، وضعیت..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 sm:pr-10 pl-20 sm:pl-24 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right text-sm sm:text-base"
              dir="rtl"
            />
            <button
              type="button"
              onClick={() => {/* افزودن رفتار جستجو در صورت نیاز */}}
              className="absolute left-2 top-1/2 -translate-y-1/2 px-2 sm:px-3 py-1 bg-red-600 text-white text-xs sm:text-sm rounded-md hover:bg-red-700 transition-colors"
            >
              جستجو
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors transform transition-transform hover:scale-110 shadow self-stretch md:self-auto text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            افزودن امدادگر جدید
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={handleCancelForm}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative bg-gradient-to-l from-red-700 via-red-600 to-red-500 text-white px-6 py-5">
              <div>
                <h3 className="text-xl font-semibold hovermb-1">افزودن امدادگر جدید</h3>
                <p className="text-sm text-red-100">
                  .لطفاً اطلاعات ضروری امدادگر را جهت ثبت در سامانه تکمیل کنید
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelForm}
                className="absolute top-1/2 left-6 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors w-9 h-9"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <form
              onSubmit={handleAddResponder}
              className="p-6 space-y-4 text-right overflow-y-auto max-h-[90vh]"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-md font-medium text-gray-700 mb-2">:جنسیت</label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <select
                      value={newResponder.gender}
                      onChange={(e) => handleFieldChange('gender', e.target.value as 'male' | 'female')}
                      className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right border-gray-300"
                    >
                      <option value="male">مرد</option>
                      <option value="female">زن</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">:نام و نام خانوادگی</label>
                  <input
                    type="text"
                    value={newResponder.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    dir="rtl"
                  />
                  {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-md font-medium text-gray-700 mb-2">:شماره همراه</label>
                  <input
                    type="tel"
                    value={newResponder.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-left ${
                      formErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    dir="ltr"
                    placeholder="09133074616"
                  />
                  {formErrors.phone && <p className="text-xs text-red-500 mt-1 text-right">{formErrors.phone}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        const demoCode = '2EAAf9re';
                        navigator.clipboard.writeText(demoCode);
                        // Show a brief success indicator
                        const btn = document.getElementById('copy-code-btn');
                        if (btn) {
                          const originalText = btn.innerHTML;
                          btn.innerHTML = '<span class="text-green-600">✓ کپی شد</span>';
                          setTimeout(() => {
                            btn.innerHTML = originalText;
                          }, 1500);
                        }
                      }}
                      id="copy-code-btn"
                      className="group flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300"
                    >
                      <Copy className="w-3 h-3" />
                      <span className="font-mono">2EAAf9re</span>
                      <span className="text-[10px]">(نمونه)</span>
                    </button>
                    <label className="text-md font-medium text-gray-700">:کد سازمانی</label>
                  </div>
                  <input
                    type="text"
                    value={newResponder.organizationalCode}
                    onChange={(e) => handleFieldChange('organizationalCode', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right ${
                      formErrors.organizationalCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    dir="rtl"
                  />
                  {formErrors.organizationalCode && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.organizationalCode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-md font-medium text-gray-700 mb-2">:کد ملی</label>
                  <input
                    type="text"
                    value={newResponder.nationalId}
                    onChange={(e) => handleFieldChange('nationalId', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right ${
                      formErrors.nationalId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    dir="ltr"
                    placeholder="0012345678"
                  />
                  {formErrors.nationalId && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.nationalId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-md font-medium text-gray-700 mb-2">:سن</label>
                  <input
                    type="number"
                    min={18}
                    value={newResponder.age}
                    onChange={(e) => handleFieldChange('age', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right ${
                      formErrors.age ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.age && <p className="text-xs text-red-500 mt-1">{formErrors.age}</p>}
                </div>

                {/* Expert Category Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">:تخصص</label>
                  <div className="relative">
                    <button
                      type="button"
                      onMouseEnter={handleExpertCategoryHover}
                      onMouseLeave={handleExpertCategoryLeave}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right flex items-center justify-between ${
                        formErrors.expertCategory ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <span className="text-gray-700">
                        {expertCategoryOptions.find(option => option.value === newResponder.expertCategory)?.label || 'انتخاب کنید'}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isExpertCategoryOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <div
                      onMouseEnter={handleExpertCategoryHover}
                      onMouseLeave={handleExpertCategoryLeave}
                      className={`absolute top-full right-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10 transition-all duration-200 origin-top ${
                        isExpertCategoryOpen
                          ? 'opacity-100 scale-100 pointer-events-auto'
                          : 'opacity-0 scale-95 pointer-events-none'
                      }`}
                    >
                      {expertCategoryOptions.map((option, index) => {
                        const isSelected = newResponder.expertCategory === option.value;
                        return (
                          <button
                            key={option.value || 'empty'}
                            type="button"
                            onClick={() => handleExpertCategorySelect(option.value)}
                            className={`w-full text-right px-4 py-2 text-sm transition-all duration-200 transform ${
                              isExpertCategoryOpen
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 -translate-y-1'
                            } ${isSelected ? 'bg-red-200 text-red-600 font-bold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
                            style={{ transitionDelay: `${index * 70}ms` }}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {formErrors.expertCategory && <p className="text-xs text-red-500 mt-1">{formErrors.expertCategory}</p>}
                </div>

                <div>
                  <label className="block text-md font-medium text-gray-700 mb-2">:وضعیت حضور</label>
                  <select
                    value={newResponder.status}
                    onChange={(e) => handleFieldChange('status', e.target.value as ResponderStatus)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right border-gray-300"
                  >
                    <option value="active">فعال</option>
                    <option value="on_duty">در حال خدمت</option>
                    <option value="inactive">غیرفعال</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-md font-medium text-gray-700 mb-2">:انتخاب سازمان</label>
                  <select
                    value={newResponder.baseId}
                    onChange={(e) => handleFieldChange('baseId', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right ${
                      formErrors.baseId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoadingBases}
                  >
                    <option value="">انتخاب کنید...</option>
                    {bases.map(base => (
                      <option key={base.id} value={base.id}>
                        {base.address || base.code}
                      </option>
                    ))}
                  </select>
                  {formErrors.baseId && <p className="text-xs text-red-500 mt-1">{formErrors.baseId}</p>}
                  {isLoadingBases && <p className="text-xs text-gray-500 mt-1">در حال بارگذاری سازمان‌ها...</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-md font-medium text-gray-700 mb-2">:رمز عبور</label>
                  <input
                    type="password"
                    value={newResponder.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-left ${
                      formErrors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    dir="ltr"
                    placeholder="حداقل ۸ کاراکتر"
                  />
                  {formErrors.password && <p className="text-xs text-red-500 mt-1 text-right">{formErrors.password}</p>}
                </div>

                {/* نمایش ID سازمان انتخاب شده */}
                {newResponder.baseId && (
                  <div className="md:col-span-2 bg-gray-300 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2 justify-end">
                      <span className="font-semibold text-gray-800">:شناسه سازمان انتخاب شده</span>
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="bg-white rounded px-3 py-2 text-left">
                      <code className="font-mono text-sm text-gray-800 break-all">{newResponder.baseId}</code>
                    </div>
                  </div>
                )}
              </div>

              {/* نمایش خطای ثبت فرم */}
              {formErrors.submit && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{formErrors.submit}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="font-bold px-4 py-2 rounded-lg bg-green-400 text-gray-700 hover:bg-green-700 transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'در حال ثبت...' : 'ثبت امدادگر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Responders List */}
      <div className="flex-1 overflow-y-auto p-6 text-right">
        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 text-lg">در حال دریافت اطلاعات امدادگران...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="text-center py-12">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md mx-auto">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 text-lg font-semibold mb-2">خطا در دریافت اطلاعات</p>
              <p className="text-gray-600 text-sm mb-4">{error}</p>
              <button
                onClick={fetchResponders}
                className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Shield className="w-5 h-5" />
                تلاش مجدد
              </button>
            </div>
          </div>
        ) : filteredResponders.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">هیچ امدادگری یافت نشد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 text-right mt-1 bg-red-100 p-3 sm:p-4 rounded-lg">
            {filteredResponders.map((responder) => (
              <div
                key={responder.id}
                className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 hover:shadow-lg transition-shadow border border-gray-100 text-right"
              >
                <div className="flex flex-row-reverse items-start justify-between mb-4 gap-4">
                  <div className="flex flex-row-reverse items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{responder.name}</h3>
                      <p className="text-sm text-gray-600">{getGenderLabel(responder.gender)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(responder.status)}
                    <button
                      onClick={() => showDeleteConfirmation(responder.id)}
                      disabled={deletingId === responder.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="حذف امدادگر"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingId === responder.id ? 'در حال حذف...' : 'حذف'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex flex-row-reverse items-center gap-6">
                    <div className="flex flex-row-reverse items-center gap-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      <span dir="ltr">{responder.phone}</span>
                    </div>
                    <div className="flex flex-row-reverse items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-600" />
                      <span>{responder.address}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex flex-row-reverse justify-between bg-gray-50 rounded-lg p-2">
                      <span className="font-semibold text-gray-800">کد سازمانی</span>
                      <span dir="ltr">{responder.organizationalCode}</span>
                    </div>
                    <div className="flex flex-row-reverse justify-between bg-gray-50 rounded-lg p-2">
                      <span className="font-semibold text-gray-800">کد ملی</span>
                      <span dir="ltr">{responder.nationalId}</span>
                    </div>
                    <div className="flex flex-row-reverse justify-between bg-gray-50 rounded-lg p-2">
                      <span className="font-semibold text-gray-800">سن</span>
                      <span>{responder.age.toLocaleString('fa-IR')} سال</span>
                    </div>
                    <div className="flex flex-row-reverse justify-between bg-gray-50 rounded-lg p-2">
                      <span className="font-semibold text-gray-800">تخصص</span>
                      <span>{responder.specialty}</span>
                    </div>
                    <div className="flex flex-row-reverse justify-between bg-red-100 rounded-lg p-2 sm:col-span-2">
                      <span className="font-semibold text-gray-800">تعداد مأموریت‌های پذیرفته‌شده</span>
                      <span>{responder.acceptedIncidentsCount.toLocaleString('fa-IR')} مأموریت</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-800 mb-2">:لیست مأموریت‌های انجام شده</p>
                    {responder.completedMissions.length === 0 ? (
                      <p className="text-sm text-gray-500">ماموریت ثبت نشده است</p>
                    ) : (
                      <ul className="space-y-1 text-sm text-gray-600">
                        {responder.completedMissions.map((mission, index) => (
                          <li
                            key={index}
                            className="bg-gray-100 rounded-md px-3 py-2 text-right"
                          >
                            {mission}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <User className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">حذف امدادگر</h3>
              <p className="text-gray-600 mb-6">
                آیا از حذف این امدادگر اطمینان دارید؟
              </p>
              <p className="text-sm text-gray-500 mb-6">
                این عملیات قابل بازگشت نیست و تمام اطلاعات مرتبط با این امدادگر حذف خواهد شد.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmDeleteResponder}
                  className="flex-1 px-4 py-2.5 bg-red-600 rounded-lg text-white font-medium hover:bg-red-700 transition-colors"
                >
                  حذف امدادگر
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-scale-in">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">عملیات موفق</h3>
              <p className="text-lg text-gray-700 font-medium mb-2">
                !امدادگر با موفقیت حذف شد
              </p>
              <p className="text-sm text-gray-500">
                .اطلاعات امدادگر از سیستم پاک شده است
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="mt-6 px-6 py-2.5 bg-green-600 rounded-lg text-white font-medium hover:bg-green-700 transition-colors"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Responder Success Modal */}
      {showAddSuccessModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-2xl max-w-sm w-full p-8 transform transition-all animate-scale-in border-2 border-green-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4 animate-bounce">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-900 mb-3">!عملیات موفق</h3>
              <p className="text-lg text-green-800 font-semibold mb-2">
                !امدادگر با موفقیت ثبت شد
              </p>
              <p className="text-sm text-green-700">
                .اطلاعات امدادگر در سیستم ذخیره شده است
              </p>
              <button
                onClick={() => setShowAddSuccessModal(false)}
                className="mt-6 px-8 py-3 bg-green-600 rounded-xl text-white font-bold hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RespondersInfoPage;

