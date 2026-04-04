export interface Medicine {
  id: string;
  name: string;
}

export interface Pharmacy {
  id: number;
  name: string;
  distance: number;
  openTime: number; // 24hr format
  closeTime: number;
  medsAvailable: number;
  medsTotal: number;
  priceTotal: number;
  insurancePays: number;
  userPays: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  expiryDays: number;
  price: number;
}

export interface Reservation {
  id: string;
  patientName: string;
  items: string[];
  status: 'pending' | 'reviewed';
  notes?: string;
}

export interface Registration {
  id: string;
  pharmacyName: string;
  licenseNumber: string;
  submittedAt: string;
  status: 'pending' | 'approved';
}

export type UserMode = 'patient' | 'pharmacist' | 'admin';
export type PatientView = 'landing' | 'verifying' | 'results';
