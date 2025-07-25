import * as yup from 'yup';

export const doctorSignupSchema = yup.object().shape({
  name: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: yup
    .string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  password: yup
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .required('Senha é obrigatória'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Senhas devem coincidir')
    .required('Confirmação de senha é obrigatória'),
  specialization: yup
    .string()
    .required('Especialização é obrigatória'),
  licenseNumber: yup
    .string()
    .required('Número do CRM é obrigatório'),
  phone: yup
    .string()
    .required('Telefone é obrigatório'),
});

export const doctorLoginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  password: yup
    .string()
    .required('Senha é obrigatória'),
});

export const profileUpdateSchema = yup.object().shape({
  name: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres'),
  specialization: yup
    .string()
    .required('Especialização é obrigatória'),
  licenseNumber: yup
    .string()
    .required('Número do CRM é obrigatório'),
  phone: yup
    .string()
    .required('Telefone é obrigatório'),
});