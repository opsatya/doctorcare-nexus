import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import { EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useRecoilValue } from 'recoil';
import { authState, Appointment } from '@/lib/recoil/atoms';
import { useToast } from '@/hooks/use-toast';
import { useAppointments } from '@/hooks/useAppointments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon } from 'lucide-react';
import moment from 'moment';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

interface DoctorCalendarProps {
  onBack?: () => void;
}

type ViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

export const DoctorCalendar: React.FC<DoctorCalendarProps> = ({ onBack }) => {
  const auth = useRecoilValue(authState);
  const { appointments, isLoading, refreshAppointments, updateAppointment } = useAppointments();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<ViewType>('timeGridWeek');

  // Load appointments on mount
  useEffect(() => {
    refreshAppointments();
  }, [refreshAppointments]);

  // Convert appointments to calendar events
  const convertToCalendarEvents = useCallback((appointments: Appointment[]): CalendarEvent[] => {
    return appointments.map((apt) => {
      const [hours, minutes] = apt.time.split(':');
      const startDate = new Date(apt.date);
      startDate.setHours(parseInt(hours), parseInt(minutes));
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1);

      return {
        id: apt.id.toString(),
        title: `${apt.patientName} - ${apt.reason}`,
        start: startDate,
        end: endDate,
        resource: apt,
      };
    });
  }, []);

  // Update calendar events when appointments change
  useEffect(() => {
    const calendarEvents = convertToCalendarEvents(appointments);
    setEvents(calendarEvents);
  }, [appointments, convertToCalendarEvents]);

  const handleStatusUpdate = async (appointmentId: number, newStatus: 'confirmed' | 'cancelled' | 'pending') => {
    try {
      await updateAppointment(appointmentId, { status: newStatus });
      
      toast({
        title: 'Appointment Updated',
        description: `Appointment ${newStatus} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${newStatus} appointment`,
        variant: 'destructive',
      });
    }
  };

  const handleEventDrop = useCallback(async (info: any) => {
    if (!info.event.start) return;

    const newDate = moment(info.event.start).format('YYYY-MM-DD');
    const newTime = moment(info.event.start).format('HH:mm');
    const appointmentId = parseInt(info.event.id, 10);

    // Show loading state
    const loadingToast = toast({
      title: 'Rescheduling appointment...',
      description: 'Please wait while we update the appointment.',
    });

    try {
      await updateAppointment(appointmentId, { 
        date: newDate, 
        time: newTime 
      });

      // Refresh appointments to ensure we have latest state
      await refreshAppointments();

      toast({
        title: 'Appointment rescheduled',
        description: `Successfully moved to ${moment(info.event.start).format('MMMM Do, YYYY [at] h:mm A')}`,
      });
    } catch (error) {
      // Revert the drag if failed
      info.revert();
      console.error('Rescheduling failed:', error);
      
      toast({
        title: 'Rescheduling failed',
        description: 'Could not reschedule the appointment. Please try again.',
        variant: 'destructive',
      });
    }
  }, [updateAppointment, refreshAppointments, toast]);

  const toggleView = () => {
    setView((prev) => (prev === 'timeGridWeek' ? 'dayGridMonth' : 'timeGridWeek'));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <CardTitle>Appointment Calendar</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                Back to Dashboard
              </Button>
            )}
            <Button variant="outline" onClick={toggleView}>
              {view === 'dayGridMonth' ? 'Week View' : 'Month View'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: '600px' }} className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={view}
            events={events}
            editable={true}
            droppable={true}
            eventDrop={handleEventDrop}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            eventContent={(arg) => (
              <div>
                <b>{arg.timeText}</b>
                <i>{arg.event.title}</i>
              </div>
            )}
            eventClick={(info: EventClickArg) => {
              const appointment = info.event.extendedProps.resource;
              toast({
                title: `Appointment: ${appointment.patientName}`,
                description: (
                  <div>
                    <p>Reason: {appointment.reason}</p>
                    <p>Status: {appointment.status}</p>
                    {appointment.status === 'pending' && (
                      <div className="flex space-x-2 mt-4">
                        <Button onClick={() => handleStatusUpdate(appointment.id, 'confirmed')} size="sm">Approve</Button>
                        <Button size="sm" disabled>Reschedule</Button>
                        <Button onClick={() => handleStatusUpdate(appointment.id, 'cancelled')} size="sm" variant="destructive">Cancel</Button>
                      </div>
                    )}
                  </div>
                ),
              });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};