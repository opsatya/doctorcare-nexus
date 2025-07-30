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
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : [ 'https://doctorcare-nexus.vercel.app/','http://localhost:8081'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};
server.use(cors(corsOptions));

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
      user: { ...patient, password: undefined },
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
  
  const newAppointment = {
    id: Date.now(), // Simple ID generation
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