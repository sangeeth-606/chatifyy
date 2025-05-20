import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import { checkDatabaseConnection } from './db.js';
import { roomSockets } from './roomSockets.js';
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000; // Changed to 5000 to match client
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
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the API' });
});
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Server is running' });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});
// Start the server
const startServer = async () => {
    try {
        const dbConnected = await checkDatabaseConnection();
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT} | Database: ${dbConnected ? '✅ Connected' : '❌ Not Connected'}`);
        });
    }
    catch (error) {
        console.error('Server startup error:', error);
        process.exit(1);
    }
};
startServer();
