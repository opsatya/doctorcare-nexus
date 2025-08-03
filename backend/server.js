require('dotenv').config();
const jsonServer = require('json-server');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Load database
const db = JSON.parse(fs.readFileSync('db.json'));

// Security middleware
server.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
server.use(limiter);

// CORS configuration
const allowedOrigins = [
  'http://localhost:8081',
  'http://0.0.0.0:8081',
  'https://doctorcare-nexus.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || 
        allowedOrigins.some(allowedOrigin => origin.startsWith(allowedOrigin))) {
      callback(null, true);
    } else {
      console.log('Not allowed by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

server.use(cors(corsOptions));
server.options('*', cors(corsOptions)); // Enable preflight for all routes

// Parse JSON bodies
server.use(jsonServer.bodyParser);

// Mock authentication endpoints
server.post('/api/patient/login', (req, res) => {
  const { email, password } = req.body;
  const patient = db.patients.find(p => p.email === email && p.password === password);
  
  if (patient) {
    const token = 'mock-jwt-token-patient-' + patient.id;
    res.json({
      success: true,
      patient: { ...patient, password: undefined },
      token
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

server.post('/api/doctor/login', (req, res) => {
  const { email, password } = req.body;
  const doctor = db.doctors.find(d => d.email === email && d.password === password);
  
  if (doctor) {
    const token = 'mock-jwt-token-doctor-' + doctor.id;
    res.json({
      success: true,
      doctor: { ...doctor, password: undefined },
      token
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});



server.post('/api/doctor/signup', (req, res) => {
  const { name, email, password, specialization, licenseNumber, phone } = req.body;
  
  // Check if doctor already exists
  const existingDoctor = db.doctors.find(d => d.email === email);
  if (existingDoctor) {
    return res.status(400).json({
      success: false,
      message: 'Doctor with this email already exists'
    });
  }
  
  // Create new doctor
  const newDoctor = {
    id: db.doctors.length + 1,
    name,
    email,
    password,
    specialization,
    licenseNumber,
    phone,
    isVerified: false,
    createdAt: new Date().toISOString()
  };
  
  db.doctors.push(newDoctor);
  
  // Save to file (in real app, this would be handled by database)
  fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
  
  const token = 'mock-jwt-token-doctor-' + newDoctor.id;
  res.json({
    success: true,
    doctor: { ...newDoctor, password: undefined },
    token
  });
});

// Patient signup endpoint
server.post('/api/patient/signup', (req, res) => {
  const { name, email, password, phone, dateOfBirth, address } = req.body;
  
  // Initialize patients array if it doesn't exist
  if (!db.patients) {
    db.patients = [];
  }
  
  // Check if patient already exists
  const existingPatient = db.patients.find(p => p.email === email);
  if (existingPatient) {
    return res.status(400).json({
      success: false,
      message: 'Patient with this email already exists'
    });
  }
  
  // Create new patient
  const newPatient = {
    id: db.patients.length + 1,
    name,
    email,
    password,
    phone,
    dateOfBirth,
    address,
    isVerified: false,
    createdAt: new Date().toISOString()
  };
  
  // Add to database
  db.patients.push(newPatient);
  
  // Save to file
  fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
  
  // Create token and return response (without password)
  const token = 'mock-jwt-token-patient-' + newPatient.id;
  const { password: _, ...patientWithoutPassword } = newPatient;
  
  res.json({
    success: true,
    patient: patientWithoutPassword,
    token
  });
});

// Get single doctor
server.get('/api/doctors/:id', (req, res) => {
  const doctorId = parseInt(req.params.id);
  const doctor = db.doctors.find(d => d.id === doctorId);
  
  if (doctor) {
    res.json({ ...doctor, password: undefined });
  } else {
    res.status(404).json({ error: 'Doctor not found' });
  }
});

// Create appointment
server.post('/api/appointments', (req, res) => {
  const { patientName, email, phone, doctorId, date, time, reason } = req.body;
  
  // Find doctor
  const doctor = db.doctors.find(d => d.id === doctorId);
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' });
  }
  
  // Find patient by email
  const patient = db.patients.find(p => p.email === email);
  
  const newAppointment = {
    id: Date.now(), // Simple ID generation
    patientId: patient ? patient.id : null,
    patientName,
    email,
    phone,
    doctorId,
    doctorName: doctor.name,
    specialization: doctor.specialization,
    date,
    time,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  // Add to database
  if (!db.appointments) {
    db.appointments = [];
  }
  db.appointments.push(newAppointment);
  
  // Update patient's appointments array if patient exists
  if (patient) {
    if (!patient.appointments) {
      patient.appointments = [];
    }
    patient.appointments.push(newAppointment.id);
  }
  
  // Update doctor's appointments array
  if (!doctor.appointments) {
    doctor.appointments = [];
  }
  doctor.appointments.push(newAppointment.id);
  
  // Save to file
  fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
  
  res.json(newAppointment);
});

// Update appointment status
server.patch('/api/appointments/:id', (req, res) => {
  const appointmentId = parseInt(req.params.id);
  const { status } = req.body;
  
  const appointmentIndex = db.appointments.findIndex(a => a.id === appointmentId);
  
  if (appointmentIndex === -1) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  
  db.appointments[appointmentIndex].status = status;
  
  // Save to file
  fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
  
  res.json(db.appointments[appointmentIndex]);
});

// Use default middleware
server.use(middlewares);

// Use router
server.use('/api', router);

// Get appointments for a specific patient
server.get('/api/patients/:id/appointments', (req, res) => {
  const patient = db.patients.find(p => p.id == req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  
  const appointments = db.appointments.filter(appt => appt.email === patient.email);
  res.json(appointments);
});

// Get appointments for a specific doctor
server.get('/api/doctors/:id/appointments', (req, res) => {
  const doctor = db.doctors.find(d => d.id == req.params.id);
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' });
  }
  
  const appointments = db.appointments.filter(appt => appt.doctorId == req.params.id);
  res.json(appointments);
});


// Error handling middleware
server.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const port = process.env.PORT || 3001;
const host = process.env.HOST || '0.0.0.0';

server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
  console.log(`Available endpoints:`);
  console.log(`  POST /api/doctor/login`);
  console.log(`  POST /api/patient/login`);
  console.log(`  POST /api/doctor/signup`);
  console.log(`  GET  /api/doctors`);
  console.log(`  GET  /api/patients`);
  console.log(`  GET  /api/appointments`);
});