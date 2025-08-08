import { useCallback, useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useToast } from '@/hooks/use-toast';
import websocketService from '@/lib/services/websocketService';
import {
  appointmentsState,
  appointmentsLoadingState,
  authState,
  Appointment
} from '@/lib/recoil/atoms';

// Utility for API base URL
const getApiBase = () => {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }
  return (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
};

const mapAppointment = (apt: any): Appointment => ({
  id: apt.id,
  patientName: apt.patientName,
  doctorName: apt.doctorName || '',
  doctorId: apt.doctorId,
  email: apt.email,
  phone: apt.phone,
  reason: apt.reason,
  status: apt.status,
  time: apt.time,
  date: apt.date,
  specialization: apt.specialization || '',
});

// API Calls

const fetchAllAppointments = async (): Promise<Appointment[]> => {
  const response = await fetch(`${getApiBase()}/appointments`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch appointments');
  const data = await response.json();
  return data.map(mapAppointment);
};

const createAppointmentAPI = async (appointmentData: any): Promise<Appointment> => {
  const response = await fetch(`${getApiBase()}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointmentData),
  });
  if (!response.ok) throw new Error('Failed to create appointment');
  return mapAppointment(await response.json());
};

const updateAppointmentAPI = async (
  appointmentId: number,
  updates: Partial<Appointment>
): Promise<Appointment> => {
  const response = await fetch(`${getApiBase()}/appointments/${appointmentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update appointment');
  return mapAppointment(await response.json());
};

export const useAppointments = () => {
  const [appointments, setAppointments] = useRecoilState(appointmentsState);
  const [isLoading, setIsLoading] = useRecoilState(appointmentsLoadingState);
  const auth = useRecoilValue(authState);
  const { toast } = useToast();

  const refreshAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllAppointments();
      setAppointments(data);
      return data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Error loading appointments',
        description: 'Could not load the latest appointments.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [setAppointments, setIsLoading, toast]);

  useEffect(() => {
    if (auth.isAuthenticated) {
      refreshAppointments();
    }
  }, [auth.isAuthenticated, refreshAppointments]);

  // WebSocket subscriptions
  useEffect(() => {
    if (!auth.isAuthenticated) return;
    // --- Deduplication for new/updated appointments ---
    const handleCreated = (msg: { appointment: Appointment }) => {
      setAppointments(prev => {
        if (prev.some(a => String(a.id) === String(msg.appointment.id))) return prev;
        return [msg.appointment, ...prev];
      });
      toast({ title: 'New Appointment', description: 'A new appointment has been scheduled.' });
    };
    const handleUpdated = (msg: { appointment: Appointment }) => {
      setAppointments(prev => {
        const idx = prev.findIndex(a => String(a.id) === String(msg.appointment.id));
        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = msg.appointment;
          return updated;
        }
        return [msg.appointment, ...prev];
      });
      toast({ title: 'Appointment Updated', description: 'An appointment has been updated.' });
    };

    const unsubCreated = websocketService.subscribe('appointment_created', handleCreated);
    const unsubUpdated = websocketService.subscribe('appointment_updated', handleUpdated);
    return () => {
      unsubCreated();
      unsubUpdated();
    };
  }, [auth.isAuthenticated, setAppointments, toast]);

  const updateAppointment = useCallback(async (id: number, updates: Partial<Appointment>) => {
    try {
      await updateAppointmentAPI(id, updates);
      toast({ title: 'Appointment updated', description: 'The appointment has been updated successfully.' });
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Update failed',
        description: 'Could not update the appointment.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const createAppointment = useCallback(async (data: Omit<Appointment, 'id'>) => {
    try {
      const backendData = {
        patientName: data.patientName,
        email: data.email,
        phone: data.phone,
        doctorId: Number(data.doctorId),
        date: data.date,
        time: data.time,
        reason: data.reason,
        status: data.status || 'pending',
      };
      const newAppointment = await createAppointmentAPI(backendData);
      // --- Optimistic Update, dedupe ---
      setAppointments(prev => {
        if (prev.some(a => String(a.id) === String(newAppointment.id))) return prev;
        return [newAppointment, ...prev];
      });
      toast({ title: 'Appointment created', description: 'The appointment has been created successfully.' });
      return newAppointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: 'Creation failed',
        description: 'Could not create the appointment.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast, setAppointments]);

  const getUserAppointments = useCallback(() => {
    if (auth.doctor?.id) return appointments.filter(apt => apt.doctorId === auth.doctor.id);
    if (auth.patient?.email) return appointments.filter(apt => apt.email === auth.patient.email);
    return appointments;
  }, [appointments, auth]);

  const getAppointmentStats = useCallback(() => {
    const userAppointments = getUserAppointments();
    const today = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const weekStart = startOfWeek.toISOString().split('T')[0];
    return {
      total: userAppointments.length,
      totalPatients: auth.doctor ? new Set(userAppointments.map(apt => apt.email)).size : 0,
      appointmentsToday: userAppointments.filter(apt => apt.date === today).length,
      appointmentsThisWeek: userAppointments.filter(apt => apt.date >= weekStart).length,
      pending: userAppointments.filter(apt => apt.status === 'pending').length,
      confirmed: userAppointments.filter(apt => apt.status === 'confirmed').length,
      cancelled: userAppointments.filter(apt => apt.status === 'cancelled').length,
    };
  }, [getUserAppointments, auth.doctor]);

  return {
    appointments: getUserAppointments(),
    allAppointments: appointments,
    isLoading,
    refreshAppointments,
    updateAppointment,
    createAppointment,
    stats: getAppointmentStats(),
  };
};
