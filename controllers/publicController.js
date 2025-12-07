/**
 * Public Controller
 * 
 * Handles public routes that don't require authentication.
 * These routes are accessible to all users (authenticated or not).
 */

const Service = require('../models/Service');
const User = require('../models/User');
const admin = require('../config/firebase');

/**
 * Get all services
 * GET /services
 * 
 * Returns a list of all available services.
 * Can be filtered by category if provided as query parameter.
 */
exports.getServices = async (req, res) => {
  try {
    const { category } = req.query;
    
    // Build query object
    const query = {};
    if (category) {
      query.category = category;
    }

    // Fetch services from database
    const services = await Service.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching services. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Get a single service by ID
 * GET /services/:id
 * 
 * Returns details of a specific service.
 */
exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find service by ID
    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    // Handle invalid ObjectId format (don't log validation errors)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format. Please provide a valid MongoDB ObjectId.',
      });
    }

    // Log unexpected errors
    console.error('Error fetching service:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching service. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Register/Create User Profile
 * POST /register
 * 
 * Creates a user profile in the database after Firebase authentication.
 * This endpoint verifies the Firebase token and creates the user profile.
 * 
 * Headers:
 * - Authorization: Bearer <firebase-jwt-token> (required)
 * 
 * Request Body:
 * - name: User's full name (required)
 * - role: User role - 'user', 'admin', or 'decorator' (optional, defaults to 'user')
 * - image: URL to user's profile image (optional)
 */
exports.register = async (req, res) => {
  try {
    const { name, role, image } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required.',
      });
    }

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please include a Bearer token in the Authorization header.',
      });
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format.',
      });
    }

    // Verify the token with Firebase Admin SDK
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (firebaseError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
        error: firebaseError.message,
      });
    }

    // Extract Firebase UID and email from decoded token
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email not found in token. Please ensure your Firebase account has an email.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ firebaseUid });
    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: 'User profile already exists.',
        data: existingUser,
      });
    }

    // Check if email is already registered (in case of different firebaseUid)
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered. Please use a different account.',
      });
    }

    // Validate role if provided
    if (role && !['user', 'admin', 'decorator'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Role must be one of: user, admin, decorator.',
      });
    }

    // Create user profile
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      firebaseUid: firebaseUid,
      role: role || 'user',
      image: image || null,
    });

    return res.status(201).json({
      success: true,
      message: 'User profile created successfully.',
      data: user,
    });
  } catch (error) {
    console.error('Error registering user:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} is already registered.`,
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error.',
        errors: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error creating user profile. Please try again.',
      error: error.message,
    });
  }
};

