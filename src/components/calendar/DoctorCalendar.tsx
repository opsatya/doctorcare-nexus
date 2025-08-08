import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import { useAppointments } from '@/hooks/useAppointments';

const getApiBase = () =>
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const DoctorCalendar = () => {
  const { appointments, refreshAppointments } = useAppointments();
  const events = appointments.map(a => ({
    id: String(a.id),
    title: a.patientName,
    start: `${a.date}T${a.time}`,
    allDay: false,
    extendedProps: { ...a }
  }));

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      editable
      events={events}
      eventDrop={async (info) => {
        const id = info.event.id;
        const date = format(info.event.start!, 'yyyy-MM-dd');
        const time = format(info.event.start!, 'HH:mm');
        await fetch(`${getApiBase()}/appointments/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, time })
        });
        // Optionally: refresh or update state optimistically
        refreshAppointments();
      }}
    />
  );
};
