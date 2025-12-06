/**
 * Authentication Middleware
 * 
 * Verifies Firebase JWT tokens from the Authorization header.
 * Extracts user information and attaches it to the request object.
 * 
 * Usage:
 * - Add this middleware to routes that require authentication
 * - Expects Authorization header: "Bearer <firebase-jwt-token>"
 * - Attaches req.user with Firebase user data and req.firebaseUid
 */

const admin = require('../config/firebase');
const User = require('../models/User');

/**
 * Middleware to verify Firebase JWT token
 * 
 * Verifies the token, then looks up the user in the database.
 * Attaches user data to req.user and req.firebaseUid for use in route handlers.
 */
const verifyToken = async (req, res, next) => {
  try {
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

    // Extract Firebase UID from decoded token
    const firebaseUid = decodedToken.uid;

    // Look up user in database
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please complete your profile registration.',
      });
    }

    // Attach user data to request object for use in route handlers
    req.user = user;
    req.firebaseUid = firebaseUid;

    // Continue to next middleware or route handler
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error. Please try again.',
      error: error.message,
    });
  }
};

module.exports = verifyToken;

