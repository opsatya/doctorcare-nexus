import { useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useToast } from '@/hooks/use-toast';
import { 
  appointmentsState, 
  appointmentsLoadingState, 
  authState,
  Appointment 
} from '@/lib/recoil/atoms';
import { 
  fetchDoctorAppointments, 
  fetchPatientAppointments, 
  updateAppointment as updateAppointmentAPI,
  createAppointment as createAppointmentAPI
} from '@/lib/services/unifiedAppointmentService';

export const useAppointments = () => {
  const [appointments, setAppointments] = useRecoilState(appointmentsState);
  const [isLoading, setIsLoading] = useRecoilState(appointmentsLoadingState);
  const auth = useRecoilValue(authState);
  const { toast } = useToast();

  // Refresh appointments from backend and update state
  const refreshAppointments = useCallback(async () => {
    if (!auth.isAuthenticated || !auth.token) {
      console.log('Cannot fetch appointments: not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      let freshAppointments: Appointment[] = [];

      if (auth.doctor?.id) {
        freshAppointments = await fetchDoctorAppointments(auth.doctor.id, auth.token);
      } else if (auth.patient?.email) {
        freshAppointments = await fetchPatientAppointments(auth.patient.email, auth.token);
      }

      setAppointments(freshAppointments);
      console.log('Appointments refreshed:', freshAppointments);
    } catch (error) {
      console.error('Error refreshing appointments:', error);
      toast({
        title: 'Error loading appointments',
        description: 'Could not load the latest appointments.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [auth, setAppointments, setIsLoading, toast]);

  // Update appointment and refresh state
  const updateAppointment = useCallback(async (
    appointmentId: string,
    updates: Partial<Appointment>
  ) => {
    if (!auth.token) {
      throw new Error('Not authenticated');
    }

    try {
      await updateAppointmentAPI(appointmentId, updates, auth.token);
      
      // Immediately refresh all appointments to get the latest state
      await refreshAppointments();
      
      toast({
        title: 'Appointment updated',
        description: 'The appointment has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Update failed',
        description: 'Could not update the appointment.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [auth.token, refreshAppointments, toast]);

  // Create appointment and refresh state
  const createAppointment = useCallback(async (
    appointmentData: Omit<Appointment, 'id'>
  ) => {
    if (!auth.token) {
      throw new Error('Not authenticated');
    }

    try {
      await createAppointmentAPI(appointmentData, auth.token);
      
      // Immediately refresh all appointments to get the latest state
      await refreshAppointments();
      
      toast({
        title: 'Appointment created',
        description: 'The appointment has been created successfully.',
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: 'Creation failed',
        description: 'Could not create the appointment.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [auth.token, refreshAppointments, toast]);

  // Get filtered appointments for current user
  const getUserAppointments = useCallback(() => {
    if (auth.doctor?.id) {
      return appointments.filter(apt => apt.doctorId === auth.doctor!.id);
    } else if (auth.patient?.email) {
      return appointments.filter(apt => apt.email === auth.patient!.email);
    }
    return [];
  }, [appointments, auth]);

  // Calculate appointment statistics
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