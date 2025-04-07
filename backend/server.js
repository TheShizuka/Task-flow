const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Body parser with limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Optional rate limiter (much more lenient for development)
// Comment this out completely if still having issues
const requestCounts = {};
const WINDOW_MS = 10 * 1000; // 10 second window (very short)
const MAX_REQUESTS_PER_WINDOW = 30; // Higher limit


// Clean up rate limiting data periodically
setInterval(() => {
  const now = Date.now();
  for (const ip in requestCounts) {
    if (requestCounts[ip].timestamp < now - WINDOW_MS) {
      delete requestCounts[ip];
    }
  }
}, WINDOW_MS);

// Routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Generic error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// MongoDB connection options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, mongoOptions)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Clean up resources on shutdown
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  });
});