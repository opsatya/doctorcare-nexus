import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { motion } from 'framer-motion';
import { useSetRecoilState } from 'recoil';
import { Eye, EyeOff, ArrowLeft, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { doctorSignupSchema, patientSignupSchema } from '@/lib/validation/schemas';
import { authState } from '@/lib/recoil/atoms';

interface DoctorSignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  specialization: string;
  licenseNumber: string;
  phone: string;
}

interface PatientSignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth: string;
  address: string;
}

export const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<'patient' | 'doctor'>('doctor');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const setAuth = useSetRecoilState(authState);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'patient' || type === 'doctor') {
      setUserType(type);
    }
  }, [searchParams]);

  const doctorForm = useForm<DoctorSignupFormData>({
    resolver: yupResolver(doctorSignupSchema),
  });

  const patientForm = useForm<PatientSignupFormData>({
    resolver: yupResolver(patientSignupSchema),
  });

  const onDoctorSubmit = async (data: DoctorSignupFormData) => {
    setIsLoading(true);
    
    try {
const apiBase = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBase}/doctor/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        const authData = {
          isAuthenticated: true,
          doctor: result.doctor,
          patient: null,
          token: result.token,
        };
        
        setAuth(authData);
        localStorage.setItem('doctorcare_auth', JSON.stringify(authData));
        
        toast({
          title: 'Account created successfully!',
          description: 'Welcome to DoctorCare, Doctor!',
        });
        
        navigate('/dashboard');
      } else {
        toast({
          title: 'Registration error',
          description: result.message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Connection error',
        description: 'Could not connect to the server.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onPatientSubmit = async (data: PatientSignupFormData) => {
    setIsLoading(true);
    
    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBase}/patient/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        const authData = {
          isAuthenticated: true,
          doctor: null,
          patient: result.patient,
          token: result.token,
        };
        
        setAuth(authData);
        localStorage.setItem('doctorcare_patient_auth', JSON.stringify(authData));
        
        toast({
          title: 'Account created successfully!',
          description: 'Welcome to DoctorCare, Patient!',
        });
        
        navigate('/patient-dashboard');
      } else {
        toast({
          title: 'Registration error',
          description: result.message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Connection error',
        description: 'Could not connect to the server.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentForm = userType === 'doctor' ? doctorForm : patientForm;
  const currentErrors = currentForm.formState.errors;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="flex items-center space-x-2 mb-4">
            <Stethoscope className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">
              Doctor<span className="text-primary">Care</span>
            </span>
          </div>
        </div>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {userType === 'patient' ? 'Patient Registration' : 'Doctor Registration'}
            </CardTitle>
            <CardDescription>
              Create your account to start using our platform
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* User Type Selector */}
            <div className="mb-6">
              <Label className="text-base font-medium">I want to register as:</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Button
                  type="button"
                  variant={userType === 'patient' ? 'default' : 'outline'}
                  onClick={() => setUserType('patient')}
                  className="w-full"
                >
                  Patient
                </Button>
                <Button
                  type="button"
                  variant={userType === 'doctor' ? 'default' : 'outline'}
                  onClick={() => setUserType('doctor')}
                  className="w-full"
                >
                  Doctor
                </Button>
              </div>
            </div>

            {userType === 'doctor' && (
              <form onSubmit={doctorForm.handleSubmit(onDoctorSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      {...doctorForm.register('name')}
                      placeholder="Dr. John Smith"
                    />
                    {currentErrors.name && (
                      <p className="text-sm text-destructive">{currentErrors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...doctorForm.register('email')}
                      placeholder="john@example.com"
                    />
                    {currentErrors.email && (
                      <p className="text-sm text-destructive">{currentErrors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      {...doctorForm.register('specialization')}
                      placeholder="Cardiology"
                    />
                    {(currentErrors as any).specialization && (
                      <p className="text-sm text-destructive">{(currentErrors as any).specialization.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      {...doctorForm.register('licenseNumber')}
                      placeholder="12345-NY"
                    />
                    {(currentErrors as any).licenseNumber && (
                      <p className="text-sm text-destructive">{(currentErrors as any).licenseNumber.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...doctorForm.register('phone')}
                    placeholder="+1 (555) 123-4567"
                  />
                  {currentErrors.phone && (
                    <p className="text-sm text-destructive">{currentErrors.phone.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        {...doctorForm.register('password')}
                        placeholder="Minimum 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {currentErrors.password && (
                      <p className="text-sm text-destructive">{currentErrors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...doctorForm.register('confirmPassword')}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {currentErrors.confirmPassword && (
                      <p className="text-sm text-destructive">{currentErrors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-hero"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Create Doctor Account'}
                </Button>
              </form>
            )}

            {userType === 'patient' && (
              <form onSubmit={patientForm.handleSubmit(onPatientSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      {...patientForm.register('name')}
                      placeholder="John Smith"
                    />
                    {currentErrors.name && (
                      <p className="text-sm text-destructive">{currentErrors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...patientForm.register('email')}
                      placeholder="john@example.com"
                    />
                    {currentErrors.email && (
                      <p className="text-sm text-destructive">{currentErrors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      {...patientForm.register('dateOfBirth')}
                    />
                    {(currentErrors as any).dateOfBirth && (
                      <p className="text-sm text-destructive">{(currentErrors as any).dateOfBirth.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      {...patientForm.register('address')}
                      placeholder="123 Main St, City, State"
                    />
                    {(currentErrors as any).address && (
                      <p className="text-sm text-destructive">{(currentErrors as any).address.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...patientForm.register('phone')}
                    placeholder="+1 (555) 123-4567"
                  />
                  {currentErrors.phone && (
                    <p className="text-sm text-destructive">{currentErrors.phone.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        {...patientForm.register('password')}
                        placeholder="Minimum 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {currentErrors.password && (
                      <p className="text-sm text-destructive">{currentErrors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...patientForm.register('confirmPassword')}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {currentErrors.confirmPassword && (
                      <p className="text-sm text-destructive">{currentErrors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-hero"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Create Patient Account'}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to={`/login?type=${userType}`} className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};