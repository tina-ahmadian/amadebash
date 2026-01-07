import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin, AlertCircle, ChevronDown, CheckCircle2 } from 'lucide-react';
import Map from './Map';
import { useMapContext } from '../context/MapContext';
import { Alert, Gender, Base } from '../data/mockData';

const incidentTypeOptions = [
  { value: '', label: 'انتخاب کنید' },
  { value: 'سیل', label: 'سیل' },
  { value: 'برف و کولاک', label: 'برف و کولاک' },
  { value: 'زلزله', label: 'زلزله' },
  { value: 'حمله ی نظامی', label: 'حمله ی نظامی' },
  { value: 'مانور', label: 'مانور' },
  { value: 'سایر', label: 'سایر' },
];

const targetGenderOptions: Array<{ value: Gender | 'all'; label: string }> = [
  { value: 'all', label: 'همه' },
  { value: 'male', label: 'مرد' },
  { value: 'female', label: 'زن' },
];

// Demo alerts - فقط برای نمایش روی نقشه (در لیست حوادث نمایش داده نمیشن)
const demoAlertsForMap: Alert[] = [
  // حوادث در شمال اصفهان
  {
    id: 'demo-1',
    title: 'سیل روستای قهدریجان',
    description: 'سیلاب ناگهانی در روستای قهدریجان',
    incidentType: 'سیل',
    targetGender: 'all',
    location: {
      lat: 32.5720,
      lng: 51.4890,
      address: 'قهدریجان، شمال غرب اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    status: 'pending'
  },
  {
    id: 'demo-2',
    title: 'برف و کولاک فریدن',
    description: 'بارش شدید برف در منطقه فریدن',
    incidentType: 'برف و کولاک',
    targetGender: 'all',
    location: {
      lat: 32.9145,
      lng: 50.1120,
      address: 'فریدن، شمال اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: 'pending'
  },
  {
    id: 'demo-3',
    title: 'زلزله خفیف سمیرم',
    description: 'زلزله خفیف در منطقه سمیرم',
    incidentType: 'زلزله',
    targetGender: 'all',
    location: {
      lat: 31.4167,
      lng: 51.5667,
      address: 'سمیرم، جنوب غرب اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    status: 'pending'
  },
  {
    id: 'demo-4',
    title: 'سیل شهرضا',
    description: 'سیل در منطقه شهرضا',
    incidentType: 'سیل',
    targetGender: 'all',
    location: {
      lat: 31.9960,
      lng: 51.8594,
      address: 'شهرضا، جنوب اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 45),
    status: 'pending'
  },
  {
    id: 'demo-5',
    title: 'مانور امدادی نجف‌آباد',
    description: 'مانور آموزشی در نجف‌آباد',
    incidentType: 'مانور',
    targetGender: 'all',
    location: {
      lat: 32.6342,
      lng: 51.3661,
      address: 'نجف‌آباد، غرب اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    status: 'pending'
  },
  // حوادث در شرق اصفهان
  {
    id: 'demo-6',
    title: 'برف و کولاک نائین',
    description: 'بارش شدید برف در شهرستان نائین',
    incidentType: 'برف و کولاک',
    targetGender: 'all',
    location: {
      lat: 32.8583,
      lng: 53.0833,
      address: 'نائین، شرق اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 90),
    status: 'pending'
  },
  {
    id: 'demo-7',
    title: 'سیل خوراسگان',
    description: 'سیلاب در منطقه خوراسگان',
    incidentType: 'سیل',
    targetGender: 'all',
    location: {
      lat: 32.6890,
      lng: 51.5320,
      address: 'خوراسگان، شمال شرق اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 120),
    status: 'pending'
  },
  {
    id: 'demo-8',
    title: 'زلزله کاشان',
    description: 'زلزله خفیف در منطقه کاشان',
    incidentType: 'زلزله',
    targetGender: 'all',
    location: {
      lat: 33.9831,
      lng: 51.4364,
      address: 'کاشان، شمال اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 150),
    status: 'pending'
  },
  // حوادث در جنوب اصفهان
  {
    id: 'demo-9',
    title: 'سیل دولت‌آباد',
    description: 'سیلاب در منطقه دولت‌آباد',
    incidentType: 'سیل',
    targetGender: 'all',
    location: {
      lat: 32.7971,
      lng: 51.6804,
      address: 'دولت‌آباد، شمال اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
    status: 'pending'
  },
  {
    id: 'demo-10',
    title: 'برف و کولاک فلاورجان',
    description: 'بارش شدید برف در فلاورجان',
    incidentType: 'برف و کولاک',
    targetGender: 'all',
    location: {
      lat: 32.5492,
      lng: 51.5131,
      address: 'فلاورجان، غرب اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 40),
    status: 'pending'
  },
  // حوادث در روستاهای اطراف
  {
    id: 'demo-11',
    title: 'زلزله روستای ورزنه',
    description: 'زلزله خفیف در روستای ورزنه',
    incidentType: 'زلزله',
    targetGender: 'all',
    location: {
      lat: 32.4589,
      lng: 52.6483,
      address: 'ورزنه، شرق اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 180),
    status: 'pending'
  },
  {
    id: 'demo-12',
    title: 'سیل روستای چمگردان',
    description: 'سیلاب در روستای چمگردان',
    incidentType: 'سیل',
    targetGender: 'all',
    location: {
      lat: 32.4823,
      lng: 51.5234,
      address: 'چمگردان، جنوب غرب اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 100),
    status: 'pending'
  },
  {
    id: 'demo-13',
    title: 'مانور امدادی شاهین‌شهر',
    description: 'مانور آموزشی در شاهین‌شهر',
    incidentType: 'مانور',
    targetGender: 'all',
    location: {
      lat: 32.8583,
      lng: 51.5511,
      address: 'شاهین‌شهر، شمال اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 50),
    status: 'pending'
  },
  {
    id: 'demo-14',
    title: 'برف و کولاک اردستان',
    description: 'بارش شدید برف در اردستان',
    incidentType: 'برف و کولاک',
    targetGender: 'all',
    location: {
      lat: 33.3761,
      lng: 52.3697,
      address: 'اردستان، شمال شرق اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 200),
    status: 'pending'
  },
  {
    id: 'demo-15',
    title: 'سیل مبارکه',
    description: 'سیلاب در شهرستان مبارکه',
    incidentType: 'سیل',
    targetGender: 'all',
    location: {
      lat: 32.3518,
      lng: 51.5054,
      address: 'مبارکه، جنوب اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 80),
    status: 'pending'
  },
  {
    id: 'demo-16',
    title: 'حمله ی نظامی روستای گز',
    description: 'حمله نظامی در روستای گز',
    incidentType: 'حمله ی نظامی',
    targetGender: 'all',
    location: {
      lat: 32.7234,
      lng: 51.4523,
      address: 'روستای گز، شمال غرب اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 25),
    status: 'pending'
  },
  {
    id: 'demo-17',
    title: 'زلزله فریدون‌شهر',
    description: 'زلزله خفیف در فریدون‌شهر',
    incidentType: 'زلزله',
    targetGender: 'all',
    location: {
      lat: 32.9407,
      lng: 50.1117,
      address: 'فریدون‌شهر، غرب اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 220),
    status: 'pending'
  },
  {
    id: 'demo-18',
    title: 'سیل دهاقان',
    description: 'سیلاب در شهرستان دهاقان',
    incidentType: 'سیل',
    targetGender: 'all',
    location: {
      lat: 31.9390,
      lng: 51.6464,
      address: 'دهاقان، جنوب اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 110),
    status: 'pending'
  },
  {
    id: 'demo-19',
    title: 'برف و کولاک آران و بیدگل',
    description: 'بارش شدید برف در آران و بیدگل',
    incidentType: 'برف و کولاک',
    targetGender: 'all',
    location: {
      lat: 34.0583,
      lng: 50.9842,
      address: 'آران و بیدگل، شمال اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 160),
    status: 'pending'
  },
  {
    id: 'demo-20',
    title: 'مانور امدادی گلپایگان',
    description: 'مانور آموزشی در گلپایگان',
    incidentType: 'مانور',
    targetGender: 'all',
    location: {
      lat: 33.4472,
      lng: 50.2886,
      address: 'گلپایگان، شمال غرب اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 70),
    status: 'pending'
  },
  {
    id: 'demo-21',
    title: 'سیل خمینی‌شهر',
    description: 'سیلاب شدید در خمینی‌شهر',
    incidentType: 'سیل',
    targetGender: 'all',
    location: {
      lat: 32.6851,
      lng: 51.5301,
      address: 'خمینی‌شهر، شمال غرب اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 35),
    status: 'pending'
  },
  {
    id: 'demo-22',
    title: 'زلزله لنجان',
    description: 'زلزله خفیف در شهرستان لنجان',
    incidentType: 'زلزله',
    targetGender: 'all',
    location: {
      lat: 32.4759,
      lng: 51.5093,
      address: 'لنجان، جنوب غرب اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 130),
    status: 'pending'
  },
  {
    id: 'demo-23',
    title: 'برف و کولاک بوئین و میاندشت',
    description: 'بارش شدید برف در بوئین و میاندشت',
    incidentType: 'برف و کولاک',
    targetGender: 'all',
    location: {
      lat: 33.3500,
      lng: 51.0833,
      address: 'بوئین و میاندشت، شمال غرب اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 95),
    status: 'pending'
  },
  {
    id: 'demo-24',
    title: 'حمله ی نظامی روستای ونک',
    description: 'حمله نظامی در روستای ونک',
    incidentType: 'حمله ی نظامی',
    targetGender: 'all',
    location: {
      lat: 32.5500,
      lng: 51.7500,
      address: 'روستای ونک، شرق اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
    status: 'pending'
  },
  {
    id: 'demo-25',
    title: 'سیل تیران و کرون',
    description: 'سیلاب در شهرستان تیران و کرون',
    incidentType: 'سیل',
    targetGender: 'all',
    location: {
      lat: 32.7061,
      lng: 51.1556,
      address: 'تیران و کرون، غرب اصفهان'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 55),
    status: 'pending'
  }
];

interface AlertFormProps {
  onClose: () => void;
}

const AlertForm: React.FC<AlertFormProps> = ({ onClose }) => {
  const { addAlert, selectedLocation, setSelectedLocation, alerts } = useMapContext();
  const [bases, setBases] = useState<Base[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    incidentType: '',
    targetGender: 'all' as Gender | 'all',
    latitude: '',
    longitude: '',
    date: new Date().toLocaleDateString('fa-IR'),
    minResponders: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedBase, setSelectedBase] = useState<{ name: string; address: string } | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isIncidentTypeOpen, setIsIncidentTypeOpen] = useState(false);
  const [isTargetGenderOpen, setIsTargetGenderOpen] = useState(false);
  const incidentTypeHoverTimeout = useRef<number | null>(null);
  const incidentTypeCloseTimeout = useRef<number | null>(null);
  const targetGenderHoverTimeout = useRef<number | null>(null);
  const targetGenderCloseTimeout = useRef<number | null>(null);

  const isSubmitDisabled = formData.title.trim().length === 0;

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      incidentType: '',
      targetGender: 'all',
      latitude: '',
      longitude: '',
      date: new Date().toLocaleDateString('fa-IR'),
      minResponders: ''
    });
    setSearchQuery('');
    setSelectedBase(null);
    setSearchError(null);
  };

  const handleCoordinatesUpdate = (lat: number, lng: number) => {
    setFormData(prev => ({ 
      ...prev, 
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));
  };

  const createHoverHandlers = (
    openSetter: (value: boolean) => void,
    hoverTimeoutRef: React.MutableRefObject<number | null>,
    closeTimeoutRef: React.MutableRefObject<number | null>,
    openDelay = 200,
    closeDelay = 150
  ) => {
    const handleHover = () => {
      if (hoverTimeoutRef.current !== null) return;
      clearTimeoutRef(closeTimeoutRef);
      hoverTimeoutRef.current = window.setTimeout(() => {
        openSetter(true);
        hoverTimeoutRef.current = null;
      }, openDelay);
    };

    const handleLeave = () => {
      clearTimeoutRef(hoverTimeoutRef);
      clearTimeoutRef(closeTimeoutRef);
      closeTimeoutRef.current = window.setTimeout(() => {
        openSetter(false);
        closeTimeoutRef.current = null;
      }, closeDelay);
    };

    const handleSelect = (callback: () => void) => {
      clearTimeoutRef(closeTimeoutRef);
      callback();
      openSetter(false);
    };

    const handleFocus = handleHover;
    const handleBlur = handleLeave;

    return { handleHover, handleLeave, handleSelect, handleFocus, handleBlur };
  };

  const clearTimeoutRef = (ref: React.MutableRefObject<number | null>) => {
    if (ref.current !== null) {
      window.clearTimeout(ref.current);
      ref.current = null;
    }
  };

  const incidentTypeHandlers = createHoverHandlers(
    setIsIncidentTypeOpen,
    incidentTypeHoverTimeout,
    incidentTypeCloseTimeout
  );

  const targetGenderHandlers = createHoverHandlers(
    setIsTargetGenderOpen,
    targetGenderHoverTimeout,
    targetGenderCloseTimeout
  );

  const handleIncidentTypeHover = incidentTypeHandlers.handleHover;
  const handleIncidentTypeLeave = incidentTypeHandlers.handleLeave;
  const handleIncidentTypeFocus = incidentTypeHandlers.handleFocus;
  const handleIncidentTypeBlur = incidentTypeHandlers.handleBlur;
  const handleIncidentTypeSelect = (value: string) => {
    incidentTypeHandlers.handleSelect(() => {
      setFormData(prev => ({ ...prev, incidentType: value }));
    });
  };

  const handleTargetGenderHover = targetGenderHandlers.handleHover;
  const handleTargetGenderLeave = targetGenderHandlers.handleLeave;
  const handleTargetGenderFocus = targetGenderHandlers.handleFocus;
  const handleTargetGenderBlur = targetGenderHandlers.handleBlur;
  const handleTargetGenderSelect = (value: Gender | 'all') => {
    targetGenderHandlers.handleSelect(() => {
      setFormData(prev => ({ ...prev, targetGender: value }));
    });
  };

  const toggleIncidentTypeDropdown = () => {
    clearTimeoutRef(incidentTypeHoverTimeout);
    clearTimeoutRef(incidentTypeCloseTimeout);
    setIsIncidentTypeOpen(prev => !prev);
  };

  const toggleTargetGenderDropdown = () => {
    clearTimeoutRef(targetGenderHoverTimeout);
    clearTimeoutRef(targetGenderCloseTimeout);
    setIsTargetGenderOpen(prev => !prev);
  };


  // Fetch bases from API
  useEffect(() => {
    const fetchBases = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          console.warn('No auth token found for fetching bases in AlertForm');
          return;
        }

        const response = await fetch('/apis/rescue-link/v1/bases', {
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
        console.log('AlertForm - Bases API Response:', data);
        
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
        console.error('Error fetching bases in AlertForm:', err);
      }
    };

    fetchBases();
  }, []);

  useEffect(() => {
    return () => {
      if (incidentTypeHoverTimeout.current !== null) {
        window.clearTimeout(incidentTypeHoverTimeout.current);
      }
      if (incidentTypeCloseTimeout.current !== null) {
        window.clearTimeout(incidentTypeCloseTimeout.current);
      }
      if (targetGenderHoverTimeout.current !== null) {
        window.clearTimeout(targetGenderHoverTimeout.current);
      }
      if (targetGenderCloseTimeout.current !== null) {
        window.clearTimeout(targetGenderCloseTimeout.current);
      }
    };
  }, []);

  const handleExistingAlertSelect = (alert: Alert) => {
    setFormData(prev => ({
      ...prev,
      title: alert.title,
      incidentType: alert.incidentType,
      description: alert.description
    }));
    setSelectedBase(null);
    setSelectedLocation({
      lat: alert.location.lat,
      lng: alert.location.lng
    });
  };

  const handleBaseSelection = (base: { name: string; address: string; lat: number; lng: number }) => {
    setSelectedBase({ name: base.name, address: base.address });
    handleCoordinatesUpdate(base.lat, base.lng);
    setSelectedLocation({
      lat: base.lat,
      lng: base.lng
    });
  };

  useEffect(() => {
    if (selectedLocation || alerts.length === 0) {
      return;
    }

    const latestAlert = alerts.reduce((latest, current) => {
      const latestTime = latest.createdAt instanceof Date ? latest.createdAt.getTime() : new Date(latest.createdAt).getTime();
      const currentTime = current.createdAt instanceof Date ? current.createdAt.getTime() : new Date(current.createdAt).getTime();
      return currentTime > latestTime ? current : latest;
    }, alerts[0]);

    if (latestAlert?.location) {
      setSelectedLocation({
        lat: latestAlert.location.lat,
        lng: latestAlert.location.lng
      });
    }
  }, [alerts, selectedLocation, setSelectedLocation]);

  useEffect(() => {
    if (!selectedLocation) {
      setFormData(prev => ({ ...prev, latitude: '', longitude: '' }));
      setSelectedBase(null);
    }
  }, [selectedLocation]);

  const handleLocationSelect = (location: { lat: number; lng: number }) => {
    setSelectedBase(null);
    setSelectedLocation(location);
  };

  const handleAddressSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchError('لطفاً نام خیابان یا آدرس را وارد کنید.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=fa&q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'amadebash-app/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('search_failed');
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const { lat, lon } = data[0];
        const location = {
          lat: parseFloat(lat),
          lng: parseFloat(lon)
        };
        setSelectedLocation(location);
        handleCoordinatesUpdate(location.lat, location.lng);
        setSelectedBase(null);
      } else {
        setSearchError('نتیجه‌ای یافت نشد. لطفاً عبارت دیگری را امتحان کنید.');
      }
    } catch (error) {
      setSearchError('در جستجو مشکلی پیش آمد. دوباره تلاش کنید.');
    } finally {
      setIsSearching(false);
    }
  };

  // Map Persian incident types to API types
  const mapIncidentTypeToAPI = (persianType: string): string => {
    const mapping: Record<string, string> = {
      'سیل': 'water_emergency',
      'برف و کولاک': 'natural_disaster',
      'زلزله': 'natural_disaster',
      'حمله ی نظامی': 'medical_emergency',
      'مانور': 'medical_emergency',
      'سایر': 'medical_emergency'
    };
    return mapping[persianType] || 'medical_emergency';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLocation) {
      alert('لطفاً موقعیت حادثه را روی نقشه انتخاب کنید');
      return;
    }

    if (!formData.incidentType) {
      alert('لطفاً نوع حادثه را انتخاب کنید');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        alert('توکن ورودی یافت نشد. لطفاً دوباره وارد شوید.');
        return;
      }

      // Prepare API payload
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || 'بدون توضیحات',
        type: mapIncidentTypeToAPI(formData.incidentType),
        date: new Date().toISOString(),
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        gender_of_involved: formData.targetGender === 'all' ? 'male' : formData.targetGender,
        minimum_required_rescuers: formData.minResponders ? Number(formData.minResponders) : 1
      };

      console.log('Creating new accident with payload:', payload);
      console.log('Payload JSON:', JSON.stringify(payload, null, 2));

      // Call API
      const response = await fetch('/apis/rescue-link/v1/accidents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('Create accident API Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error creating accident:', errorData);
        
        // Show detailed error if available
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail.map((err: any) => 
            `${err.loc ? err.loc.join(' > ') : 'Unknown'}: ${err.msg}`
          ).join('\n');
          console.error('Validation errors:', errorMessages);
          throw new Error(`خطای اعتبارسنجی:\n${errorMessages}`);
        }
        
        throw new Error(errorData.message || `خطا در ثبت حادثه: ${response.status}`);
      }

      const data = await response.json();
      console.log('Create accident success:', data);

      // Also add to local state for immediate UI update
      const newAlert: Alert = {
        id: data.id || Date.now().toString(),
        title: formData.title,
        description: formData.description,
        incidentType: formData.incidentType,
        targetGender: formData.targetGender,
        location: {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          address: `${formData.latitude}, ${formData.longitude}`
        },
        createdAt: new Date(),
        status: 'pending'
      };

      addAlert(newAlert);
      setSelectedLocation(null);
      resetForm();
      setShowSuccessMessage(true);
      
    } catch (err) {
      console.error('Error submitting accident:', err);
      alert(err instanceof Error ? err.message : 'خطا در ثبت حادثه. لطفاً دوباره تلاش کنید.');
    }
  };

  if (showSuccessMessage) {
    return (
      <div className="fixed inset-0 bg-gray-700 bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-green-100 text-green-600 rounded-full p-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          </div>
          <div className="space-y-2" dir="rtl">
            <h3 className="text-xl font-bold text-gray-800">اعلان حادثه به همه‌ی امدادگران با موفقیت ارسال شد.</h3>
          </div>
          <button
            onClick={() => {
              setShowSuccessMessage(false);
              onClose();
            }}
            className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            بازگشت به نقشه
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-700 bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4">
      <div className="bg-red-50 rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-red-600 text-white px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between z-20">
          <div className="relative group">
            <button
              onClick={onClose}
              className="hover:bg-red-700 p-1.5 sm:p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden sm:block">
              بستن صفحه
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 animate-bounce">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
              ! حادثه جدید
            </h2>
            <span className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-white flex-shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-red-600" />
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            <div className="space-y-2 order-1 lg:order-1" dir="rtl">
              <label className="block text-sm sm:text-base font-semibold text-gray-700">
                انتخاب پایگاه هلال احمر روی نقشه 
              </label>
              <p className="text-xs text-gray-500 mb-1 sm:mb-2">
              روی نقشه پایگاه مورد نظر را انتخاب کنید.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mb-2" dir="rtl">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddressSearch();
                    }
                  }}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-sm sm:text-base"
                  placeholder="جستجوی خیابان یا آدرس..."
                  disabled={isSearching}
                />
                <button
                  type="button"
                  onClick={handleAddressSearch}
                  disabled={isSearching}
                  className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isSearching ? 'در حال جستجو...' : 'جستجو'}
                </button>
              </div>
              <div className="min-h-[20px] text-xs text-red-500">
                {searchError && <span>{searchError}</span>}
              </div>
              <div className="h-[300px] sm:h-[400px] md:h-[500px] lg:h-[620px] xl:h-[820px] border-2 border-gray-600 rounded-lg overflow-hidden">
                <Map
                  responders={[]}
                  alerts={demoAlertsForMap}
                  bases={bases}
                  selectedLocation={selectedLocation}
                  onLocationSelect={handleLocationSelect}
                  onAlertSelect={handleExistingAlertSelect}
                  onBaseSelect={handleBaseSelection}
                  center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [32.6546, 51.6680]}
                />
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 order-2 lg:order-2" dir="rtl">
              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  عنوان حادثه:
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-sm sm:text-base"
                  placeholder="مثال: زلزله"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  نوع حادثه:
                </label>
                <div
                  className="relative w-full sm:w-56 md:w-48"
                  onMouseEnter={handleIncidentTypeHover}
                  onMouseLeave={handleIncidentTypeLeave}
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white text-right text-sm sm:text-base"
                    onFocus={handleIncidentTypeFocus}
                    onBlur={handleIncidentTypeBlur}
                    onClick={toggleIncidentTypeDropdown}
                  >
                    <span className="flex-1 text-right">
                      {incidentTypeOptions.find(option => option.value === formData.incidentType)?.label || 'انتخاب کنید'}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 transition-transform duration-200 ${isIncidentTypeOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    className={`absolute top-full right-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10 transition-all duration-200 origin-top ${
                      isIncidentTypeOpen
                        ? 'opacity-100 scale-100 pointer-events-auto'
                        : 'opacity-0 scale-95 pointer-events-none'
                    }`}
                  >
                    {incidentTypeOptions.map((option, index) => {
                      const isSelected = formData.incidentType === option.value;
                      return (
                        <button
                          key={option.value || 'empty'}
                          type="button"
                          onClick={() => handleIncidentTypeSelect(option.value)}
                          className={`w-full text-right px-4 py-2 text-sm transition-all duration-200 transform ${
                            isIncidentTypeOpen
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
              </div>

              <div>
                <label className="block text-md font-semibold text-gray-700 mb-2">
                  امدادگران هدف:
                </label>
                <div
                  className="relative w-full md:w-48"
                  onMouseEnter={handleTargetGenderHover}
                  onMouseLeave={handleTargetGenderLeave}
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white text-right"
                    onFocus={handleTargetGenderFocus}
                    onBlur={handleTargetGenderBlur}
                    onClick={toggleTargetGenderDropdown}
                  >
                    <span className="flex-1 text-right">
                      {targetGenderOptions.find(option => option.value === formData.targetGender)?.label || 'انتخاب کنید'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isTargetGenderOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    className={`absolute top-full right-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10 transition-all duration-200 origin-top ${
                      isTargetGenderOpen
                        ? 'opacity-100 scale-100 pointer-events-auto'
                        : 'opacity-0 scale-95 pointer-events-none'
                    }`}
                  >
                    {targetGenderOptions.map((option, index) => {
                      const isSelected = formData.targetGender === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleTargetGenderSelect(option.value)}
                          className={`w-full text-right px-4 py-2 text-sm transition-all duration-200 transform ${
                            isTargetGenderOpen
                              ? 'opacity-100 translate-y-0'
                              : 'opacity-0 -translate-y-1'
                          } ${isSelected ? 'bg-blue-200 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
                          style={{ transitionDelay: `${index * 70}ms` }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  مختصات جغرافیایی پایگاه:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                      عرض جغرافیایی (Latitude)
                    </label>
                    <input
                      type="text"
                      value={formData.latitude}
                      readOnly
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-mono text-sm"
                      placeholder="32.654600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                      طول جغرافیایی (Longitude)
                    </label>
                    <input
                      type="text"
                      value={formData.longitude}
                      readOnly
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-mono text-sm"
                      placeholder="51.668000"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  روی پایگاه در نقشه کلیک کنید تا مختصات آن نمایش داده شود
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    تاریخ امروز:
                  </label>
                  <input
                    type="text"
                    value={formData.date}
                    readOnly
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    حداقل تعداد امدادگر:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minResponders}
                    onChange={(e) => setFormData({ ...formData, minResponders: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-sm sm:text-base"
                    placeholder="مثال: 5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-1">
                  توضیحات:
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent resize-none text-sm sm:text-base"
                  placeholder="جزئیات حادثه را بنویسید..."
                />
              </div>

              {selectedLocation && (
                <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                  <div className="flex flex-col gap-2 text-green-800">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      <p className="text-sm font-semibold">موقعیت انتخاب شد</p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-2 text-xs text-right" dir="rtl">
                      {selectedBase ? (
                        <>
                          <p className="font-semibold text-green-700">{selectedBase.name}</p>
                          <p className="text-gray-700 mt-1">{selectedBase.address}</p>
                        </>
                      ) : formData.latitude && formData.longitude ? (
                        <>
                          <p className="font-semibold text-green-700">مختصات پایگاه انتخابی:</p>
                          <div className="mt-1 space-y-1">
                            <p className="text-gray-700">
                              <span className="font-medium">عرض: </span>
                              <span className="font-mono">{formData.latitude}</span>
                            </p>
                            <p className="text-gray-700">
                              <span className="font-medium">طول: </span>
                              <span className="font-mono">{formData.longitude}</span>
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-700">پایگاهی انتخاب نشده است.</p>
                          <p className="text-gray-500 mt-1">لطفاً روی نقشه پایگاه یا حادثه‌ای را انتخاب کنید.</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6 justify-end">
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm sm:text-base order-2 sm:order-1"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base order-1 sm:order-2"
            >
              <span>ثبت حادثه</span>
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </form>
      </div>
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 text-center">
            <div className="space-y-3" dir="rtl">
              <h3 className="text-2xl font-bold text-gray-800">آیا مطمئن هستید؟</h3>
              <p className="text-gray-600 leading-relaxed">
                با ترک این صفحه، اطلاعات وارد شده ذخیره نمی‌شوند.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
            <button
                onClick={() => {
                  resetForm();
                  setSelectedLocation(null);
                  setShowCancelConfirm(false);
                  onClose();
                }}
                className="flex-1 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
              >
                بله، صفحه را ترک کن
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                بازگشت به فرم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertForm;
