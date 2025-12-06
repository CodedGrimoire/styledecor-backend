/**
 * Role-Based Access Control Middleware
 * 
 * Checks if the authenticated user has the required role(s) to access a route.
 * Must be used after the auth middleware (verifyToken).
 * 
 * Usage:
 * - requireRole('admin') - Only admins can access
 * - requireRole(['admin', 'decorator']) - Admins or decorators can access
 */

/**
 * Middleware factory that returns a middleware function to check user roles
 * 
 * @param {string|string[]} allowedRoles - Single role string or array of allowed roles
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
  // Normalize to array if single role is provided
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    try {
      // Check if user is authenticated (should be set by auth middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please include a valid token.',
        });
      }

      // Check if user's role is in the allowed roles list
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. This route requires one of the following roles: ${roles.join(', ')}. Your role: ${req.user.role}`,
        });
      }

      // User has required role, continue to next middleware or route handler
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization error. Please try again.',
        error: error.message,
      });
    }
  };
};

module.exports = requireRole;

