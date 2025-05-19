import express from 'express';
import cors from 'cors';


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

app.use(express.json());


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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


