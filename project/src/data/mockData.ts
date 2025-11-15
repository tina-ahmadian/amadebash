export type Gender = 'male' | 'female';

export type ResponderStatus = 'active' | 'inactive' | 'on_duty';

export interface Responder {
  id: string;
  name: string;
  gender: Gender;
  status: ResponderStatus;
  organizationalCode: string;
  nationalId: string;
  address: string;
  age: number;
  specialty: string;
  acceptedIncidentsCount: number;
  completedMissions: string[];
  position: {
    lat: number;
    lng: number;
  };
  phone: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  incidentType: string;
  targetGender: Gender | 'all';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  createdAt: Date;
  completedAt?: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  acceptedResponders?: string[]; // Array of responder IDs
}

export interface Base {
  id: string;
  code: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  activeResponders: number;
  inactiveResponders: number;
}

export const mockResponders: Responder[] = [
  {
    id: '1',
    name: 'زهرا احمدی',
    gender: 'female',
    status: 'active',
    organizationalCode: 'R-1001',
    nationalId: '0012345678',
    address: 'اصفهان، خیابان بزرگمهر، کوچه 12',
    age: 32,
    specialty: 'پزشکی اضطراری',
    acceptedIncidentsCount: 24,
    completedMissions: ['حادثه رانندگی بزرگراه چمران', 'حادثه آتش‌سوزی خیابان حافظ', 'سیل محله تخت فولاد'],
    position: { lat: 32.6546, lng: 51.6680 },
    phone: '09131234567'
  },
  {
    id: '2',
    name: 'علی رضایی',
    gender: 'male',
    status: 'on_duty',
    organizationalCode: 'R-1002',
    nationalId: '0018765432',
    address: 'اصفهان، خیابان آمادگاه، پلاک 45',
    age: 35,
    specialty: 'امداد کوهستان',
    acceptedIncidentsCount: 18,
    completedMissions: ['زلزله منطقه مرکزی', 'سیل رودخانه زاینده‌رود'],
    position: { lat: 32.6580, lng: 51.6750 },
    phone: '09137654321'
  },
  {
    id: '3',
    name: 'فاطمه کریمی',
    gender: 'female',
    status: 'active',
    organizationalCode: 'R-1003',
    nationalId: '0019988776',
    address: 'اصفهان، خیابان چهارباغ پایین، کوچه گلزار',
    age: 28,
    specialty: 'پرستاری میدان',
    acceptedIncidentsCount: 30,
    completedMissions: ['حادثه سقوط از ارتفاع', 'سیل محله جلفا', 'حادثه کارخانه فولاد'],
    position: { lat: 32.6500, lng: 51.6600 },
    phone: '09139876543'
  },
  {
    id: '4',
    name: 'محمد حسینی',
    gender: 'male',
    status: 'inactive',
    organizationalCode: 'R-1004',
    nationalId: '0014455667',
    address: 'اصفهان، خیابان امام خمینی، کوچه بهار',
    age: 41,
    specialty: 'لجستیک و پشتیبانی',
    acceptedIncidentsCount: 12,
    completedMissions: ['حادثه انفجار کارگاه', 'حادثه رانندگی محور اصفهان-تهران'],
    position: { lat: 32.6620, lng: 51.6820 },
    phone: '09131112233'
  },
  {
    id: '5',
    name: 'مریم نوری',
    gender: 'female',
    status: 'on_duty',
    organizationalCode: 'R-1005',
    nationalId: '0012233445',
    address: 'اصفهان، خیابان مشتاق دوم، پلاک 88',
    age: 30,
    specialty: 'روان‌شناسی بحران',
    acceptedIncidentsCount: 22,
    completedMissions: ['زلزله خفیف منطقه مرکزی', 'سیل منطقه خوراسگان'],
    position: { lat: 32.6450, lng: 51.6550 },
    phone: '09134445566'
  },
  {
    id: '6',
    name: 'حسین محمدی',
    gender: 'male',
    status: 'active',
    organizationalCode: 'R-1006',
    nationalId: '0015566778',
    address: 'اصفهان، خیابان شمس‌آبادی، مجتمع نوین',
    age: 38,
    specialty: 'آتش‌نشانی و نجات',
    acceptedIncidentsCount: 27,
    completedMissions: ['آتش‌سوزی ساختمان باغ گلدسته', 'حادثه کارخانه پتروشیمی', 'سیل بزرگ منطقه خوراسگان'],
    position: { lat: 32.6700, lng: 51.6900 },
    phone: '09137778899'
  }
];

export const mockAlerts: Alert[] = [
  {
    id: '1',
    title: 'سیل بزرگراه چمران',
    description: 'سیلاب ناگهانی در بزرگراه شهید چمران. نیاز به مسدودسازی مسیر و اعزام تیم‌های امدادی.',
    incidentType: 'سیل',
    targetGender: 'all',
    location: {
      lat: 32.6546,
      lng: 51.6680,
      address: 'بزرگراه شهید چمران، نزدیک پل فلزی'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    completedAt: new Date(Date.now() - 1000 * 60 * 30),
    status: 'completed',
    acceptedResponders: ['2', '5']
  },
  {
    id: '2',
    title: 'برف و کولاک پارک ملت',
    description: 'بارش شدید برف و کولاک در پارک ملت. نیاز به انتقال اضطراری افراد گرفتار.',
    incidentType: 'برف و کولاک',
    targetGender: 'female',
    location: {
      lat: 32.6580,
      lng: 51.6750,
      address: 'پارک ملت، درب شرقی'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
    status: 'accepted',
    acceptedResponders: ['1', '3']
  },
  {
    id: '3',
    title: 'حمله ی نظامی در حاشیه شهر',
    description: 'حمله نظامی کوتاه‌مدت در حاشیه شهر گزارش شده است. نیاز به ارزیابی سریع وضعیت.',
    incidentType: 'حمله ی نظامی',
    targetGender: 'male',
    location: {
      lat: 32.6500,
      lng: 51.6600,
      address: 'خیابان باغ گلدسته، ساختمان شماره 45'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 45),
    status: 'pending'
  },
  {
    id: '4',
    title: 'زلزله خفیف',
    description: 'زلزله خفیف در منطقه مرکزی. نیاز به بررسی آسیب‌ها',
    incidentType: 'زلزله',
    targetGender: 'all',
    location: {
      lat: 32.6600,
      lng: 51.6700,
      address: 'خیابان چهارباغ عباسی، منطقه مرکزی'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    status: 'completed',
    acceptedResponders: ['2', '6']
  },
  {
    id: '5',
    title: 'مانور امدادی حکیم نظامی',
    description: 'مانور آموزشی امدادگران در خیابان حکیم نظامی. نیاز به هماهنگی تیم‌های پشتیبانی.',
    incidentType: 'مانور',
    targetGender: 'all',
    location: {
      lat: 32.6650,
      lng: 51.6800,
      address: 'خیابان حکیم نظامی، کوچه 12'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 20),
    status: 'pending'
  }
];

export const mockBases: Base[] = [
  {
    id: '1',
    code: 'BASE-001',
    address: 'خیابان چهارباغ عباسی، پایگاه مرکزی هلال احمر',
    location: {
      lat: 32.6546,
      lng: 51.6680
    },
    activeResponders: 12,
    inactiveResponders: 3
  },
  {
    id: '2',
    code: 'BASE-002',
    address: 'بلوار ارتش، پایگاه شمالی هلال احمر',
    location: {
      lat: 32.6700,
      lng: 51.6900
    },
    activeResponders: 8,
    inactiveResponders: 2
  },
  {
    id: '3',
    code: 'BASE-003',
    address: 'خیابان باغ گلدسته، پایگاه جنوبی هلال احمر',
    location: {
      lat: 32.6400,
      lng: 51.6500
    },
    activeResponders: 10,
    inactiveResponders: 4
  },
  {
    id: '4',
    code: 'BASE-004',
    address: 'خیابان حکیم نظامی، پایگاه شرقی هلال احمر',
    location: {
      lat: 32.6650,
      lng: 51.7000
    },
    activeResponders: 6,
    inactiveResponders: 1
  }
];
