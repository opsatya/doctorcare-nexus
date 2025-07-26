require('dotenv').config();
const jsonServer = require('json-server');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

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
    : 'http://localhost:3000',
  optionsSuccessStatus: 200
};
server.use(cors(corsOptions));

// Rest of your existing code...

// Error handling middleware
server.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const port = process.env.PORT || 3001;
const host = process.env.HOST || '0.0.0.0';

server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
