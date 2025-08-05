import { DoctorAppointment } from '@/lib/recoil/atoms';

/**
 * Fetches doctor appointments from the API
 * @param doctorId - The doctor's ID
 * @param token - Authorization token
 * @returns Promise<DoctorAppointment[]>
 */
export const fetchDoctorAppointments = async (
  doctorId: string,
  token: string
): Promise<DoctorAppointment[]> => {
  try {
    const apiBase = (import.meta.env.VITE_API_URL || 'http://0.0.0.0:3001').replace(/\/+$/, '');
    const fullApiBase = apiBase.includes('/api') ? apiBase : `${apiBase}/api`;

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

    // Transform data to match our interface
    return appointmentsData.map((apt: any): DoctorAppointment => ({
      id: apt.id.toString(),
      patientName: apt.patientName,
      email: apt.email,
      phone: apt.phone,
      reason: apt.reason,
      status: apt.status,
      doctorId: apt.doctorId,
      time: apt.time,
      date: apt.date,
    }));
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    throw new Error('Failed to fetch appointments');
  }
};

/**
 * Updates an appointment's status
 * @param appointmentId - The appointment ID
 * @param updates - Fields to update
 * @param token - Authorization token
 * @returns Promise<void>
 */
export const updateAppointment = async (
  appointmentId: string,
  updates: Partial<DoctorAppointment>,
  token: string
): Promise<void> => {
  try {
    const apiBase = (import.meta.env.VITE_API_URL || 'http://0.0.0.0:3001').replace(/\/+$/, '');
    const fullApiBase = apiBase.includes('/api') ? apiBase : `${apiBase}/api`;

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
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw new Error('Failed to update appointment');
  }
};
