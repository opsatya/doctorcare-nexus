import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  LogOut, 
  User,
  Stethoscope,
  Bell,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { authState } from '@/lib/recoil/atoms';
import { useWebSocket, WebSocketMessage } from '@/hooks/useWebSocket';

interface Appointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  type: string;
}

interface Stats {
  totalPatients: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  pendingAppointments: number;
}

export const Dashboard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const auth = useRecoilValue(authState);
  const setAuth = useSetRecoilState(authState);
  const navigate = useNavigate();
  const { toast } = useToast();

  // WebSocket for real-time updates
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'newAppointment':
        // Only add appointment if it's for this doctor
        if (message.data.doctorId == auth.doctor?.id) {
          setAppointments(prev => [message.data, ...prev]);
          fetchDashboardData(); // Refresh stats
        }
        break;
      case 'appointmentStatusUpdate':
        // Update appointment in the list
        if (message.data.doctorId == auth.doctor?.id) {
          setAppointments(prev => 
            prev.map(apt => 
              apt.id === message.data.id 
                ? { ...apt, status: message.data.status }
                : apt
            )
          );
          fetchDashboardData(); // Refresh stats
        }
        break;
    }
  };

  const { isConnected } = useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch doctor's appointments
      const appointmentsResponse = await fetch(`${apiBase}/api/doctors/${auth.doctor?.id}/appointments`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        setAppointments(appointmentsData.map((apt: any) => ({
          id: apt.id,
          patientName: apt.patientName,
          date: apt.date,
          time: apt.time,
          status: apt.status,
          type: apt.reason || 'Consultation'
        })));

        // Calculate stats from appointments
        const today = new Date().toISOString().split('T')[0];
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const weekStart = startOfWeek.toISOString().split('T')[0];

        const appointmentsToday = appointmentsData.filter((apt: any) => apt.date === today).length;
        const appointmentsThisWeek = appointmentsData.filter((apt: any) => apt.date >= weekStart).length;
        const pendingAppointments = appointmentsData.filter((apt: any) => apt.status === 'pending').length;

        setStats({
          totalPatients: new Set(appointmentsData.map((apt: any) => apt.email)).size,
          appointmentsToday,
          appointmentsThisWeek,
          pendingAppointments
        });
      } else {
        // Fallback to filtering all appointments if endpoint doesn't exist
        const allAppointmentsResponse = await fetch(`${apiBase}/api/appointments`);
        const allAppointments = await allAppointmentsResponse.json();
        const doctorAppointments = allAppointments.filter((apt: any) => apt.doctorId == auth.doctor?.id);
        
        setAppointments(doctorAppointments.map((apt: any) => ({
          id: apt.id,
          patientName: apt.patientName,
          date: apt.date,
          time: apt.time,
          status: apt.status,
          type: apt.reason || 'Consultation'
        })));

        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const weekStart = startOfWeek.toISOString().split('T')[0];

        const appointmentsToday = doctorAppointments.filter((apt: any) => apt.date === today).length;
        const appointmentsThisWeek = doctorAppointments.filter((apt: any) => apt.date >= weekStart).length;
        const pendingAppointments = doctorAppointments.filter((apt: any) => apt.status === 'pending').length;

        setStats({
          totalPatients: new Set(doctorAppointments.map((apt: any) => apt.email)).size,
          appointmentsToday,
          appointmentsThisWeek,
          pendingAppointments
        });
      }
    } catch (error) {
      toast({
        title: 'Error loading data',
        description: 'Could not load dashboard data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear localStorage based on user type
    localStorage.removeItem('doctorcare_auth');
    localStorage.removeItem('doctorcare_patient_auth');
    
    setAuth({
      isAuthenticated: false,
      doctor: null,
      patient: null,
      token: null,
    });
    
    toast({
      title: 'Logged out',
      description: 'Goodbye!',
    });
    
    navigate('/');
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'confirmed' | 'cancelled') => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ status: action }),
      });

      if (response.ok) {
        toast({
          title: 'Appointment Updated',
          description: `Appointment ${action === 'confirmed' ? 'confirmed' : 'cancelled'} successfully.`,
        });
      } else {
        throw new Error('Failed to update appointment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update appointment status.',
        variant: 'destructive',
      });
    }
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
                <span className="text-sm font-medium">{auth.doctor?.name}</span>
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
            Welcome, {auth.doctor?.name}
          </h1>
          <p className="text-muted-foreground">
            Here's a summary of your activities for today.
          </p>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPatients}</div>
                <p className="text-xs text-muted-foreground">
                  Registered patients
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.appointmentsToday}</div>
                <p className="text-xs text-muted-foreground">
                  Scheduled for today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.appointmentsThisWeek}</div>
                <p className="text-xs text-muted-foreground">
                  Scheduled appointments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting confirmation
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>
                Your scheduled appointments for the coming days
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
                          {appointment.patientName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {appointment.type}
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
                        <div className="flex items-center space-x-2">
                          {appointment.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleAppointmentAction(appointment.id, 'confirmed')}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleAppointmentAction(appointment.id, 'cancelled')}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Decline
                              </Button>
                            </>
                          )}
                          {getStatusBadge(appointment.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No appointments scheduled at the moment.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};