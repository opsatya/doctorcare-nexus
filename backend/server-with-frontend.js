const jsonServer = require('json-server');
const path = require('path');
const express = require('express');

const server = express(); // Use express directly
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Parse JSON bodies
server.use(express.json());

// Serve static files (your frontend build)
server.use(express.static(path.join(__dirname, 'public')));

// Custom authentication middleware
server.post('/api/doctor/login', (req, res) => {
  const { email, password } = req.body;
  const doctors = router.db.get('doctors').value();
  const doctor = doctors.find(d => d.email === email && d.password === password);

  if (doctor) {
    return res.json({
      success: true,
      user: { ...doctor, password: undefined },
      token: 'mock-jwt-token',
      userType: 'doctor'
    });
  }
  res.status(401).json({ success: false, message: 'Invalid credentials' });
});

server.post('/api/patient/login', (req, res) => {
  const { email, password } = req.body;
  const patients = router.db.get('patients').value();
  const patient = patients.find(p => p.email === email && p.password === password);

  if (patient) {
    return res.json({
      success: true,
      user: { ...patient, password: undefined },
      token: 'mock-jwt-token',
      userType: 'patient'
    });
  }
  res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Default middlewares
server.use(middlewares);

// JSON Server API
server.use('/api', router);

// React app fallback (for client-side routing)
server.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const port = process.env.PORT || 3001;
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${port}`);
  console.log(`📱 Frontend served from /`);
  console.log(`🔌 API available at /api`);
});
