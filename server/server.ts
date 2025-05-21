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

// Middleware
app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
  path: '/socket.io',
  transports: ['polling', 'websocket'],
});

// Initialize room sockets
roomSockets(io);

// Routes
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to the API' });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', message: 'Server is running' });
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
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Attempting to start server on port ${PORT}`);
    
    // Check for required environment variables
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set');
      console.error('You need to set this in the Render dashboard under Environment Variables');
      process.exit(1);
    }
    
    // Validate database URL format
    try {
      new URL(process.env.DATABASE_URL);
    } catch (e) {
      console.error('❌ DATABASE_URL is not a valid URL format');
      process.exit(1);
    }
    
    // Ensure SSL mode is set for Supabase if in production
    if (process.env.NODE_ENV === 'production' && 
        process.env.DATABASE_URL.includes('supabase') && 
        !process.env.DATABASE_URL.includes('sslmode=require')) {
      console.warn('⚠️  For Supabase in production, your DATABASE_URL should include sslmode=require');
      console.warn('⚠️  Adding sslmode=require to your DATABASE_URL');
      
      // Modify the DATABASE_URL to include sslmode=require if it's missing
      const url = new URL(process.env.DATABASE_URL);
      if (!url.searchParams.has('sslmode')) {
        url.searchParams.set('sslmode', 'require');
        process.env.DATABASE_URL = url.toString();
        console.log('✅ Added sslmode=require to DATABASE_URL');
      }
    }
    
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      console.error('Database connection failed. Server will not start.');
      console.error('Please verify your DATABASE_URL in Render environment variables.');
      console.error('For Supabase connections, ensure:');
      console.error('1. Database connection string includes SSL configuration: sslmode=require');
      console.error('2. Supabase project has allowed Render IP addresses in Project Settings → Database → Network');
      console.error('   Render IP ranges: https://render.com/docs/infrastructure#egress-ip-addresses');
      process.exit(1);
    }
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} | Database: ✅ Connected`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();