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

export const mockResponders: Responder[] = [];

export const mockAlerts: Alert[] = [];

export const mockBases: Base[] = [];
