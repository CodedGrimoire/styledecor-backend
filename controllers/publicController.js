/**
 * Public Controller
 * 
 * Handles public routes that don't require authentication.
 * These routes are accessible to all users (authenticated or not).
 */

const Service = require('../models/Service');

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
    console.error('Error fetching service:', error);
    
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error fetching service. Please try again.',
      error: error.message,
    });
  }
};

