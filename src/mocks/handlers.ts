import { http, HttpResponse } from 'msw';

export const handlers = [
  // Doctors API
  http.get('http://localhost:3001/api/doctors', async () => {
    console.log('🔧 MSW: Handling GET /api/doctors');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return HttpResponse.json([
      {
        id: 1,
        name: "Dr. Sarah Johnson",
        specialization: "Cardiology",
        experience: 15,
        rating: 4.9,
        location: "Delhi, India",
        consultationFee: 1200,
        nextAvailable: "Today 3 PM"
      },
      {
        id: 2,
        name: "Dr. Michael Chen",
        specialization: "Pediatrics",
        experience: 10,
        rating: 4.8,
        location: "Mumbai, India",
        consultationFee: 800,
        nextAvailable: "Tomorrow"
      },
      {
        id: 3,
        name: "Dr. Emily Rodriguez",
        specialization: "Mental Health",
        experience: 12,
        rating: 4.9,
        location: "Bangalore, India",
        consultationFee: 1000,
        nextAvailable: "Today 5 PM"
      }
    ]);
  }),

  http.get('http://localhost:3001/api/doctors/:id', async ({ params }) => {
    console.log('🔧 MSW: Handling GET /api/doctors/:id', params.id);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const doctors = [
      {
        id: 1,
        name: "Dr. Sarah Johnson",
        specialization: "Cardiology",
        experience: 15,
        rating: 4.9,
        location: "Delhi, India",
        consultationFee: 1200,
        nextAvailable: "Today 3 PM",
        about: "Experienced cardiologist with expertise in preventive care and advanced cardiac procedures."
      },
      {
        id: 2,
        name: "Dr. Michael Chen",
        specialization: "Pediatrics",
        experience: 10,
        rating: 4.8,
        location: "Mumbai, India",
        consultationFee: 800,
        nextAvailable: "Tomorrow",
        about: "Pediatric specialist focused on child development and family-centered care."
      },
      {
        id: 3,
        name: "Dr. Emily Rodriguez",
        specialization: "Mental Health",
        experience: 12,
        rating: 4.9,
        location: "Bangalore, India",
        consultationFee: 1000,
        nextAvailable: "Today 5 PM",
        about: "Licensed psychiatrist specializing in anxiety, depression, and cognitive behavioral therapy."
      }
    ];
    
    const doctor = doctors.find(d => d.id === parseInt(params.id as string));
    if (doctor) {
      return HttpResponse.json(doctor);
    } else {
      return HttpResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }
  }),

  // Appointments API
  http.get('http://localhost:3001/api/appointments', async () => {
    console.log('🔧 MSW: Handling GET /api/appointments');
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return HttpResponse.json([
      {
        id: 1,
        doctorId: 1,
        doctorName: "Dr. Sarah Johnson",
        specialization: "Cardiology",
        patientName: "John Doe",
        email: "john.doe@email.com",
        phone: "+1-555-0123",
        date: "2025-07-26",
        time: "10:00 AM",
        status: "pending",
        reason: "Regular checkup"
      },
      {
        id: 2,
        doctorId: 2,
        doctorName: "Dr. Michael Chen",
        specialization: "Pediatrics",
        patientName: "Jane Smith",
        email: "jane.smith@email.com",
        phone: "+1-555-0125",
        date: "2025-07-27",
        time: "2:30 PM",
        status: "confirmed",
        reason: "Child vaccination"
      }
    ]);
  }),

  // Get single appointment
  http.get('http://localhost:3001/api/appointments/:id', async ({ params }) => {
    console.log('🔧 MSW: Handling GET /api/appointments/:id', params.id);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const appointments = [
      {
        id: 1,
        doctorId: 1,
        doctorName: "Dr. Sarah Johnson",
        specialization: "Cardiology",
        patientName: "John Doe",
        email: "john.doe@email.com",
        phone: "+1-555-0123",
        date: "2025-07-26",
        time: "10:00 AM",
        status: "pending",
        reason: "Regular checkup"
      },
      {
        id: 2,
        doctorId: 2,
        doctorName: "Dr. Michael Chen",
        specialization: "Pediatrics",
        patientName: "Jane Smith",
        email: "jane.smith@email.com",
        phone: "+1-555-0125",
        date: "2025-07-27",
        time: "2:30 PM",
        status: "confirmed",
        reason: "Child vaccination"
      }
    ];
    
    const appointment = appointments.find(a => a.id === parseInt(params.id as string));
    if (appointment) {
      return HttpResponse.json(appointment);
    } else {
      return HttpResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
  }),

  http.post('http://localhost:3001/api/appointments', async ({ request }) => {
    console.log('🔧 MSW: Handling POST /api/appointments');
    const body = await request.json() as any;
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const newAppointment = {
      id: Date.now(),
      ...body,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    return HttpResponse.json(newAppointment);
  }),

  // Patient Login
  http.post('http://localhost:3001/api/patient/login', async ({ request }) => {
    console.log('🔧 MSW: Handling POST /api/patient/login');
    const body = await request.json() as any;
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock patient credentials
    if (body.email === 'patient@example.com' && body.password === '123456') {
      return HttpResponse.json({
        success: true,
        message: 'Login successful!',
        token: 'fake-jwt-token-patient-12345',
        user: {
          id: '1',
          name: 'John Doe',
          email: 'patient@example.com',
          phone: '+1-555-0123',
        },
      });
    }
    
    return HttpResponse.json({
      success: false,
      message: 'Invalid credentials',
    }, { status: 401 });
  }),

  http.post('http://localhost:3001/api/doctor/signup', async ({ request }) => {
    const body = await request.json() as any;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return HttpResponse.json({
      success: true,
      message: 'Registration successful!',
      token: 'fake-jwt-token-12345',
      doctor: {
        id: '1',
        name: body.name,
        email: body.email,
        specialization: body.specialization,
        licenseNumber: body.licenseNumber,
        phone: body.phone,
      },
    });
  }),

  http.post('http://localhost:3001/api/doctor/login', async ({ request }) => {
    const body = await request.json() as any;
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate authentication logic
    if (body.email === 'teste@example.com' && body.password === '123456') {
      return HttpResponse.json({
        success: true,
        message: 'Login successful!',
        token: 'fake-jwt-token-12345',
        doctor: {
          id: '1',
          name: 'Dr. John Smith',
          email: 'test@example.com',
          specialization: 'Cardiology',
          licenseNumber: '12345-NY',
          phone: '(555) 123-4567',
        },
      });
    }
    
    return HttpResponse.json({
      success: false,
      message: 'Incorrect email or password',
    }, { status: 401 });
  }),

  http.get('/api/doctor/profile', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!authHeader || !authHeader.includes('Bearer')) {
      return HttpResponse.json({
        success: false,
        message: 'Invalid access token',
      }, { status: 401 });
    }
    
    return HttpResponse.json({
      success: true,
      doctor: {
        id: '1',
        name: 'Dr. John Smith',
        email: 'test@example.com',
        specialization: 'Cardiology',
        licenseNumber: '12345-NY',
        phone: '(555) 123-4567',
      },
    });
  }),

  http.get('/api/doctor/appointments', async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return HttpResponse.json({
      success: true,
      appointments: [
        {
          id: '1',
          patientName: 'Sarah Johnson',
          date: '2025-07-26',
          time: '09:00',
          status: 'confirmed',
          type: 'Routine checkup',
        },
        {
          id: '2',
          patientName: 'Michael Brown',
          date: '2025-07-26',
          time: '10:30',
          status: 'pending',
          type: 'Follow-up',
        },
        {
          id: '3',
          patientName: 'Emily Davis',
          date: '2025-07-27',
          time: '14:00',
          status: 'confirmed',
          type: 'Initial consultation',
        },
      ],
    });
  }),

  http.get('/api/doctor/stats', async () => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return HttpResponse.json({
      success: true,
      stats: {
        totalPatients: 156,
        appointmentsToday: 8,
        appointmentsThisWeek: 24,
        pendingAppointments: 3,
      },
    });
  }),

  // Prescriptions API
  http.get('/api/doctor/prescriptions', async () => {
    console.log('🔧 MSW: Handling GET /api/doctor/prescriptions');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return HttpResponse.json({
      success: true,
      prescriptions: [
        {
          id: '1',
          doctorId: '1',
          doctorName: 'Dr. John Smith',
          patientName: 'Sarah Johnson',
          appointmentId: '1',
          medicineName: 'Amoxicillin',
          dosage: '500mg',
          duration: '7 days',
          notes: 'Take with food. Complete the full course.',
          createdAt: '2025-08-05T10:30:00.000Z',
        },
        {
          id: '2',
          doctorId: '1',
          doctorName: 'Dr. John Smith',
          patientName: 'Michael Brown',
          appointmentId: '2',
          medicineName: 'Ibuprofen',
          dosage: '200mg',
          duration: '5 days',
          notes: 'Take after meals. Do not exceed 3 doses per day.',
          createdAt: '2025-08-04T14:20:00.000Z',
        },
        {
          id: '3',
          doctorId: '1',
          doctorName: 'Dr. John Smith',
          patientName: 'Emily Davis',
          medicineName: 'Paracetamol',
          dosage: '500mg',
          duration: '3 days',
          notes: 'For fever and pain relief.',
          createdAt: '2025-08-03T09:15:00.000Z',
        },
      ],
    });
  }),

  http.post('/api/doctor/prescriptions', async ({ request }) => {
    console.log('🔧 MSW: Handling POST /api/doctor/prescriptions');
    const body = await request.json() as any;
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newPrescription = {
      id: Date.now().toString(),
      doctorId: '1',
      doctorName: 'Dr. John Smith',
      ...body,
      createdAt: new Date().toISOString(),
    };
    
    return HttpResponse.json({
      success: true,
      message: 'Prescription created successfully',
      prescription: newPrescription,
    });
  }),

  http.put('/api/doctor/prescriptions/:id', async ({ params, request }) => {
    console.log('🔧 MSW: Handling PUT /api/doctor/prescriptions/:id', params.id);
    const body = await request.json() as any;
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const updatedPrescription = {
      id: params.id,
      doctorId: '1',
      doctorName: 'Dr. John Smith',
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json({
      success: true,
      message: 'Prescription updated successfully',
      prescription: updatedPrescription,
    });
  }),

  http.delete('/api/doctor/prescriptions/:id', async ({ params }) => {
    console.log('🔧 MSW: Handling DELETE /api/doctor/prescriptions/:id', params.id);
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return HttpResponse.json({
      success: true,
      message: 'Prescription deleted successfully',
    });
  }),

  http.get('/api/doctor/prescriptions/:id', async ({ params }) => {
    console.log('🔧 MSW: Handling GET /api/doctor/prescriptions/:id', params.id);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const prescription = {
      id: params.id,
      doctorId: '1',
      doctorName: 'Dr. John Smith',
      patientName: 'Sarah Johnson',
      appointmentId: '1',
      medicineName: 'Amoxicillin',
      dosage: '500mg',
      duration: '7 days',
      notes: 'Take with food. Complete the full course.',
      createdAt: '2025-08-05T10:30:00.000Z',
    };
    
    return HttpResponse.json({
      success: true,
      prescription,
    });
  }),
];
