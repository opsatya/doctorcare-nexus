// DoctorCare Nexus - Healthcare Management System
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { SignupPage } from "./pages/SignupPage";
import { LoginPage } from "./pages/LoginPage";
import { Dashboard } from "./pages/Dashboard";
import { DoctorListPage } from "./pages/DoctorListPage";
import { BookAppointmentPage } from "./pages/BookAppointmentPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { CalendarPage } from "./pages/CalendarPage";
import { PatientDashboard } from "./pages/PatientDashboard";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { WebSocketProvider } from "./lib/contexts/WebSocketContext";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WebSocketProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route 
            path="/doctors" 
            element={
              <ProtectedRoute>
                <DoctorListPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/book-appointment/:doctorId" 
            element={
              <ProtectedRoute>
                <BookAppointmentPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/appointments" 
            element={
              <ProtectedRoute>
                <AppointmentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient-dashboard" 
            element={
              <ProtectedRoute>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </WebSocketProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
