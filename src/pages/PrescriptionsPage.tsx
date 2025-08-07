import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { motion } from 'framer-motion';
import {
  Plus,
  LogOut,
  User,
  Stethoscope,
  Bell,
  Calendar,
  Pill,
  TrendingUp,
  Users,
  Clock,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { authState } from '@/lib/recoil/atoms';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { PrescriptionForm } from '@/components/prescriptions/PrescriptionForm';
import { PrescriptionList } from '@/components/prescriptions/PrescriptionList';
import { PrescriptionDetailView } from '@/components/prescriptions/PrescriptionDetailView';
import { Prescription } from '@/lib/validation/schemas';

export const PrescriptionsPage = () => {
  const auth = useRecoilValue(authState);
  const setAuth = useSetRecoilState(authState);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { prescriptions, isLoading, fetchPrescriptions, stats } = usePrescriptions();
  
  const [showForm, setShowForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);

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

  const handleCreateNew = () => {
    setEditingPrescription(null);
    setShowForm(true);
  };

  const handleEdit = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setShowForm(true);
  };

  const handleView = (prescription: Prescription) => {
    setViewingPrescription(prescription);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPrescription(null);
  };

  const handleDetailViewClose = () => {
    setViewingPrescription(null);
  };

  const handleDetailViewEdit = (prescription: Prescription) => {
    setViewingPrescription(null);
    setEditingPrescription(prescription);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    fetchPrescriptions();
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
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <Calendar className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchPrescriptions()}
                className="flex items-center space-x-2"
                disabled={isLoading}
              >
                <Bell className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Pill className="h-8 w-8 text-primary" />
                Prescription Management
              </h1>
              <p className="text-muted-foreground">
                Create, manage, and track prescriptions for your patients.
              </p>
            </div>
            <Button
              onClick={handleCreateNew}
              className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span>New Prescription</span>
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPrescriptions}</div>
              <p className="text-xs text-muted-foreground">
                All prescriptions created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Prescriptions</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.prescriptionsToday}</div>
              <p className="text-xs text-muted-foreground">
                Created today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.prescriptionsThisWeek}</div>
              <p className="text-xs text-muted-foreground">
                Created this week
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Prescriptions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <PrescriptionList
            prescriptions={prescriptions}
            isLoading={isLoading}
            onEdit={handleEdit}
            onView={handleView}
          />
        </motion.div>
      </main>

      {/* Prescription Form Modal */}
      {showForm && (
        <PrescriptionForm
          prescription={editingPrescription || undefined}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Prescription Detail View Modal */}
      {viewingPrescription && (
        <PrescriptionDetailView
          prescription={viewingPrescription}
          onClose={handleDetailViewClose}
          onEdit={handleDetailViewEdit}
        />
      )}
    </div>
  );
};
