import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, X, Stethoscope, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { patientLoginSchema, doctorLoginSchema } from '@/lib/validation/schemas';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';

interface LoginFormData {
  email: string;
  password: string;
}

interface PatientLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatientLoginModal = ({ isOpen, onClose }: PatientLoginModalProps) => {
  const [loginType, setLoginType] = useState<'patient' | 'doctor'>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginType === 'patient' ? patientLoginSchema : doctorLoginSchema),
  });

  const switchLoginType = (type: 'patient' | 'doctor') => {
    setLoginType(type);
    reset();
    setShowPassword(false);
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      const endpoint = loginType === 'patient' ? '/api/patient/login' : '/api/doctor/login';
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Login successful!',
          description: `Welcome back, ${result.user?.name || result.doctor?.name}`,
        });
        
        onClose();
        
        // Navigate based on login type
        if (loginType === 'doctor') {
          window.location.href = '/dashboard';
        } else {
          // Navigate to patient dashboard (to be created)
          window.location.href = '/patient-dashboard';
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/50" />
      <DialogContent className="max-w-md mx-auto bg-background border-0 shadow-[var(--shadow-card)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {loginType === 'patient' ? (
                    <User className="h-6 w-6 text-primary" />
                  ) : (
                    <Stethoscope className="h-6 w-6 text-primary" />
                  )}
                  <span className="text-lg font-bold text-foreground">
                    {loginType === 'patient' ? 'Patient' : 'Doctor'} Login
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <CardDescription>
                {loginType === 'patient' 
                  ? 'Sign in to book appointments and manage your health'
                  : 'Access your medical dashboard and patient records'
                }
              </CardDescription>
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

              <div className="mt-6 text-center">
                {loginType === 'patient' ? (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Are you a doctor? </span>
                    <button
                      onClick={() => switchLoginType('doctor')}
                      className="text-primary hover:underline font-medium"
                    >
                      Login here
                    </button>
                  </div>
                ) : (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Are you a patient? </span>
                    <button
                      onClick={() => switchLoginType('patient')}
                      className="text-primary hover:underline font-medium"
                    >
                      Login here
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <button 
                  onClick={onClose}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </div>

              {/* Demo credentials */}
              {loginType === 'doctor' && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium text-muted-foreground mb-1">Demo Doctor:</p>
                  <p className="text-xs text-muted-foreground">Email: sarah.johnson@doctorcare.com</p>
                  <p className="text-xs text-muted-foreground">Password: password123</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};