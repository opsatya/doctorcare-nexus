import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState, useRecoilState } from 'recoil';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  LogOut, 
  User,
  Stethoscope,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { authState, doctorAppointmentsState, DoctorAppointment } from '@/lib/recoil/atoms';
import { fetchDoctorAppointments } from '@/lib/services/appointmentService';
import { useWebSocketContext, WebSocketMessage } from '@/lib/contexts/WebSocketContext';

interface Stats {
  totalPatients: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  pendingAppointments: number;
}

export const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const auth = useRecoilValue(authState);
  const setAuth = useSetRecoilState(authState);
  const [appointments, setAppointments] = useRecoilState(doctorAppointmentsState);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Compute stats dynamically based on appointments array
  const computedStats = useMemo(() => {
    if (appointments.length === 0) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const weekStart = startOfWeek.toISOString().split('T')[0];

    const appointmentsToday = appointments.filter(apt => apt.date === today).length;
    const appointmentsThisWeek = appointments.filter(apt => apt.date >= weekStart).length;
    const pendingAppointments = appointments.filter(apt => apt.status === 'pending').length;

    return {
      totalPatients: new Set(appointments.map(apt => apt.email)).size,
      appointmentsToday,
      appointmentsThisWeek,
      pendingAppointments
    };
  }, [appointments]);

  // Update stats when computed stats change
  useEffect(() => {
    if (computedStats) {
      console.log('Updating stats based on appointments:', computedStats);
      setStats(computedStats);
    }
  }, [computedStats]);

  const { addMessageListener } = useWebSocketContext();

  // Refresh appointments using shared service and update Recoil state
  const fetchDashboardData = useCallback(async () => {
    if (!auth.doctor?.id || !auth.token) {
      console.log('Cannot fetch dashboard data: missing doctor ID or token');
      return;
    }
    
    try {
      console.log('Fetching dashboard data for doctor:', auth.doctor.id);
      setIsLoading(true);
      
      const freshAppointments = await fetchDoctorAppointments(auth.doctor.id, auth.token);
      console.log('Fresh appointments fetched:', freshAppointments);
      
      setAppointments(freshAppointments);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error loading appointments',
        description: 'Could not load dashboard data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [auth.doctor?.id, auth.token, setAppointments, toast]);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    console.log('Dashboard received WebSocket message:', message);
    switch (message.type) {
      case 'appointment_created':
      case 'appointment_updated':
        console.log('Refreshing dashboard data due to appointment change:', message);
        // Refresh appointments when changes occur
        fetchDashboardData();
        toast({
          title: 'Appointment Updated',
          description: `Appointment has been ${message.type === 'appointment_created' ? 'created' : 'updated'}.`,
        });
        break;
      default:
        console.log('Unhandled WebSocket message type:', message.type);
    }
  }, [fetchDashboardData, toast]);

  // Subscribe to WebSocket messages
  useEffect(() => {
    const unsubscribe = addMessageListener(handleWebSocketMessage);
    return unsubscribe;
  }, [addMessageListener, handleWebSocketMessage]);

  useEffect(() => {
    fetchDashboardData(); // Initial fetch only
  }, [fetchDashboardData]);

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/calendar')}
                className="flex items-center space-x-2"
              >
                <Calendar className="h-4 w-4" />
                <span>Calendar View</span>
              </Button>
              <Bell className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary" />
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
                          {appointment.reason}
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