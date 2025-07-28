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