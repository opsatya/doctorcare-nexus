import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import { EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useRecoilValue, useRecoilState } from 'recoil';
import { authState, doctorAppointmentsState, DoctorAppointment } from '@/lib/recoil/atoms';
import { fetchDoctorAppointments, updateAppointment } from '@/lib/services/appointmentService';
import { useToast } from '@/hooks/use-toast';
import { useWebSocketContext } from '@/lib/contexts/WebSocketContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  CalendarIcon,
  X,
  Download,
  MoreVertical,
  Check,
} from 'lucide-react';
import moment from 'moment';

// Types
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    id: string;
    patientName: string;
    email: string;
    phone: string;
    reason: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    doctorId: string;
    time: string;
    date: string;
  };
}

interface DoctorCalendarProps {
  onBack?: () => void;
}

type ViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

export const DoctorCalendar: React.FC<DoctorCalendarProps> = ({ onBack }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    event: any;
    start: Date;
    end: Date;
    newDate: string;
    newTime: string;
  } | null>(null);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [view, setView] = useState<ViewType>('timeGridWeek');

  const auth = useRecoilValue(authState);
  const [appointments, setAppointments] = useRecoilState(doctorAppointmentsState);
  const { toast } = useToast();

  // Refresh appointments using shared service and update Recoil state
  const refreshAppointments = useCallback(async () => {
    if (!auth.doctor?.id || !auth.token) return;
    
    try {
      setIsLoading(true);
      const freshAppointments = await fetchDoctorAppointments(auth.doctor.id, auth.token);
      setAppointments(freshAppointments);
    } catch (error) {
      toast({
        title: 'Error loading appointments',
        description: 'Could not load calendar data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [auth.doctor?.id, auth.token, setAppointments, toast]);

  // Convert appointments to calendar events
  const convertToCalendarEvents = useCallback((appointments: DoctorAppointment[]): CalendarEvent[] => {
    return appointments.map((apt) => {
      const [hours, minutes] = apt.time.split(':');
      const startDate = new Date(apt.date);
      startDate.setHours(parseInt(hours), parseInt(minutes));
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1); // 1-hour appointments

      return {
        id: apt.id,
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

  // Initial load of appointments
  useEffect(() => {
    refreshAppointments();
  }, [refreshAppointments]);

  // Handle drag and drop reschedule with confirmation dialog
  const handleEventDrop = useCallback((info: any) => {
    if (!info.event.start || !info.event.end) return;

    const newDate = moment(info.event.start).format('YYYY-MM-DD');
    const newTime = moment(info.event.start).format('HH:mm');

    setPendingMove({ 
      event: info.event, 
      start: info.event.start, 
      end: info.event.end, 
      newDate, 
      newTime
    });
    setShowRescheduleDialog(true);
  }, []);

  // Confirm reschedule update to backend and update UI optimistically
  const confirmReschedule = async () => {
    if (!pendingMove) return;
    const { event, newDate, newTime, start, end } = pendingMove;

    setShowRescheduleDialog(false);
    setPendingMove(null);

    try {
      const apiBase = (import.meta.env.VITE_API_URL || 'http://0.0.0.0:3001').replace(/\/+$/, '');
      const fullApiBase = apiBase.includes('/api') ? apiBase : `${apiBase}/api`;

      // Optimistically update UI
      setEvents(prev =>
        prev.map(e =>
          e.id === event.id ? { ...e, start, end, resource: { ...e.resource, date: newDate, time: newTime, status: 'pending' } } : e
        )
      );

      const response = await fetch(`${fullApiBase}/appointments/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          date: newDate,
          time: newTime,
          status: 'pending', // set to pending on reschedule
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      toast({
        title: 'Appointment rescheduled',
        description: `Moved to ${moment(start).format('MMMM Do, YYYY [at] h:mm A')}`,
      });

      // Optionally re-fetch full data to sync
      refreshAppointments();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reschedule appointment.',
        variant: 'destructive',
      });
      // Revert local change by refetching
      refreshAppointments();
    }
  };

  // Cancel appointment, update status and UI optimistically
  const handleCancelAppointment = async () => {
    if (!selectedEvent) return;
    setShowCancelDialog(false);

    try {
      const apiBase = (import.meta.env.VITE_API_URL || 'http://0.0.0.0:3001').replace(/\/+$/, '');
      const fullApiBase = apiBase.includes('/api') ? apiBase : `${apiBase}/api`;

      // Optimistic UI update
      setEvents(prev =>
        prev.map(e =>
          e.id === selectedEvent.id ? { ...e, resource: { ...e.resource, status: 'cancelled' } } : e
        )
      );

      const response = await fetch(`${fullApiBase}/appointments/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) throw new Error('Failed to cancel');

      toast({
        title: 'Appointment cancelled',
        description: `Appointment with ${selectedEvent.resource.patientName} cancelled.`,
      });

      setSelectedEvent(null);
      refreshAppointments();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel appointment.',
        variant: 'destructive',
      });
      refreshAppointments(); // rollback UI
    }
  };

  // Event click selects event for showing a dropdown of actions (confirm, cancel, reschedule)
  const handleEventClick = (info: EventClickArg) => {
    const eventData = events.find(e => e.id === info.event.id);
    if (eventData) {
      setSelectedEvent(eventData);
    }
  };

  // Confirm appointment: update status to confirmed
  const handleConfirmAppointment = async () => {
    if (!selectedEvent) return;

    try {
      const apiBase = (import.meta.env.VITE_API_URL || 'http://0.0.0.0:3001').replace(/\/+$/, '');
      const fullApiBase = apiBase.includes('/api') ? apiBase : `${apiBase}/api`;

      // Optimistic UI update
      setEvents(prev =>
        prev.map(e =>
          e.id === selectedEvent.id ? { ...e, resource: { ...e.resource, status: 'confirmed' } } : e
        )
      );

      const response = await fetch(`${fullApiBase}/appointments/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      if (!response.ok) throw new Error('Failed to confirm appointment');

      toast({
        title: 'Appointment confirmed',
        description: `Appointment with ${selectedEvent.resource.patientName} confirmed.`,
      });

      setSelectedEvent(null);
      refreshAppointments();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to confirm appointment.',
        variant: 'destructive',
      });
      refreshAppointments();
    }
  };

  // Generate ICS calendar file for export (unchanged)
  const generateICS = (event: CalendarEvent) => {
    // (unchanged; your existing ICS export works fine)
  };

  // Toggle calendar view monthly/weekly
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
    <TooltipProvider>
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
              eventClick={handleEventClick}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              eventContent={(eventInfo) => {
                const event = events.find((e) => e.id === eventInfo.event.id);
                if (!event) return null;

                // Render event title and dropdown menu inline
                return (
                  <div className="flex items-center justify-between w-full p-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate text-xs cursor-default">{eventInfo.event.title}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="p-2 text-xs">
                          <div><strong>Patient:</strong> {event.resource.patientName}</div>
                          <div><strong>Reason:</strong> {event.resource.reason}</div>
                          <div><strong>Email:</strong> {event.resource.email}</div>
                          <div><strong>Phone:</strong> {event.resource.phone}</div>
                          <Badge variant={event.resource.status === 'confirmed' ? 'default' : 'secondary'}>
                            Status: {event.resource.status}
                          </Badge>
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-1">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {event.resource.status !== 'confirmed' && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedEvent(event);
                              handleConfirmAppointment();
                            }}
                          >
                            <Check className="mr-2 h-4 w-4" /> Confirm
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowCancelDialog(true);
                          }}
                        >
                          <X className="mr-2 h-4 w-4" /> Cancel
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedEvent(event);
                            setPendingMove({
                              event: events.find((e) => e.id === event.id)?.resource || event,
                              start: event.start,
                              end: event.end,
                              newDate: moment(event.start).format('YYYY-MM-DD'),
                              newTime: moment(event.start).format('HH:mm'),
                            });
                            setShowRescheduleDialog(true);
                          }}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" /> Reschedule
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              }}
              eventClassNames={(eventInfo) => {
                const event = events.find((e) => e.id === eventInfo.event.id);
                if (!event) return [];

                const { status } = event.resource;
                const classes = ['custom-event'];
                if (status === 'pending') classes.push('event-pending');
                if (status === 'cancelled') classes.push('event-cancelled');
                if (status === 'confirmed') classes.push('event-confirmed');

                return classes;
              }}
            />
          </div>
        </CardContent>

        {/* Cancel Appointment Dialog */}
        <AlertDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel the appointment with{' '}
                <strong>{selectedEvent?.resource.patientName}</strong> on{' '}
                <strong>{selectedEvent ? moment(selectedEvent.start).format('MMMM Do, YYYY [at] h:mm A') : ''}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowCancelDialog(false)}>
                Keep Appointment
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelAppointment}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Cancel Appointment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reschedule Confirmation Dialog */}
        <AlertDialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Reschedule</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingMove && (
                  <>
                    Are you sure you want to reschedule the appointment to{' '}
                    <strong>{moment(pendingMove.start).format('MMMM Do, YYYY [at] h:mm A')}</strong>?
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setShowRescheduleDialog(false);
                  setPendingMove(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmReschedule}>
                Confirm Reschedule
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </TooltipProvider>
  );
};
