import { atom } from 'recoil';

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

// Helper function to get initial auth state from localStorage
const getInitialAuthState = (): AuthState => {
  try {
    // Check for doctor auth first
    const doctorAuth = localStorage.getItem('doctorcare_auth');
    if (doctorAuth) {
      const parsed = JSON.parse(doctorAuth);
      if (parsed.isAuthenticated && parsed.doctor && parsed.token) {
        return parsed;
      }
    }

    // Check for patient auth
    const patientAuth = localStorage.getItem('doctorcare_patient_auth');
    if (patientAuth) {
      const parsed = JSON.parse(patientAuth);
      if (parsed.isAuthenticated && parsed.patient && parsed.token) {
        return {
          isAuthenticated: true,
          doctor: null,
          patient: parsed.patient,
          token: parsed.token,
        };
      }
    }
  } catch (error) {
    console.error('Error loading auth state from localStorage:', error);
  }

  return {
    isAuthenticated: false,
    doctor: null,
    patient: null,
    token: null,
  };
};

export const authState = atom<AuthState>({
  key: 'authState',
  default: getInitialAuthState(),
});

export const loadingState = atom<boolean>({
  key: 'loadingState',
  default: false,
});

// Unified appointments global state - shared across all components
export const appointmentsState = atom<Appointment[]>({
  key: 'appointmentsState',
  default: [],
});

// Loading state for appointments
export const appointmentsLoadingState = atom<boolean>({
  key: 'appointmentsLoadingState',
  default: false,
});

// Utility function to clear auth state and localStorage
export const clearAuthState = () => {
  localStorage.removeItem('doctorcare_auth');
  localStorage.removeItem('doctorcare_patient_auth');
  return {
    isAuthenticated: false,
    doctor: null,
    patient: null,
    token: null,
  };
};