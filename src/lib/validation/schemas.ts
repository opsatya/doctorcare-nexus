import * as yup from 'yup';

export const doctorSignupSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: yup
    .string()
    .email('Invalid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Password confirmation is required'),
  specialization: yup
    .string()
    .required('Specialization is required'),
  licenseNumber: yup
    .string()
    .required('License number is required'),
  phone: yup
    .string()
    .required('Phone number is required'),
});

export const doctorLoginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Invalid email')
    .required('Email is required'),
  password: yup
    .string()
    .required('Password is required'),
});

export const patientLoginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Invalid email')
    .required('Email is required'),
  password: yup
    .string()
    .required('Password is required'),
});

export const patientSignupSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: yup
    .string()
    .email('Invalid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Password confirmation is required'),
  phone: yup
    .string()
    .required('Phone number is required'),
  dateOfBirth: yup
    .string()
    .required('Date of birth is required'),
  address: yup
    .string()
    .required('Address is required'),
});

export const profileUpdateSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters'),
  specialization: yup
    .string()
    .required('Specialization is required'),
  licenseNumber: yup
    .string()
    .required('License number is required'),
  phone: yup
    .string()
    .required('Phone number is required'),
});

export const prescriptionSchema = yup.object().shape({
  patientName: yup
    .string()
    .required('Patient name is required')
    .min(2, 'Patient name must be at least 2 characters'),
  appointmentId: yup
    .string()
    .optional(),
  medicineName: yup
    .string()
    .required('Medicine name is required')
    .min(2, 'Medicine name must be at least 2 characters'),
  dosage: yup
    .string()
    .required('Dosage is required')
    .min(2, 'Dosage must be specified'),
  duration: yup
    .string()
    .required('Duration is required')
    .min(2, 'Duration must be specified'),
  notes: yup
    .string()
    .optional(),
});

// TypeScript types
export interface Prescription {
  id: string;
  doctorId: string;
  doctorName: string;
  patientName: string;
  appointmentId?: string;
  medicineName: string;
  dosage: string;
  duration: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PrescriptionFormData {
  patientName: string;
  appointmentId?: string;
  medicineName: string;
  dosage: string;
  duration: string;
  notes?: string;
}
