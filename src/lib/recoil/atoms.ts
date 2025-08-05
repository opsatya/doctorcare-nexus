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

// Doctor Appointments Interface
export interface DoctorAppointment {
  type: ReactNode;
  id: string;
  patientName: string;
  email: string;
  phone: string;
  reason: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  doctorId: string;
  time: string;
  date: string;
}

// Doctor appointments global state
export const doctorAppointmentsState = atom<DoctorAppointment[]>({
  key: 'doctorAppointmentsState',
  default: [], // initial empty array
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