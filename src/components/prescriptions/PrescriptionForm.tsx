import { useState } from 'react';
import { useFormik } from 'formik';
import { motion } from 'framer-motion';
import { X, Plus, Save, Pill, FileText, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prescriptionSchema, PrescriptionFormData, Prescription } from '@/lib/validation/schemas';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { useAppointments } from '@/hooks/useAppointments';

interface PrescriptionFormProps {
  prescription?: Prescription;
  onClose: () => void;
  onSuccess?: () => void;
}

const commonMedicines = [
  'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Aspirin', 'Metformin', 
  'Lisinopril', 'Atorvastatin', 'Omeprazole', 'Ciprofloxacin', 'Doxycycline'
];

const commonDosages = [
  '250mg', '500mg', '1000mg', '2.5mg', '5mg', '10mg', '20mg', '50mg', '100mg'
];

const commonDurations = [
  '3 days', '5 days', '7 days', '10 days', '14 days', '21 days', '30 days', '3 months'
];

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  prescription,
  onClose,
  onSuccess,
}) => {
  const { createPrescription, updatePrescription, isLoading } = usePrescriptions();
  const { appointments } = useAppointments();
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [selectedDosage, setSelectedDosage] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState('');

  const isEditing = !!prescription;

  const formik = useFormik<PrescriptionFormData>({
    initialValues: {
      patientName: prescription?.patientName || '',
      appointmentId: prescription?.appointmentId || '',
      medicineName: prescription?.medicineName || '',
      dosage: prescription?.dosage || '',
      duration: prescription?.duration || '',
      notes: prescription?.notes || '',
    },
    validationSchema: prescriptionSchema,
    onSubmit: async (values) => {
      const success = isEditing
        ? await updatePrescription(prescription.id, values)
        : await createPrescription(values);
      
      if (success) {
        onSuccess?.();
        onClose();
      }
    },
  });

  const handleMedicineSelect = (medicine: string) => {
    formik.setFieldValue('medicineName', medicine);
    setSelectedMedicine(medicine);
  };

  const handleDosageSelect = (dosage: string) => {
    formik.setFieldValue('dosage', dosage);
    setSelectedDosage(dosage);
  };

  const handleDurationSelect = (duration: string) => {
    formik.setFieldValue('duration', duration);
    setSelectedDuration(duration);
  };

  const handleAppointmentSelect = (appointmentId: string) => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      formik.setFieldValue('appointmentId', appointmentId);
      formik.setFieldValue('patientName', appointment.patientName);
      setSelectedAppointment(appointmentId);
    }
  };

  // Filter appointments to only show confirmed ones
  const availableAppointments = appointments.filter(apt => apt.status === 'confirmed');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="shadow-card">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-primary" />
                  {isEditing ? 'Edit Prescription' : 'Create New Prescription'}
                </CardTitle>
                <CardDescription>
                  {isEditing ? 'Update prescription details' : 'Fill in the prescription information'}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={formik.handleSubmit} className="space-y-6">
              {/* Patient Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  Patient Information
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientName">Patient Name *</Label>
                    <Input
                      id="patientName"
                      type="text"
                      placeholder="Enter patient name"
                      value={formik.values.patientName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={formik.touched.patientName && formik.errors.patientName ? 'border-destructive' : ''}
                    />
                    {formik.touched.patientName && formik.errors.patientName && (
                      <p className="text-sm text-destructive">{formik.errors.patientName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appointmentId">Appointment ID (Optional)</Label>
                    <Input
                      id="appointmentId"
                      type="text"
                      placeholder="Enter appointment ID"
                      value={formik.values.appointmentId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </div>
                </div>
              </div>

              {/* Medicine Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Pill className="h-4 w-4" />
                  Medicine Information
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicineName">Medicine Name *</Label>
                  <Input
                    id="medicineName"
                    type="text"
                    placeholder="Enter medicine name"
                    value={formik.values.medicineName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={formik.touched.medicineName && formik.errors.medicineName ? 'border-destructive' : ''}
                  />
                  {formik.touched.medicineName && formik.errors.medicineName && (
                    <p className="text-sm text-destructive">{formik.errors.medicineName}</p>
                  )}
                  
                  {/* Quick Select Medicine */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {commonMedicines.map((medicine) => (
                      <Badge
                        key={medicine}
                        variant={selectedMedicine === medicine ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleMedicineSelect(medicine)}
                      >
                        {medicine}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dosage">Dosage *</Label>
                    <Input
                      id="dosage"
                      type="text"
                      placeholder="e.g., 500mg"
                      value={formik.values.dosage}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={formik.touched.dosage && formik.errors.dosage ? 'border-destructive' : ''}
                    />
                    {formik.touched.dosage && formik.errors.dosage && (
                      <p className="text-sm text-destructive">{formik.errors.dosage}</p>
                    )}
                    
                    {/* Quick Select Dosage */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {commonDosages.map((dosage) => (
                        <Badge
                          key={dosage}
                          variant={selectedDosage === dosage ? "default" : "outline"}
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                          onClick={() => handleDosageSelect(dosage)}
                        >
                          {dosage}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration *</Label>
                    <Input
                      id="duration"
                      type="text"
                      placeholder="e.g., 7 days"
                      value={formik.values.duration}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={formik.touched.duration && formik.errors.duration ? 'border-destructive' : ''}
                    />
                    {formik.touched.duration && formik.errors.duration && (
                      <p className="text-sm text-destructive">{formik.errors.duration}</p>
                    )}
                    
                    {/* Quick Select Duration */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {commonDurations.map((duration) => (
                        <Badge
                          key={duration}
                          variant={selectedDuration === duration ? "default" : "outline"}
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                          onClick={() => handleDurationSelect(duration)}
                        >
                          {duration}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Instructions & Notes
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Instructions/Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter special instructions, warnings, or notes for the patient..."
                    value={formik.values.notes}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditing ? 'Update Prescription' : 'Create Prescription'}
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
