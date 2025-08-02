import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecoilValue } from 'recoil';
import { authState } from '@/lib/recoil/atoms';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onLoginClick?: () => void;
}

export const Header = ({ onLoginClick }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const auth = useRecoilValue(authState);
  const navigate = useNavigate();

const menuItems = auth.isAuthenticated ? [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Testimonials', href: '#testimonials' },
    auth.doctor ? { label: 'Dashboard', href: '/dashboard' } : { label: 'Patient Dashboard', href: '/patient-dashboard' },
  ] : [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Testimonials', href: '#testimonials' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Stethoscope className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">
              Doctor<span className="text-primary">Care</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
                onClick={(e) => {
                  if (item.href.startsWith('#')) {
                    e.preventDefault();
                    document.querySelector(item.href)?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.location.href = item.href;
                  }
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA Button - Desktop */}
          <div className="hidden md:block">
            {!auth.isAuthenticated ? (
              <Button
                onClick={onLoginClick}
                className="btn-hero"
              >
                Login / Sign Up
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (auth.doctor) {
                    navigate('/dashboard');
                  } else if (auth.patient) {
                    navigate('/patient-dashboard');
                  }
                }}
                className="btn-hero"
              >
                Dashboard
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border"
          >
            <nav className="py-4 space-y-4">
              {menuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
                  onClick={(e) => {
                    setIsMenuOpen(false);
                    if (item.href.startsWith('#')) {
                      e.preventDefault();
                      setTimeout(() => {
                        document.querySelector(item.href)?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    } else {
                      window.location.href = item.href;
                    }
                  }}
                >
                  {item.label}
                </a>
              ))}
              {!auth.isAuthenticated ? (
                <Button
                  onClick={() => {
                    onLoginClick?.();
                    setIsMenuOpen(false);
                  }}
                  className="btn-hero w-full mt-4"
                >
                  Login / Sign Up
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (auth.doctor) {
                      navigate('/dashboard');
                    } else if (auth.patient) {
                      navigate('/patient-dashboard');
                    }
                    setIsMenuOpen(false);
                  }}
                  className="btn-hero w-full mt-4"
                >
                  Dashboard
                </Button>
              )}
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
};