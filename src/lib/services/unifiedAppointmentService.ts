import { Appointment } from '@/lib/recoil/atoms';

const getApiBase = () => {
  const apiBase = (import.meta.env.VITE_API_URL || 'http://0.0.0.0:3001').replace(/\/+$/, '');
  return apiBase.includes('/api') ? apiBase : `${apiBase}/api`;
};

/**
 * Fetches all appointments for a specific doctor
 */
export const fetchDoctorAppointments = async (
  doctorId: string,
  token: string
): Promise<Appointment[]> => {
  try {
    const fullApiBase = getApiBase();
    
    // Try doctor-specific endpoint first
    const response = await fetch(`${fullApiBase}/doctors/${doctorId}/appointments`, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let appointmentsData = [];
    if (response.ok) {
      appointmentsData = await response.json();
    } else {
      // Fallback: fetch all appointments and filter by doctor ID
      const allResponse = await fetch(`${fullApiBase}/appointments`, {
        cache: 'no-store'
      });
      const allAppointments = await allResponse.json();
      appointmentsData = allAppointments.filter((apt: any) => apt.doctorId === doctorId);
    }

    // Transform data to match our unified interface
    return appointmentsData.map((apt: any): Appointment => ({
      id: apt.id.toString(),
      patientName: apt.patientName,
      doctorName: apt.doctorName,
      doctorId: apt.doctorId.toString(),
      email: apt.email,
      phone: apt.phone,
      reason: apt.reason,
      status: apt.status,
      time: apt.time,
      date: apt.date,
      specialization: apt.specialization,
    }));
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    throw new Error('Failed to fetch appointments');
  }
};

/**
 * Fetches all appointments for a specific patient
 */
export const fetchPatientAppointments = async (
  patientEmail: string,
  token: string
): Promise<Appointment[]> => {
  try {
    const fullApiBase = getApiBase();
    
    const response = await fetch(`${fullApiBase}/appointments`, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const allAppointments = await response.json();
    const patientAppointments = allAppointments.filter((apt: any) => apt.email === patientEmail);

    return patientAppointments.map((apt: any): Appointment => ({
      id: apt.id.toString(),
      patientName: apt.patientName,
      doctorName: apt.doctorName,
      doctorId: apt.doctorId.toString(),
      email: apt.email,
      phone: apt.phone,
      reason: apt.reason,
      status: apt.status,
      time: apt.time,
      date: apt.date,
      specialization: apt.specialization,
    }));
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    throw new Error('Failed to fetch appointments');
  }
};

/**
 * Updates an appointment and returns the updated appointment
 */
export const updateAppointment = async (
  appointmentId: string,
  updates: Partial<Appointment>,
  token: string
): Promise<Appointment> => {
  try {
    const fullApiBase = getApiBase();

    const response = await fetch(`${fullApiBase}/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update appointment');
    }

    const updatedAppointment = await response.json();
    return {
      id: updatedAppointment.id.toString(),
      patientName: updatedAppointment.patientName,
      doctorName: updatedAppointment.doctorName,
      doctorId: updatedAppointment.doctorId.toString(),
      email: updatedAppointment.email,
      phone: updatedAppointment.phone,
      reason: updatedAppointment.reason,
      status: updatedAppointment.status,
      time: updatedAppointment.time,
      date: updatedAppointment.date,
      specialization: updatedAppointment.specialization,
    };
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw new Error('Failed to update appointment');
  }
};

/**
 * Creates a new appointment
 */
export const createAppointment = async (
  appointmentData: Omit<Appointment, 'id'>,
  token: string
): Promise<Appointment> => {
  try {
    const fullApiBase = getApiBase();

    // Prepare the appointment data for the backend
    const backendData = {
      patientName: appointmentData.patientName,
      email: appointmentData.email,
      phone: appointmentData.phone,
      doctorId: appointmentData.doctorId,
      doctorName: appointmentData.doctorName,
      date: appointmentData.date,
      time: appointmentData.time,
      reason: appointmentData.reason,
      status: appointmentData.status || 'pending',
      specialization: appointmentData.specialization || '', // Add specialization with fallback
    };

    console.log('Creating appointment with data:', backendData);

    const response = await fetch(`${fullApiBase}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }), // Only add auth if token exists
      },
      body: JSON.stringify(backendData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Failed to create appointment: ${response.status} ${response.statusText}`);
    }

    const newAppointment = await response.json();
    console.log('Appointment created successfully:', newAppointment);

    return {
      id: newAppointment.id.toString(),
      patientName: newAppointment.patientName,
      doctorName: appointmentData.doctorName || '', // Use provided or fallback
      doctorId: newAppointment.doctorId.toString(),
      email: newAppointment.email,
      phone: newAppointment.phone,
      reason: newAppointment.reason,
      status: newAppointment.status,
      time: newAppointment.time,
      date: newAppointment.date,
      specialization: appointmentData.specialization || '',
    };
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error; // Re-throw the original error for better debugging
  }
};