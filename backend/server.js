const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Add custom routes before JSON Server router
server.post('/api/doctor/login', (req, res) => {
  const { email, password } = req.body;
  const db = router.db; // lowdb instance
  const doctor = db.get('doctors').find({ email, password }).value();
  
  if (doctor) {
    res.json({
      success: true,
      token: 'fake-jwt-token-' + Date.now(),
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        experience: doctor.experience,
        rating: doctor.rating
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

server.post('/api/doctor/signup', (req, res) => {
  const db = router.db;
  const { name, email, password, specialization } = req.body;
  
  // Check if doctor already exists
  const existingDoctor = db.get('doctors').find({ email }).value();
  if (existingDoctor) {
    return res.status(400).json({
      success: false,
      message: 'Doctor already exists with this email'
    });
  }
  
  // Create new doctor
  const newDoctor = {
    id: Date.now(),
    name,
    email,
    password,
    specialization,
    experience: 0,
    rating: 0,
    availability: [],
    about: '',
    createdAt: new Date().toISOString()
  };
  
  db.get('doctors').push(newDoctor).write();
  
  res.json({
    success: true,
    token: 'fake-jwt-token-' + Date.now(),
    doctor: {
      id: newDoctor.id,
      name: newDoctor.name,
      email: newDoctor.email,
      specialization: newDoctor.specialization,
      experience: newDoctor.experience,
      rating: newDoctor.rating
    }
  });
});

// Use default router for other routes
server.use('/api', router);

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`JSON Server is running on http://localhost:${port}`);
  console.log(`API endpoints available at http://localhost:${port}/api`);
});