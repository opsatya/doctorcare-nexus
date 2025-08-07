import React from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Pill, 
  User, 
  Calendar,
  Clock,
  FileText,
  Stethoscope,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Prescription } from '@/lib/validation/schemas';

interface PrescriptionDetailViewProps {
  prescription: Prescription;
  onClose: () => void;
  onEdit?: (prescription: Prescription) => void;
}

export const PrescriptionDetailView: React.FC<PrescriptionDetailViewProps> = ({
  prescription,
  onClose,
  onEdit,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="shadow-card">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-primary" />
                  Prescription Details
                </CardTitle>
                <CardDescription>
                  View detailed prescription information
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(prescription)}
                  >
                    Edit
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Patient Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Patient Information
              </div>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Patient Name</span>
                  <span className="text-foreground">{prescription.patientName}</span>
                </div>
                {prescription.appointmentId && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Appointment ID</span>
                    <Badge variant="secondary" className="font-mono">
                      #{prescription.appointmentId}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Medicine Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Pill className="h-4 w-4" />
                Prescription Details
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="text-center">
                    <h3 className="font-semibold text-lg text-primary">{prescription.medicineName}</h3>
                    <p className="text-sm text-muted-foreground">Medicine Name</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-center">
                      <p className="font-medium text-foreground">{prescription.dosage}</p>
                      <p className="text-xs text-muted-foreground">Dosage</p>
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <p className="font-medium text-foreground">{prescription.duration}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Doctor Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Stethoscope className="h-4 w-4" />
                Prescribed By
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Doctor</span>
                  <span className="text-foreground">{prescription.doctorName}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Instructions and Notes */}
            {prescription.notes && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Instructions & Notes
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-800 font-medium text-sm">Important Instructions</p>
                        <p className="text-amber-700 text-sm mt-1">{prescription.notes}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Prescription Metadata */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Prescription Information
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-center">
                    <p className="font-medium text-foreground">{formatDate(prescription.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">Date Prescribed</p>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-center">
                    <p className="font-medium text-foreground">{formatTime(prescription.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">Time Prescribed</p>
                  </div>
                </div>
              </div>
              {prescription.updatedAt && prescription.updatedAt !== prescription.createdAt && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-center">
                    <p className="font-medium text-blue-800">Last Updated</p>
                    <p className="text-sm text-blue-600">
                      {formatDate(prescription.updatedAt)} at {formatTime(prescription.updatedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
              {onEdit && (
                <Button
                  onClick={() => onEdit(prescription)}
                  className="flex-1 sm:flex-none"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Edit Prescription
                </Button>
              )}
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 sm:flex-none"
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
