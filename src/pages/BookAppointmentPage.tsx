import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { CalendarIcon, Clock, User, Phone, Mail, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAppointments } from '@/hooks/useAppointments';
import { useRecoilValue } from 'recoil';
import { authState } from '@/lib/recoil/atoms';
import { cn } from '@/lib/utils';

const appointmentSchema = yup.object().shape({
  patientName: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  reason: yup.string().required('Reason for visit is required'),
});

interface AppointmentForm {
  patientName: string;
  email: string;
  phone: string;
  reason: string;
}

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  consultationFee: number;
  location: string;
}

export const BookAppointmentPage = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const auth = useRecoilValue(authState);
  
  // Use the unified appointments hook
  const { createAppointment, refreshAppointments } = useAppointments();
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AppointmentForm>({
    resolver: yupResolver(appointmentSchema),
  });

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  ];

  useEffect(() => {
    if (doctorId) {
      fetchDoctor();
    }
    
    // Pre-fill patient information if user is authenticated
    if (auth.patient) {
      setValue('patientName', auth.patient.name);
      setValue('email', auth.patient.email);
      if (auth.patient.phone) {
        setValue('phone', auth.patient.phone);
      }
    }
  }, [doctorId, auth.patient, setValue]);

  const fetchDoctor = async () => {
    try {
      const apiBase = import.meta.env.DEV 
        ? '/api' 
        : (import.meta.env.VITE_API_URL || 'http://0.0.0.0:3001/api').replace(/\/+$/, '');
      const response = await fetch(`${apiBase}/doctors/${doctorId}`);
      const data = await response.json();
      setDoctor(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load doctor information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AppointmentForm) => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select a date and time for your appointment',
        variant: 'destructive',
      });
      return;
    }

    if (!doctor) {
      toast({
        title: 'Error',
        description: 'Doctor information not loaded',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Convert time format from "09:00 AM" to "09:00"
      const convertTimeTo24Hour = (time12h: string): string => {
        const [time, modifier] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') {
          hours = '00';
        }
        if (modifier === 'PM') {
          hours = String(parseInt(hours, 10) + 12);
        }
        return `${hours}:${minutes}`;
      };

      const appointmentData = {
        patientName: data.patientName,
        doctorName: doctor.name,
        doctorId: doctor.id.toString(), // Ensure doctorId is a string!
        email: data.email,
        phone: data.phone,
        reason: data.reason,
        status: 'pending' as const,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: convertTimeTo24Hour(selectedTime),
        specialization: doctor.specialization,
      };

      console.log('Submitting appointment data:', appointmentData);

      // Use the unified createAppointment function
      await createAppointment(appointmentData);

      toast({
        title: 'Appointment Booked!',
        description: 'Your appointment has been successfully booked. You will receive a confirmation email shortly.',
      });

      // Navigate based on user type
      if (auth.patient) {
        navigate('/patient-dashboard');
      } else {
        navigate('/appointments');
      }
    } catch (error) {
      console.error('Booking error:', error);
      
      // More specific error messages
      let errorMessage = 'Failed to book appointment. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = 'Appointment service not available. Please contact support.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid appointment data. Please check your information.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Authentication required. Please log in again.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Doctor not found</p>
          <Button onClick={() => navigate('/doctors')} className="mt-4">
            Back to Doctors
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/doctors')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Doctors
            </Button>
            
            <h1 className="text-4xl font-bold mb-2">Book Appointment</h1>
            <p className="text-xl text-muted-foreground">Schedule your consultation with Dr. {doctor.name}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Doctor Information */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Dr. {doctor.name}</CardTitle>
                  <CardDescription>{doctor.specialization}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{doctor.location}</span>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground">Consultation Fee</p>
                    <p className="text-2xl font-bold text-primary">₹{doctor.consultationFee}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Appointment Details</CardTitle>
                  <CardDescription>Fill in your details to book an appointment</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Patient Information */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="patientName">Full Name *</Label>
                        <Input
                          id="patientName"
                          {...register('patientName')}
                          placeholder="Enter your full name"
                        />
                        {errors.patientName && (
                          <p className="text-sm text-destructive">{errors.patientName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          {...register('phone')}
                          placeholder="+91 98765 43210"
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive">{errors.phone.message}</p>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="email">Email Address *</Label>
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
                    </div>

                    {/* Date Selection */}
                    <div className="space-y-2">
                      <Label>Select Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) =>
                              date < new Date() || date.getDay() === 0 // Disable past dates and Sundays
                            }
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Time Selection */}
                    <div className="space-y-2">
                      <Label>Select Time *</Label>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {timeSlots.map((time) => (
                          <Button
                            key={time}
                            type="button"
                            variant={selectedTime === time ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTime(time)}
                            className="text-xs"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Reason for Visit */}
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason for Visit *</Label>
                      <Textarea
                        id="reason"
                        {...register('reason')}
                        placeholder="Briefly describe your symptoms or reason for consultation"
                        rows={3}
                      />
                      {errors.reason && (
                        <p className="text-sm text-destructive">{errors.reason.message}</p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full btn-hero"
                      disabled={submitting}
                    >
                      {submitting ? 'Booking Appointment...' : 'Book Appointment'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};