import React, { useMemo, useState, useEffect } from 'react';
import { AlertTriangle, Calendar, MapPin, Users, CheckCircle, Clock, XCircle, Search, Trash2 } from 'lucide-react';
import { Alert, Responder } from '../data/mockData';

interface IncidentsPageProps {
  alerts: Alert[];
  responders: Responder[];
}

const IncidentsPage: React.FC<IncidentsPageProps> = ({ alerts, responders }) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiAlerts, setApiAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ show: boolean; accidentId: string | null }>({
    show: false,
    accidentId: null
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch accidents from API
  const fetchAccidents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.warn('No auth token found for fetching accidents');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/apis/rescue-link/v1/accidents', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch accidents: ${response.status}`);
      }

      const data = await response.json();
      console.log('Accidents API Response:', data);
      
      // Handle different possible response structures
      let accidentsData = [];
      if (data.success && Array.isArray(data.data)) {
        accidentsData = data.data;
      } else if (Array.isArray(data)) {
        accidentsData = data;
      }
      
      // Map API data to Alert structure
      const mappedAlerts: Alert[] = accidentsData.map((accident: any) => ({
        id: accident.id?.toString() || `${Date.now()}-${Math.random()}`,
        title: accident.title || 'بدون عنوان',
        description: accident.description || '',
        incidentType: accident.type || 'سایر',
        targetGender: accident.gender_of_involved || 'male',
        location: {
          lat: accident.latitude || 0,
          lng: accident.longitude || 0,
          address: `${accident.latitude}, ${accident.longitude}`
        },
        createdAt: accident.date ? new Date(accident.date) : new Date(),
        status: accident.status || 'pending',
        acceptedResponders: accident.accepted_responders || []
      }));
      
      setApiAlerts(mappedAlerts);
      setIsLoading(false);
      
    } catch (err) {
      console.error('Error fetching accidents:', err);
      setError(err instanceof Error ? err.message : 'خطا در دریافت حوادث');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccidents();
  }, []);

  // Show delete confirmation modal
  const showDeleteConfirmation = (accidentId: string) => {
    setDeleteConfirmModal({ show: true, accidentId });
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirmModal({ show: false, accidentId: null });
  };

  // Confirm and delete accident
  const confirmDeleteAccident = async () => {
    const accidentId = deleteConfirmModal.accidentId;
    if (!accidentId) return;

    try {
      setDeletingId(accidentId);
      setDeleteConfirmModal({ show: false, accidentId: null });
      
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        alert('توکن ورودی یافت نشد. لطفاً دوباره وارد شوید.');
        return;
      }

      console.log('Deleting accident with ID:', accidentId);

      const response = await fetch(`/apis/rescue-link/v1/accidents/${accidentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Delete accident API Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error deleting accident:', errorData);
        throw new Error(errorData.message || `خطا در حذف حادثه: ${response.status}`);
      }

      console.log('Accident deleted successfully');
      
      // Refresh the list
      await fetchAccidents();
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Auto close success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error deleting accident:', err);
      alert(err instanceof Error ? err.message : 'خطا در حذف حادثه. لطفاً دوباره تلاش کنید.');
    } finally {
      setDeletingId(null);
    }
  };

  // Use API data if available, otherwise fall back to props
  const displayAlerts = apiAlerts.length > 0 ? apiAlerts : alerts;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: Alert['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-yellow-400 text-yellow-800">
            <Clock className="w-3 h-3" />
            در انتظار
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-300 text-blue-800">
            <CheckCircle className="w-3 h-3" />
            پذیرفته شده
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-green-400 text-green-800">
            <CheckCircle className="w-3 h-3" />
            تکمیل شده
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            رد شده
          </span>
        );
      default:
        return null;
    }
  };

  const getAcceptedResponders = (alert: Alert): Responder[] => {
    if (!alert.acceptedResponders || alert.acceptedResponders.length === 0) {
      return [];
    }
    return responders.filter(r => alert.acceptedResponders?.includes(r.id));
  };

  const filteredAlerts = useMemo(() => {
    if (!searchQuery.trim()) {
      return displayAlerts;
    }
    const query = searchQuery.toLowerCase();

    return displayAlerts.filter((alert) => {
      const titleMatch = alert.title.toLowerCase().includes(query);
      const descriptionMatch = alert.description?.toLowerCase().includes(query);
      const incidentTypeMatch = alert.incidentType?.toLowerCase().includes(query);
      const locationMatch = alert.location.address?.toLowerCase().includes(query);

      return titleMatch || descriptionMatch || incidentTypeMatch || locationMatch;
    });
  }, [displayAlerts, searchQuery]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery(searchValue.trim());
  };

  const handleClearSearch = () => {
    setSearchValue('');
    setSearchQuery('');
  };

  return (
    <div className="h-full flex flex-col bg-gray-500 text-right">
      <div className="bg-gray-300 shadow-sm border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 text-right">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex justify-end">
          <span className="relative inline-flex items-center justify-center pr-10 sm:pr-12">
            <AlertTriangle
              className="absolute right-0 w-8 h-8 sm:w-10 sm:h-10 text-red-600 animate-bounce pointer-events-none"
              aria-hidden="true"
            />
            <span className="relative z-10">حوادث</span>
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-2 text-right">لیست تمام حوادث ثبت شده در سیستم</p>

        <form
          onSubmit={handleSearchSubmit}
          className="mt-2 sm:mt-3 flex flex-col sm:flex-row-reverse sm:items-center gap-2 sm:gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="جستجو بر اساس عنوان، نوع حادثه یا آدرس..."
              className="w-full pr-9 sm:pr-10 pl-3 sm:pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-right text-sm sm:text-base"
              dir="rtl"
            />
          </div>
          <div className="flex items-center gap-2 justify-stretch sm:justify-end">
            <button
              type="submit"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-md font-medium hover:bg-gray-800 transition-colors shadow text-sm sm:text-base"
            >
              <Search className="w-4 h-4" />
              جستجو
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors text-sm sm:text-base"
              >
                پاک‌سازی
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-right">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">در حال بارگذاری حوادث...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-lg font-semibold mb-2">خطا در دریافت اطلاعات</p>
            <p className="text-gray-600">{error}</p>
          </div>
        ) : displayAlerts.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-white mx-auto mb-4" />
            <p className="text-white text-lg">هیچ حادثه‌ای ثبت نشده است</p>
          </div>
        ) : (
          <>
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">حادثه‌ای مطابق جستجو یافت نشد</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredAlerts.map((alert) => {
                  const acceptedRespondersList = getAcceptedResponders(alert);
                  
                  return (
                    <div
                      key={alert.id}
                      className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 hover:shadow-lg transition-shadow border border-gray-100 text-right"
                    >
                      <div className="flex flex-col sm:flex-row-reverse items-start justify-between mb-3 sm:mb-4 gap-3 sm:gap-4">
                        <div className="flex-1 w-full sm:w-auto">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">{alert.title}</h3>
                          <p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-3">{alert.description}</p>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-start">
                          {getStatusBadge(alert.status)}
                          <button
                            onClick={() => showDeleteConfirmation(alert.id)}
                            disabled={deletingId === alert.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="حذف حادثه"
                          >
                            <Trash2 className="w-4 h-4" />
                            {deletingId === alert.id ? 'در حال حذف...' : 'حذف'}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 text-right">
                        <div className="flex items-center gap-2 text-sm text-gray-700 justify-end">
                          <span>{alert.incidentType}</span>
                          <span className="font-medium">:نوع حادثه</span>
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-700 justify-end">
                          <span>{formatDate(alert.createdAt)}</span>
                          <span className="font-medium">:تاریخ ثبت</span>
                          <Calendar className="w-4 h-4 text-blue-500" />
                        </div>

                        {alert.completedAt && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 justify-end">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>{formatDate(alert.completedAt)}</span>
                            <span className="font-medium">:تاریخ اتمام</span>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-700 justify-end">
                          <span>{alert.location.address}</span>
                          <span className="font-medium">:موقعیت</span>
                          <MapPin className="w-4 h-4 text-purple-500" />
                        </div>
                      </div>

                      {acceptedRespondersList.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center gap-2 mb-2 justify-end">
                            <span className="font-medium text-sm text-gray-700">
                              :امدادگران پذیرنده ({acceptedRespondersList.length} نفر)
                            </span>
                            <Users className="w-4 h-4 text-indigo-500" />
                          </div>
                          <div className="flex flex-wrap gap-2 justify-end">
                            {acceptedRespondersList.map((responder) => (
                              <span
                                key={responder.id}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                              >
                                {responder.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">حذف حادثه</h3>
              <p className="text-gray-600 mb-6">
                آیا از حذف این حادثه اطمینان دارید؟
              </p>
              <p className="text-sm text-gray-500 mb-6">
                این عملیات قابل بازگشت نیست و تمام اطلاعات مرتبط با این حادثه حذف خواهد شد.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmDeleteAccident}
                  className="flex-1 px-4 py-2.5 bg-red-600 rounded-lg text-white font-medium hover:bg-red-700 transition-colors"
                >
                  حذف حادثه
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
                !حادثه با موفقیت حذف شد
              </p>
              <p className="text-sm text-gray-500">
                .اطلاعات حادثه از سیستم پاک شده است
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
    </div>
  );
};

export default IncidentsPage;

