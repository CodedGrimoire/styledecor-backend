const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  register,
  getTopDecorators,
} = require('../controllers/publicController');

// Public routes (no authentication required)

// Service routes
router.get('/services', getServices);
router.get('/services/:id', getServiceById);

// Decorator routes
router.get('/decorators/top', getTopDecorators);

// User registration
router.post('/register', register);

module.exports = router;