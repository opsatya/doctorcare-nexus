import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import { useRecoilValue } from 'recoil';
import { authState } from '@/lib/recoil/atoms';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calendar as CalendarIcon, Clock, User, X, Download } from 'lucide-react';

// Import calendar styles
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

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

export const DoctorCalendar: React.FC<DoctorCalendarProps> = ({ onBack }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [pendingMove, setPendingMove] = useState<any>(null);
  const [view, setView] = useState<keyof typeof Views>('week');

  const auth = useRecoilValue(authState);
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      // Ensure there's no trailing slash in the base URL
      const apiBase = (import.meta.env.VITE_API_URL || 'http://0.0.0.0:3001').replace(/\/+$/, '');
      
      const response = await fetch(`${apiBase}/doctors/${auth.doctor?.id}/appointments`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      let appointmentsData = [];
      if (response.ok) {
        appointmentsData = await response.json();
      } else {
        // Fallback to all appointments
        const allResponse = await fetch(`${apiBase}/appointments`);
        const allAppointments = await allResponse.json();
        appointmentsData = allAppointments.filter((apt: any) => apt.doctorId == auth.doctor?.id);
      }

      // Convert appointments to calendar events
      const calendarEvents: CalendarEvent[] = appointmentsData.map((apt: any) => {
        const [hours, minutes] = apt.time.split(':');
        const startDate = new Date(apt.date);
        startDate.setHours(parseInt(hours), parseInt(minutes));
        
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 1); // Default 1-hour appointments

        return {
          id: apt.id.toString(),
          title: `${apt.patientName} - ${apt.reason}`,
          start: startDate,
          end: endDate,
          resource: {
            id: apt.id.toString(),
            patientName: apt.patientName,
            email: apt.email,
            phone: apt.phone,
            reason: apt.reason,
            status: apt.status,
            doctorId: apt.doctorId,
            time: apt.time,
            date: apt.date,
          },
        };
      });

      setEvents(calendarEvents);
    } catch (error) {
      toast({
        title: 'Error loading appointments',
        description: 'Could not load calendar data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventDrop = useCallback(
    ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
      setPendingMove({ event, start, end });
      setShowRescheduleDialog(true);
    },
    []
  );

  const confirmReschedule = async () => {
    if (!pendingMove) return;

    try {
      const { event, start } = pendingMove;
      const newDate = moment(start).format('YYYY-MM-DD');
      const newTime = moment(start).format('HH:mm');

      const apiBase = (import.meta.env.VITE_API_URL || 'http://0.0.0.0:3001').replace(/\/+$/, '');
      
      const response = await fetch(`${apiBase}/appointments/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          date: newDate,
          time: newTime,
        }),
      });

      if (response.ok) {
        // Update local state
        setEvents(prev =>
          prev.map(e =>
            e.id === event.id
              ? {
                  ...e,
                  start: pendingMove.start,
                  end: pendingMove.end,
                  resource: {
                    ...e.resource,
                    date: newDate,
                    time: newTime,
                  },
                }
              : e
          )
        );

        toast({
          title: 'Appointment rescheduled',
          description: `Moved to ${moment(start).format('MMMM Do, YYYY [at] h:mm A')}`,
        });
      } else {
        toast({
          title: 'Failed to reschedule',
          description: 'Could not update the appointment.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reschedule appointment.',
        variant: 'destructive',
      });
    } finally {
      setShowRescheduleDialog(false);
      setPendingMove(null);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedEvent) return;

    try {
      const apiBase = (import.meta.env.VITE_API_URL || 'http://0.0.0.0:3001').replace(/\/+$/, '');
      
      const response = await fetch(`${apiBase}/appointments/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          status: 'cancelled',
        }),
      });

      if (response.ok) {
        // Update local state
        setEvents(prev =>
          prev.map(e =>
            e.id === selectedEvent.id
              ? {
                  ...e,
                  resource: { ...e.resource, status: 'cancelled' as const },
                }
              : e
          )
        );

        toast({
          title: 'Appointment cancelled',
          description: `Appointment with ${selectedEvent.resource.patientName} has been cancelled.`,
        });
      } else {
        toast({
          title: 'Failed to cancel',
          description: 'Could not cancel the appointment.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel appointment.',
        variant: 'destructive',
      });
    } finally {
      setShowCancelDialog(false);
      setSelectedEvent(null);
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const { status } = event.resource;
    
    let backgroundColor = 'hsl(var(--primary))';
    if (status === 'pending') backgroundColor = 'hsl(var(--secondary))';
    if (status === 'cancelled') backgroundColor = 'hsl(var(--muted))';

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: status === 'cancelled' ? 0.6 : 1,
        color: 'white',
        border: 'none',
        display: 'block',
      },
    };
  };

  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-between w-full">
            <span className="truncate">{event.title}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEvent(event);
                setShowCancelDialog(true);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="p-2">
            <p className="font-semibold">{event.resource.patientName}</p>
            <p className="text-sm">{event.resource.reason}</p>
            <p className="text-sm">{event.resource.email}</p>
            <p className="text-sm">{event.resource.phone}</p>
            <Badge variant={event.resource.status === 'confirmed' ? 'default' : 'secondary'}>
              {event.resource.status}
            </Badge>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const generateICS = (event: CalendarEvent) => {
    const start = moment(event.start).format('YYYYMMDDTHHmmss');
    const end = moment(event.end).format('YYYYMMDDTHHmmss');
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DoctorCare//EN
BEGIN:VEVENT
UID:${event.id}@doctorcare.com
DTSTAMP:${moment().format('YYYYMMDDTHHmmss')}
DTSTART:${start}
DTEND:${end}
SUMMARY:${event.title}
DESCRIPTION:Patient: ${event.resource.patientName}\\nReason: ${event.resource.reason}\\nPhone: ${event.resource.phone}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appointment-${event.resource.patientName}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
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
              <Button
                variant="outline"
                onClick={() => setView(view === 'month' ? 'week' : 'month')}
              >
                {view === 'month' ? 'Week View' : 'Month View'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ height: '600px' }} className="calendar-container">
            <DragAndDropCalendar
              localizer={localizer}
              events={events}
              onEventDrop={handleEventDrop}
              onSelectEvent={(event) => {
                setSelectedEvent(event);
              }}
              view={view}
              onView={setView}
              eventPropGetter={eventStyleGetter}
              components={{
                event: EventComponent,
              }}
              step={30}
              showMultiDayTimes
              defaultDate={new Date()}
              style={{ height: '100%' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reschedule Confirmation Dialog */}
      <AlertDialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Reschedule</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingMove && (
                <>
                  Are you sure you want to reschedule this appointment to{' '}
                  <strong>{moment(pendingMove.start).format('MMMM Do, YYYY [at] h:mm A')}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowRescheduleDialog(false);
              setPendingMove(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmReschedule}>
              Confirm Reschedule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedEvent && (
                <>
                  Are you sure you want to cancel the appointment with{' '}
                  <strong>{selectedEvent.resource.patientName}</strong> on{' '}
                  <strong>{moment(selectedEvent.start).format('MMMM Do, YYYY [at] h:mm A')}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowCancelDialog(false);
              setSelectedEvent(null);
            }}>
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

      {/* Event Details Modal */}
      {selectedEvent && !showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 max-w-sm mx-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Appointment Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEvent(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedEvent.resource.patientName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{moment(selectedEvent.start).format('MMMM Do, YYYY [at] h:mm A')}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Reason:</strong> {selectedEvent.resource.reason}</p>
                  <p><strong>Email:</strong> {selectedEvent.resource.email}</p>
                  <p><strong>Phone:</strong> {selectedEvent.resource.phone}</p>
                </div>
                <Badge variant={selectedEvent.resource.status === 'confirmed' ? 'default' : 'secondary'}>
                  {selectedEvent.resource.status}
                </Badge>
              </div>
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => generateICS(selectedEvent)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setShowCancelDialog(true);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DndProvider>
  );
};