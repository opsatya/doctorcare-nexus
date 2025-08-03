import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DoctorCalendar } from '@/components/calendar/DoctorCalendar';

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <DoctorCalendar onBack={() => navigate('/dashboard')} />
      </div>
    </div>
  );
};