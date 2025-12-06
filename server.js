const express = require('express');
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 5001; // Default to 5000 if no PORT environment variable

app.use(express.json()); // Middleware to parse JSON bodies

// Define a simple route
app.get('/', (req, res) => {
  res.send('Hello, StyleDecor API!');
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
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
