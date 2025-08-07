import { useState, useEffect, useCallback } from 'react';
import { Prescription, PrescriptionFormData } from '@/lib/validation/schemas';
import { useToast } from '@/hooks/use-toast';

interface PrescriptionsHookReturn {
  prescriptions: Prescription[];
  isLoading: boolean;
  error: string | null;
  createPrescription: (data: PrescriptionFormData) => Promise<boolean>;
  updatePrescription: (id: string, data: PrescriptionFormData) => Promise<boolean>;
  deletePrescription: (id: string) => Promise<boolean>;
  fetchPrescriptions: () => void;
  stats: {
    totalPrescriptions: number;
    prescriptionsToday: number;
    prescriptionsThisWeek: number;
  };
}

export const usePrescriptions = (): PrescriptionsHookReturn => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPrescriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/doctor/prescriptions');
      const data = await response.json();

      if (data.success) {
        setPrescriptions(data.prescriptions || []);
      } else {
        throw new Error(data.message || 'Failed to fetch prescriptions');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching prescriptions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPrescription = useCallback(async (data: PrescriptionFormData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/doctor/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Prescription created successfully',
        });
        fetchPrescriptions(); // Refresh the list
        return true;
      } else {
        throw new Error(result.message || 'Failed to create prescription');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchPrescriptions]);

  const updatePrescription = useCallback(async (id: string, data: PrescriptionFormData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/doctor/prescriptions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Prescription updated successfully',
        });
        fetchPrescriptions(); // Refresh the list
        return true;
      } else {
        throw new Error(result.message || 'Failed to update prescription');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchPrescriptions]);

  const deletePrescription = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/doctor/prescriptions/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Prescription deleted successfully',
        });
        fetchPrescriptions(); // Refresh the list
        return true;
      } else {
        throw new Error(result.message || 'Failed to delete prescription');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchPrescriptions]);

  // Calculate stats
  const stats = {
    totalPrescriptions: prescriptions.length,
    prescriptionsToday: prescriptions.filter(p => {
      const prescriptionDate = new Date(p.createdAt).toDateString();
      const today = new Date().toDateString();
      return prescriptionDate === today;
    }).length,
    prescriptionsThisWeek: prescriptions.filter(p => {
      const prescriptionDate = new Date(p.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return prescriptionDate >= weekAgo;
    }).length,
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  return {
    prescriptions,
    isLoading,
    error,
    createPrescription,
    updatePrescription,
    deletePrescription,
    fetchPrescriptions,
    stats,
  };
};
