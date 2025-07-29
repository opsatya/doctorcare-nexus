# Multi-stage Dockerfile for DoctorCare Application

# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files for frontend
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Install frontend dependencies (including devDependencies for build)
RUN npm ci

# Copy frontend source code
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build the frontend
RUN npm run build

# Stage 2: Setup backend and serve frontend
FROM node:18-alpine AS production

WORKDIR /app

# Copy backend files and install dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend

# Add express dependency for custom server
RUN npm install express@^4.18.0

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Copy built frontend files to backend's public directory
COPY --from=frontend-builder /app/dist ./public

# Create a simple server that serves both API and frontend
RUN cat > server-with-frontend.js << 'EOF'
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
EOF

# Update package.json to use the new server file
RUN sed -i 's/"start": "node server.js"/"start": "node server-with-frontend.js"/' package.json

EXPOSE 3001

# Install curl for health check
RUN apk add --no-cache curl

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/doctors || exit 1

CMD ["npm", "start"]
