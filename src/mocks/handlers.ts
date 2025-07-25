import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/doctor/signup', async ({ request }) => {
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

  http.post('/api/doctor/login', async ({ request }) => {
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
          email: 'teste@example.com',
          specialization: 'Cardiologia',
          licenseNumber: '12345-SP',
          phone: '(11) 99999-9999',
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
          patientName: 'Maria Santos',
          date: '2025-07-26',
          time: '09:00',
          status: 'confirmed',
          type: 'Consulta de rotina',
        },
        {
          id: '2',
          patientName: 'Carlos Oliveira',
          date: '2025-07-26',
          time: '10:30',
          status: 'pending',
          type: 'Retorno',
        },
        {
          id: '3',
          patientName: 'Ana Lima',
          date: '2025-07-27',
          time: '14:00',
          status: 'confirmed',
          type: 'Primeira consulta',
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
];