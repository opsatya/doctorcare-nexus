import { useCallback, useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useToast } from '@/hooks/use-toast';
import { 
  appointmentsState, 
  appointmentsLoadingState, 
  authState,
  Appointment 
} from '@/lib/recoil/atoms';

// Direct API functions that work with your backend
const getApiBase = () => {
  const apiBase = import.meta.env.DEV 
    ? '/api' 
    : (import.meta.env.VITE_API_URL || 'http://0.0.0.0:3001/api').replace(/\/+$/, '');
  return apiBase;
};

const fetchAllAppointments = async (): Promise<Appointment[]> => {
  const apiBase = getApiBase();
  const response = await fetch(`${apiBase}/appointments`, {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch appointments');
  }
  
  const data = await response.json();
  return data.map((apt: any): Appointment => ({
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
  }));
};

const createAppointmentAPI = async (appointmentData: any): Promise<Appointment> => {
  const apiBase = getApiBase();
  const response = await fetch(`${apiBase}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(appointmentData),
  });

  if (!response.ok) {
    throw new Error('Failed to create appointment');
  }

  const newAppointment = await response.json();
  return {
    id: newAppointment.id,
    patientName: newAppointment.patientName,
    doctorName: newAppointment.doctorName || '',
    doctorId: newAppointment.doctorId,
    email: newAppointment.email,
    phone: newAppointment.phone,
    reason: newAppointment.reason,
    status: newAppointment.status,
    time: newAppointment.time,
    date: newAppointment.date,
    specialization: newAppointment.specialization || '',
  };
};

const updateAppointmentAPI = async (appointmentId: number, updates: Partial<Appointment>): Promise<Appointment> => {
  const apiBase = getApiBase();
  const response = await fetch(`${apiBase}/appointments/${appointmentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update appointment');
  }

  const updatedAppointment = await response.json();
  return {
    id: updatedAppointment.id,
    patientName: updatedAppointment.patientName,
    doctorName: updatedAppointment.doctorName || '',
    doctorId: updatedAppointment.doctorId,
    email: updatedAppointment.email,
    phone: updatedAppointment.phone,
    reason: updatedAppointment.reason,
    status: updatedAppointment.status,
    time: updatedAppointment.time,
    date: updatedAppointment.date,
    specialization: updatedAppointment.specialization || '',
  };
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

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const wsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:3001').replace(/^http/, 'ws');
    const ws = new WebSocket(wsUrl);
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectWebSocket = () => {
      ws.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts = 0; // Reset on successful connection
        
        // Authenticate based on user type
        if (auth.doctor?.id) {
          ws.send(JSON.stringify({ 
            type: 'auth', 
            userType: 'doctor', 
            doctorId: auth.doctor.id 
          }));
        } else if (auth.patient?.id) {
          ws.send(JSON.stringify({ 
            type: 'auth', 
            userType: 'patient', 
            patientId: auth.patient.id 
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);

          if (message.type === 'appointment_created') {
            const newAppointment = message.appointment;
            setAppointments((prev) => {
              // Check if appointment already exists (prevent duplicates)
              if (prev.find(apt => apt.id === newAppointment.id)) {
                return prev;
              }
              return [...prev, newAppointment];
            });
            
            // Only show toast if relevant to current user
            if (auth.doctor && newAppointment.doctorId === auth.doctor.id) {
              toast({ 
                title: 'New Appointment', 
                description: `A new appointment for ${newAppointment.patientName} has been booked.` 
              });
            } else if (auth.patient && newAppointment.email === auth.patient.email) {
              toast({ 
                title: 'Appointment Confirmed', 
                description: `Your appointment with Dr. ${newAppointment.doctorName} has been created.` 
              });
            }
          } else if (message.type === 'appointment_updated') {
            const updatedAppointment = message.appointment;
            setAppointments((prev) =>
              prev.map((apt) => (apt.id === updatedAppointment.id ? updatedAppointment : apt))
            );
            
            // Only show toast if relevant to current user
            if ((auth.doctor && updatedAppointment.doctorId === auth.doctor.id) ||
                (auth.patient && updatedAppointment.email === auth.patient.email)) {
              toast({ 
                title: 'Appointment Updated', 
                description: `Appointment for ${updatedAppointment.patientName} has been ${updatedAppointment.status}.`,
                variant: updatedAppointment.status === 'cancelled' ? 'destructive' : 'default'
              });
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            console.log(`Attempting to reconnect... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
            reconnectAttempts++;
            connectWebSocket();
          }, Math.pow(2, reconnectAttempts) * 1000); // 1s, 2s, 4s, 8s, 16s
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();
    // Initial data fetch
    refreshAppointments();

    return () => {
      ws.close();
    };
  }, [auth.isAuthenticated, auth.doctor?.id, auth.patient?.id, setAppointments, toast, refreshAppointments]);

  const updateAppointment = useCallback(async (
    appointmentId: number,
    updates: Partial<Appointment>
  ) => {
    try {
      console.log('Updating appointment:', appointmentId, updates);
      
      await updateAppointmentAPI(appointmentId, updates);
      
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
  }, [toast]);

  const createAppointment = useCallback(async (
    appointmentData: Omit<Appointment, 'id'>
  ) => {
    try {
      console.log('Creating appointment:', appointmentData);
      
      const backendData = {
        patientName: appointmentData.patientName,
        email: appointmentData.email,
        phone: appointmentData.phone,
        doctorId: Number(appointmentData.doctorId),
        date: appointmentData.date,
        time: appointmentData.time,
        reason: appointmentData.reason,
        status: appointmentData.status || 'pending',
      };
      
      const newAppointment = await createAppointmentAPI(backendData);
      console.log('Appointment created successfully:', newAppointment);

      toast({
        title: 'Appointment created',
        description: 'The appointment has been created successfully.',
      });
      
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
  }, [toast]);

  // Get filtered appointments for current user
  const getUserAppointments = useCallback(() => {
    if (auth.doctor?.id) {
      return appointments.filter(apt => apt.doctorId === auth.doctor!.id);
    } else if (auth.patient?.email) {
      return appointments.filter(apt => apt.email === auth.patient!.email);
    }
    return appointments; // Return all if no specific user context
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