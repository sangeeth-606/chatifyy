import dotenv from 'dotenv';
// Try to load .env but don't fail if it doesn't exist
try {
  dotenv.config();
} catch (e) {
  console.log('No .env file found, using environment variables');
}
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import { checkDatabaseConnection } from './db.js';
import { roomSockets } from './roomSockets.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000; 
const NODE_ENV = process.env.NODE_ENV || 'development';

// Define allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',      // Local development
  'https://chatifyy-self.vercel.app'  // Production
];

console.log('Allowed Origins:', allowedOrigins);
console.log('Current Environment:', NODE_ENV);

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.warn(`Origin not allowed by CORS: ${origin}`);
      return callback(null, false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io',
  transports: ['polling', 'websocket'],
});

// Initialize room sockets
roomSockets(io);

// Routes
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'Welcome to the Chatifyy API',
    environment: NODE_ENV,
    version: '1.0.0'
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'UP', 
    message: 'Server is running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start the server
const startServer = async () => {
  try {
    // Check for required environment variables
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      process.exit(1);
    }
    
    // Validate database URL format
    try {
      new URL(process.env.DATABASE_URL);
    } catch (e) {
      console.error('DATABASE_URL is not a valid URL format');
      process.exit(1);
    }
    
    // Ensure SSL mode is set for database if in production
    if (process.env.NODE_ENV === 'production' && 
        !process.env.DATABASE_URL.includes('sslmode=require')) {
      const url = new URL(process.env.DATABASE_URL);
      if (!url.searchParams.has('sslmode')) {
        url.searchParams.set('sslmode', 'require');
        process.env.DATABASE_URL = url.toString();
      }
    }
    
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      console.error('Database connection failed. Server will not start.');
      process.exit(1);
    }
    
    server.listen(PORT, () => {
      console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}`);
      console.log(`Socket.IO configured for origins: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();