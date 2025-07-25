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

export interface AuthState {
  isAuthenticated: boolean;
  doctor: Doctor | null;
  token: string | null;
}

export const authState = atom<AuthState>({
  key: 'authState',
  default: {
    isAuthenticated: false,
    doctor: null,
    token: null,
  },
});

export const loadingState = atom<boolean>({
  key: 'loadingState',
  default: false,
});