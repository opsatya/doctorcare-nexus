import React, { useState } from 'react';
import { 
  MoreHorizontal, 
  Check, 
  X, 
  Calendar,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Appointment } from '@/lib/recoil/atoms';

interface AppointmentActionsProps {
  appointment: Appointment;
  onUpdate: (appointmentId: string, updates: Partial<Appointment>) => Promise<void>;
}

export const AppointmentActions: React.FC<AppointmentActionsProps> = ({
  appointment,
  onUpdate,
}) => {
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleConfirm = async () => {
    await onUpdate(appointment.id, { status: 'confirmed' });
  };

  const handleCancel = async () => {
    await onUpdate(appointment.id, { status: 'cancelled' });
  };

  const handleReschedule = async () => {
    if (selectedDate) {
      const newDate = selectedDate.toISOString().split('T')[0];
      await onUpdate(appointment.id, { date: newDate });
      setIsRescheduleOpen(false);
      setSelectedDate(undefined);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {getStatusBadge(appointment.status)}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {appointment.status !== 'confirmed' && (
            <DropdownMenuItem onClick={handleConfirm}>
              <Check className="mr-2 h-4 w-4" />
              Confirm
            </DropdownMenuItem>
          )}
          {appointment.status !== 'cancelled' && (
            <DropdownMenuItem onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </DropdownMenuItem>
          )}
          <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Calendar className="mr-2 h-4 w-4" />
                Reschedule
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reschedule Appointment</DialogTitle>
                <DialogDescription>
                  Select a new date for the appointment with {appointment.patientName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsRescheduleOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReschedule}
                    disabled={!selectedDate}
                  >
                    Reschedule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};