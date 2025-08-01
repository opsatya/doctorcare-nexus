import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  User,
  LogOut, 
  Stethoscope,
  Bell,
  Plus,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { authState, clearAuthState } from '@/lib/recoil/atoms';
import { useWebSocket, WebSocketMessage } from '@/hooks/useWebSocket';

interface Appointment {
  id: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  reason: string;
}

export const PatientDashboard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const auth = useRecoilValue(authState);
  const setAuth = useSetRecoilState(authState);
  const navigate = useNavigate();
  const { toast } = useToast();

  // WebSocket for real-time updates
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'newAppointment':
        // Only add appointment if it's for this patient
        if (message.data.email === auth.patient?.email) {
          const newAppointment = {
            id: message.data.id,
            doctorName: message.data.doctorName,
            specialization: message.data.specialization,
            date: message.data.date,
            time: message.data.time,
            status: message.data.status,
            reason: message.data.reason
          };
          setAppointments(prev => [newAppointment, ...prev]);
        }
        break;
      case 'appointmentStatusUpdate':
        // Update appointment in the list if it belongs to this patient
        if (message.data.email === auth.patient?.email) {
          setAppointments(prev => 
            prev.map(apt => 
              apt.id === message.data.id 
                ? { ...apt, status: message.data.status }
                : apt
            )
          );
        }
        break;
    }
  };

  const { isConnected } = useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    if (auth.patient) {
      fetchPatientAppointments();
    }
  }, [auth.patient]);

  const fetchPatientAppointments = async () => {
    try {
      setIsLoading(true);
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiBase}/api/patients/${auth.patient?.id}/appointments`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      if (response.ok) {
        const appointmentsData = await response.json();
        setAppointments(appointmentsData);
      } else {
        // If endpoint doesn't exist, fall back to filtering all appointments
        const allAppointmentsResponse = await fetch(`${apiBase}/api/appointments`);
        const allAppointments = await allAppointmentsResponse.json();
        const patientAppointments = allAppointments.filter(
          (apt: any) => apt.email === auth.patient?.email
        );
        setAppointments(patientAppointments);
      }
    } catch (error) {
      toast({
        title: 'Error loading appointments',
        description: 'Could not load your appointments.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setAuth(clearAuthState());
    toast({
      title: 'Logged out',
      description: 'Goodbye!',
    });
    navigate('/');
  };

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">
                Doctor<span className="text-primary">Care</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className={`h-5 w-5 cursor-pointer hover:text-primary ${
                  isConnected ? 'text-green-500' : 'text-muted-foreground'
                }`} />
                {!isConnected && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">{auth.patient?.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {auth.patient?.name}
          </h1>
          <p className="text-muted-foreground">
            Manage your healthcare appointments and stay connected with your doctors.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/doctors')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Book Appointment</h3>
                  <p className="text-sm text-muted-foreground">Find and book with doctors</p>
                </div>
                <div className="flex items-center">
                  <Plus className="h-5 w-5 text-primary" />
                  <ChevronRight className="h-4 w-4 ml-1 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Total Appointments</h3>
                  <p className="text-2xl font-bold text-primary">{appointments.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Pending</h3>
                  <p className="text-2xl font-bold text-orange-600">
                    {appointments.filter(apt => apt.status === 'pending').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Your Appointments</CardTitle>
              <CardDescription>
                Your scheduled and upcoming appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">
                          {appointment.doctorName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {appointment.specialization} • {appointment.reason}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(appointment.date).toLocaleDateString('en-US')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.time}
                          </p>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No appointments scheduled yet.
                  </p>
                  <Button onClick={() => navigate('/doctors')} className="btn-hero">
                    Book Your First Appointment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};