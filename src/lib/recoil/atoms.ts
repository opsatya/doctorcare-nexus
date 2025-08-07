import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization: string;
  licenseNumber: string;
  phone: string;
  profileImage?: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  doctor: Doctor | null;
  patient: Patient | null;
  token: string | null;
}

// Unified appointment interface for both doctor and patient views
export interface Appointment {
  id: string;
  patientName: string;
  doctorName?: string;
  doctorId: string;
  email: string;
  phone: string;
  reason: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  date: string;
  time: string;
  specialization?: string;
}

const { persistAtom } = recoilPersist({
  key: 'recoil-persist',
  storage: localStorage,
});

export const authState = atom<AuthState>({
  key: 'authState',
  default: {
    isAuthenticated: false,
    doctor: null,
    patient: null,
    token: null,
  },
  effects_UNSTABLE: [persistAtom],
});

export const loadingState = atom<boolean>({
  key: 'loadingState',
  default: false,
});

// Unified appointments global state - shared across all components
// Note: NOT persisted - always fetch from backend to ensure latest state
export const appointmentsState = atom<Appointment[]>({
  key: 'appointmentsState',
  default: [],
  // effects_UNSTABLE: [persistAtom], // Removed to prevent stale data
});

// Loading state for appointments
export const appointmentsLoadingState = atom<boolean>({
  key: 'appointmentsLoadingState',
  default: false,
});
