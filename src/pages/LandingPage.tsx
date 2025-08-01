import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { Header } from '@/components/layout/Header';
import { HeroSection } from '@/components/sections/HeroSection';
import { ServicesSection } from '@/components/sections/ServicesSection';
import { AboutSection } from '@/components/sections/AboutSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { PatientLoginModal } from '@/components/auth/PatientLoginModal';
import { authState } from '@/lib/recoil/atoms';
import { Instagram, Facebook, Youtube, Phone, Mail, MapPin } from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const auth = useRecoilValue(authState);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalType, setLoginModalType] = useState<'patient' | 'doctor'>('patient');

  // Redirect authenticated users to their respective dashboards
  useEffect(() => {
    if (auth.isAuthenticated) {
      if (auth.doctor) {
        navigate('/dashboard');
      } else if (auth.patient) {
        navigate('/patient-dashboard');
      }
    }
  }, [auth, navigate]);

  const handleLoginClick = () => {
    setLoginModalType('patient'); // Default to patient, can be switched in modal
    setIsLoginModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Header onLoginClick={handleLoginClick} />
      
      <main>
        <HeroSection onLoginClick={handleLoginClick} />
        <AboutSection />
        <ServicesSection />
        <TestimonialsSection />
        
        {/* Contact Section */}
        <section id="contact" className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Get in Touch
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Phone className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">WhatsApp</p>
                      <p className="text-muted-foreground">(+91) 99999-9999</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Mail className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">contato@doctorcare.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <MapPin className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-muted-foreground">
                        123 Health Street - Maharashtra Pune
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center lg:text-right space-y-4">
                <button
                  onClick={handleLoginClick}
                  className="btn-hero mb-4 w-full sm:w-auto"
                >
                  Get Started
                </button>
                <br />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="font-medium">DoctorCare</p>
              <p className="text-sm opacity-80">
                © 2025 DoctorCare. All rights reserved.
              </p>
            </div>
            
            <div className="flex space-x-4">
              <Instagram className="h-6 w-6 hover:text-primary transition-colors cursor-pointer" />
              <Facebook className="h-6 w-6 hover:text-primary transition-colors cursor-pointer" />
              <Youtube className="h-6 w-6 hover:text-primary transition-colors cursor-pointer" />
            </div>
          </div>
        </div>
      </footer>

      <PatientLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialLoginType={loginModalType}
      />
    </div>
  );
};