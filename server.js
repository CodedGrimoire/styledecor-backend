/**
 * StyleDecor Backend Server
 * 
 * Main Express server for the StyleDecor API.
 * 
 * Features:
 * - MongoDB database connection
 * - Firebase Admin SDK initialization
 * - RESTful API routes
 * - Authentication and authorization middleware
 * - Stripe payment processing
 * 
 * Environment Variables Required:
 * - PORT: Server port (default: 5001)
 * - MONGODB_URI: MongoDB connection string
 * - FIREBASE_PROJECT_ID: Firebase project ID
 * - FIREBASE_PRIVATE_KEY: Firebase service account private key
 * - FIREBASE_CLIENT_EMAIL: Firebase service account email
 * - STRIPE_SECRET_KEY: Stripe secret key
 */

const express = require('express');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Initialize Firebase Admin SDK (imports and initializes)
require('./config/firebase');

// Import routes
const publicRoutes = require('./routes/public');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const decoratorRoutes = require('./routes/decorator');
const paymentRoutes = require('./routes/payment');

// Initialize Express app
const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// CORS middleware (if needed for frontend)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'StyleDecor API is running',
    version: '1.0.0',
  });
});

// API Routes
app.use('/', publicRoutes); // Public routes (no auth required)
app.use('/', userRoutes); // User routes (auth required)
app.use('/admin', adminRoutes); // Admin routes (auth + admin role required)
app.use('/decorator', decoratorRoutes); // Decorator routes (auth + decorator role required)
app.use('/payments', paymentRoutes); // Payment routes (auth required)

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found. Please check the API documentation.',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start the server
    const server = app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please use a different port.`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
