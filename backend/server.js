require('dotenv').config();
const jsonServer = require('json-server');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const WebSocket = require('ws');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Load database
const db = JSON.parse(fs.readFileSync('db.json'));

// Helper to generate unique string IDs
const generateId = () => Date.now().toString();

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
    id: generateId(),
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
    id: generateId(),
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
  const doctor = db.doctors.find(d => d.id == doctorId);
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' });
  }
  
  // Find patient by email
  const patient = db.patients.find(p => p.email === email);
  
  const newAppointment = {
    id: generateId(), // Simple ID generation
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
  
// Broadcast new appointment to doctor and patient
  console.log('New appointment created, broadcasting:', newAppointment);
  broadcastToDoctor(doctorId, {
    type: 'appointment_created',
    appointment: newAppointment
  });
  
  if (patient) {
    broadcastToPatient(patient.id, {
      type: 'appointment_created',
      appointment: newAppointment
    });
  }
  
  res.json(newAppointment);
});

// Update appointment (status, date, time, etc.)
server.patch('/api/appointments/:id', (req, res) => {
  const { id: appointmentId } = req.params;
  const updates = req.body;

  const appointmentIndex = db.appointments.findIndex(a => a.id == appointmentId);
  
  if (appointmentIndex === -1) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  
  // Update appointment with provided fields and timestamp
  Object.assign(db.appointments[appointmentIndex], {
    ...updates,
    updatedAt: new Date().toISOString()
  });
  const updatedAppointment = db.appointments[appointmentIndex];
  
  // Save to file
  fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
  
  // Broadcast update to ALL connected clients (real-time updates)
  console.log('Appointment updated, broadcasting to ALL clients:', updatedAppointment);
  
  // Broadcast to doctor
  broadcastToDoctor(updatedAppointment.doctorId, {
    type: 'appointment_updated',
    appointment: updatedAppointment
  });
  
  // Broadcast to patient (try both patientId and email-based lookup)
  if (updatedAppointment.patientId) {
    broadcastToPatient(updatedAppointment.patientId, {
      type: 'appointment_updated',
      appointment: updatedAppointment
    });
  } else if (updatedAppointment.email) {
    // Find patient by email if patientId is not available
    const patient = db.patients.find(p => p.email === updatedAppointment.email);
    if (patient) {
      broadcastToPatient(patient.id, {
        type: 'appointment_updated',
        appointment: updatedAppointment
      });
    }
  }
  
  // Also broadcast to all connected clients (for immediate UI updates)
  broadcast({
    type: 'appointment_updated',
    appointment: updatedAppointment
  });
  
  res.json(updatedAppointment);
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

// Prescriptions API endpoints

// Get all prescriptions (for doctor)
server.get('/api/doctor/prescriptions', (req, res) => {
  console.log('Fetching prescriptions...');
  
  // Initialize prescriptions if not exists
  if (!db.prescriptions) {
    db.prescriptions = [];
  }
  
  res.json({
    success: true,
    prescriptions: db.prescriptions
  });
});

// Create new prescription
server.post('/api/doctor/prescriptions', (req, res) => {
  const { patientName, appointmentId, medicineName, dosage, duration, notes } = req.body;
  
  // Initialize prescriptions if not exists
  if (!db.prescriptions) {
    db.prescriptions = [];
  }
  
  const newPrescription = {
    id: generateId(),
    doctorId: '1', // Mock doctor ID
    doctorName: 'Dr. Sample', // Mock doctor name - in real app, get from auth
    patientName,
    appointmentId: appointmentId || null,
    medicineName,
    dosage,
    duration,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.prescriptions.push(newPrescription);
  
  // Save to file
  fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
  
  console.log('New prescription created:', newPrescription);
  
  res.json({
    success: true,
    message: 'Prescription created successfully',
    prescription: newPrescription
  });
});

// Update prescription
server.put('/api/doctor/prescriptions/:id', (req, res) => {
  const { id: prescriptionId } = req.params;
  const updates = req.body;
  
  // Initialize prescriptions if not exists
  if (!db.prescriptions) {
    db.prescriptions = [];
  }
  
  const prescriptionIndex = db.prescriptions.findIndex(p => p.id == prescriptionId);
  
  if (prescriptionIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Prescription not found'
    });
  }
  
  // Update prescription
  Object.assign(db.prescriptions[prescriptionIndex], {
    ...updates,
    updatedAt: new Date().toISOString()
  });
  
  const updatedPrescription = db.prescriptions[prescriptionIndex];
  
  // Save to file
  fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
  
  console.log('Prescription updated:', updatedPrescription);
  
  res.json({
    success: true,
    message: 'Prescription updated successfully',
    prescription: updatedPrescription
  });
});

// Delete prescription
server.delete('/api/doctor/prescriptions/:id', (req, res) => {
  const { id: prescriptionId } = req.params;
  
  // Initialize prescriptions if not exists
  if (!db.prescriptions) {
    db.prescriptions = [];
  }
  
  const prescriptionIndex = db.prescriptions.findIndex(p => p.id == prescriptionId);
  
  if (prescriptionIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Prescription not found'
    });
  }
  
  // Remove prescription
  const deletedPrescription = db.prescriptions.splice(prescriptionIndex, 1)[0];
  
  // Save to file
  fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
  
  console.log('Prescription deleted:', deletedPrescription);
  
  res.json({
    success: true,
    message: 'Prescription deleted successfully'
  });
});

// Get single prescription
server.get('/api/doctor/prescriptions/:id', (req, res) => {
  const { id: prescriptionId } = req.params;
  
  // Initialize prescriptions if not exists
  if (!db.prescriptions) {
    db.prescriptions = [];
  }
  
  const prescription = db.prescriptions.find(p => p.id == prescriptionId);
  
  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: 'Prescription not found'
    });
  }
  
  res.json({
    success: true,
    prescription
  });
});


// Error handling middleware
server.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const port = process.env.PORT || 3001;
const host = process.env.HOST || '0.0.0.0';

const httpServer = server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
  console.log(`Available endpoints:`);
  console.log(`  POST /api/doctor/login`);
  console.log(`  POST /api/patient/login`);
  console.log(`  POST /api/doctor/signup`);
  console.log(`  GET  /api/doctors`);
  console.log(`  GET  /api/patients`);
  console.log(`  GET  /api/appointments`);
});

// WebSocket Server
const wss = new WebSocket.Server({ server: httpServer });

// Store connected clients by user type and ID
const clients = {
  doctors: new Map(),
  patients: new Map()
};

// Helper function to broadcast to all clients
function broadcast(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Helper function to broadcast to specific doctor
function broadcastToDoctor(doctorId, message) {
  const client = clients.doctors.get(doctorId);
  if (client && client.readyState === WebSocket.OPEN) {
console.log(`Broadcast to doctor ${doctorId}`, message);
    client.send(JSON.stringify(message));
  }
}

// Helper function to broadcast to specific patient
function broadcastToPatient(patientId, message) {
  const client = clients.patients.get(patientId);
  if (client && client.readyState === WebSocket.OPEN) {
console.log(`Broadcast to patient ${patientId}`, message);
    client.send(JSON.stringify(message));
  }
}

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'auth') {
        // Store client by user type and ID
        if (message.userType === 'doctor' && message.doctorId) {
          clients.doctors.set(message.doctorId, ws);
          ws.userId = message.doctorId;
          ws.userType = 'doctor';
          console.log(`Doctor ${message.doctorId} connected via WebSocket`);
        } else if (message.userType === 'patient' && message.patientId) {
          clients.patients.set(message.patientId, ws);
          ws.userId = message.patientId;
          ws.userType = 'patient';
          console.log(`Patient ${message.patientId} connected via WebSocket`);
        }
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    // Remove client from maps
    if (ws.userType === 'doctor' && ws.userId) {
      clients.doctors.delete(ws.userId);
      console.log(`Doctor ${ws.userId} disconnected`);
    } else if (ws.userType === 'patient' && ws.userId) {
      clients.patients.delete(ws.userId);
      console.log(`Patient ${ws.userId} disconnected`);
    }
  });
});