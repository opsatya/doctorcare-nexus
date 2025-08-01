// DoctorCare Nexus - Healthcare Management System
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { SignupPage } from "./pages/SignupPage";
import { Dashboard } from "./pages/Dashboard";
import { DoctorListPage } from "./pages/DoctorListPage";
import { BookAppointmentPage } from "./pages/BookAppointmentPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { PatientDashboard } from "./pages/PatientDashboard";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/doctors" element={<DoctorListPage />} />
          <Route 
            path="/book-appointment/:doctorId" 
            element={
              <ProtectedRoute requiredRole="patient">
                <BookAppointmentPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requiredRole="doctor">
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient-dashboard" 
            element={
              <ProtectedRoute requiredRole="patient">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
