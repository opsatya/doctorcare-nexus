import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { motion } from 'framer-motion';
import { useSetRecoilState } from 'recoil';
import { Eye, EyeOff, ArrowLeft, Stethoscope, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { doctorLoginSchema, patientLoginSchema } from '@/lib/validation/schemas';
import { authState } from '@/lib/recoil/atoms';

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<'patient' | 'doctor'>('patient');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const setAuth = useSetRecoilState(authState);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'doctor') {
      setLoginType('doctor');
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginType === 'doctor' ? doctorLoginSchema : patientLoginSchema),
  });

  const switchLoginType = (type: 'patient' | 'doctor') => {
    setLoginType(type);
    reset();
    setShowPassword(false);
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
const apiBase = import.meta.env.VITE_API_URL || '/api';
      const endpoint = loginType === 'doctor' ? `${apiBase}/doctor/login` : `${apiBase}/patient/login`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        if (loginType === 'doctor') {
          const authData = {
            isAuthenticated: true,
            doctor: result.doctor,
            patient: null,
            token: result.token,
          };
          setAuth(authData);
          localStorage.setItem('doctorcare_auth', JSON.stringify(authData));
          
          toast({
            title: 'Login successful!',
            description: `Welcome back, Dr. ${result.doctor.name}`,
          });
          
          navigate('/dashboard');
        } else {
          const authData = {
            isAuthenticated: true,
            doctor: null,
            patient: result.patient,
            token: result.token,
          };
          setAuth(authData);
          localStorage.setItem('doctorcare_patient_auth', JSON.stringify(authData));
          
          toast({
            title: 'Login successful!',
            description: `Welcome back, ${result.patient.name}`,
          });
          
          // Small delay to ensure auth state is updated before navigation
          setTimeout(() => {
            navigate('/patient-dashboard');
          }, 100);
        }
      } else {
        toast({
          title: 'Login error',
          description: result.message || 'Incorrect email or password.',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
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
            <div className="flex items-center space-x-2 mb-4">
              {loginType === 'patient' ? (
                <User className="h-6 w-6 text-primary" />
              ) : (
                <Stethoscope className="h-6 w-6 text-primary" />
              )}
              <CardTitle className="text-2xl font-bold">
                {loginType === 'patient' ? 'Patient' : 'Doctor'} Login
              </CardTitle>
            </div>
            <CardDescription>
              {loginType === 'patient' 
                ? 'Sign in to book appointments and manage your health'
                : 'Access your medical dashboard and patient records'
              }
            </CardDescription>
            
            {/* Login Type Selector */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button
                type="button"
                variant={loginType === 'patient' ? 'default' : 'outline'}
                onClick={() => switchLoginType('patient')}
                size="sm"
              >
                Patient
              </Button>
              <Button
                type="button"
                variant={loginType === 'doctor' ? 'default' : 'outline'}
                onClick={() => switchLoginType('doctor')}
                size="sm"
              >
                Doctor
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full btn-hero"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to={`/signup?type=${loginType}`} className="text-primary hover:underline font-medium">
                Create Account
              </Link>
            </div>

            {/* Demo credentials */}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium text-muted-foreground mb-1">
                {loginType === 'doctor' ? 'Demo Doctor:' : 'Demo Patient:'}
              </p>
              {loginType === 'doctor' ? (
                <>
                  <p className="text-xs text-muted-foreground">Email: teste@example.com</p>
                  <p className="text-xs text-muted-foreground">Password: 123456</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Email: patient@example.com</p>
                  <p className="text-xs text-muted-foreground">Password: 123456</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};