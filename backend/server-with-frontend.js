const jsonServer = require('json-server');
const path = require('path');
const express = require('express');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Custom authentication middleware
const authMiddleware = (req, res, next) => {
  if (req.path === '/api/doctor/login' && req.method === 'POST') {
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
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  
  if (req.path === '/api/patient/login' && req.method === 'POST') {
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
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  
  next();
};

// Serve static files from public directory (React build)
server.use(express.static(path.join(__dirname, 'public')));

server.use(middlewares);
server.use(authMiddleware);
server.use('/api', router);

// Catch all handler: send back React's index.html file for client-side routing
server.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3001;
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${port}`);
  console.log(`📱 Frontend served from /`);
  console.log(`🔌 API available at /api`);
});