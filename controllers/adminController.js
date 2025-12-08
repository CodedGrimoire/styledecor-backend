/**
 * Admin Controller
 * 
 * Handles routes for admin users.
 * Admins can manage services, bookings, users, decorators, and view analytics.
 */

const Service = require('../models/Service');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Decorator = require('../models/Decorator');
const Payment = require('../models/Payment');

/**
 * Create a new service
 * POST /admin/services
 * 
 * Creates a new decoration service.
 */
exports.createService = async (req, res) => {
  try {
    const { service_name, cost, unit, category, description, image } = req.body;
    const createdByEmail = req.user.email;

    // Validate required fields
    if (!service_name || !cost || !unit || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide service_name, cost, unit, category, and description.',
      });
    }

    // Create service
    const service = await Service.create({
      service_name: service_name.trim(),
      cost: parseFloat(cost),
      unit: unit.trim(),
      category: category.trim(),
      description: description.trim(),
      createdByEmail,
      image: image || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Service created successfully.',
      data: service,
    });
  } catch (error) {
    console.error('Error creating service:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error.',
        errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error creating service. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Update a service
 * PUT /admin/services/:id
 * 
 * Updates an existing service.
 */
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find service
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    // Update service fields
    Object.keys(updates).forEach((key) => {
      if (['service_name', 'cost', 'unit', 'category', 'description', 'image'].includes(key)) {
        service[key] = updates[key];
      }
    });

    await service.save();

    return res.status(200).json({
      success: true,
      message: 'Service updated successfully.',
      data: service,
    });
  } catch (error) {
    console.error('Error updating service:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format.',
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error.',
        errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error updating service. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Delete a service
 * DELETE /admin/services/:id
 * 
 * Deletes a service. Note: This may affect existing bookings.
 */
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByIdAndDelete(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Service deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error deleting service. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Get all bookings
 * GET /admin/bookings
 * 
 * Returns all bookings in the system with optional filters.
 */
exports.getAllBookings = async (req, res) => {
  try {
    const { status, paymentStatus } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    // Fetch bookings
    const bookings = await Booking.find(query)
      .populate('userId', 'name email image')
      .populate('serviceId', 'service_name cost unit category')
      .populate('decoratorId', 'userId')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching bookings. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Assign a decorator to a booking
 * PUT /admin/bookings/:id/assign
 * 
 * Assigns a decorator to a booking.
 */
exports.assignDecorator = async (req, res) => {
  try {
    const { id } = req.params;
    const { decoratorId } = req.body;

    if (!decoratorId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide decoratorId.',
      });
    }

    // Find booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Verify decorator exists and is approved
    const decorator = await Decorator.findById(decoratorId);
    if (!decorator) {
      return res.status(404).json({
        success: false,
        message: 'Decorator not found.',
      });
    }

    if (decorator.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign a decorator that is not approved.',
      });
    }

    // Assign decorator and update status
    booking.decoratorId = decoratorId;
    booking.status = 'assigned';
    await booking.save();

    // Populate related data
    await booking.populate('userId', 'name email image');
    await booking.populate('serviceId', 'service_name cost unit category');
    await booking.populate('decoratorId', 'userId');

    return res.status(200).json({
      success: true,
      message: 'Decorator assigned successfully.',
      data: booking,
    });
  } catch (error) {
    console.error('Error assigning decorator:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error assigning decorator. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Make a user a decorator
 * PUT /admin/users/:id/make-decorator
 * 
 * Converts a regular user to a decorator role and creates a decorator profile.
 */
exports.makeDecorator = async (req, res) => {
  const { id } = req.params;

  try {
    const { specialties } = req.body;

    // 1. Request Validation
    if (!specialties) {
      return res.status(400).json({ success: false, message: 'Specialties are required.' });
    }
    if (!Array.isArray(specialties)) {
      return res.status(400).json({ success: false, message: 'Specialties must be an array.' });
    }
    const cleanedSpecialties = specialties.map(s => typeof s === 'string' ? s.trim() : '').filter(s => s.length > 0);
    if (cleanedSpecialties.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one valid, non-empty specialty is required.' });
    }

    // 2. Database Operations
    // Step 2a: Find the User
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Step 2b: Check if user is already a decorator and has a profile
    if (user.role === 'decorator') {
      const existingDecorator = await Decorator.findOne({ userId: user._id });
      if (existingDecorator) {
        return res.status(400).json({ success: false, message: 'User is already a decorator.' });
      }
    }

    // Step 2c & 2d: Create Decorator Profile and Update User Role (Atomic-like operation)
    // We create the decorator profile first. If this fails, the user's role is not changed.
    let newDecorator;
    try {
      newDecorator = await Decorator.create({
        userId: user._id,
        specialties: cleanedSpecialties,
        status: 'pending', // Requires admin approval
      });

      // If decorator profile creation is successful, update the user's role.
      user.role = 'decorator';
      await user.save();
    } catch (error) {
      // Rollback: If decorator profile was created but updating the user failed, delete the orphaned decorator profile.
      if (newDecorator) {
        await Decorator.findByIdAndDelete(newDecorator._id);
      }
      // Re-throw to be caught by the main error handler
      throw error;
    }

    // 3. Success Response
    return res.status(200).json({
      success: true,
      message: 'User converted to decorator successfully. Decorator profile created with pending status.',
      data: {
        user: user.toObject(), // Use toObject() for a clean object
        decorator: newDecorator.toObject(),
      },
    });

  } catch (error) {
    // 4. Error Handling
    console.error(`Error in makeDecorator for user ID ${id}:`, error);

    // Handle specific, known errors first
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Decorator profile already exists for this user.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: `Validation error: ${error.message}` });
    }

    // Generic fallback for any other unexpected errors
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred while converting user to decorator.',
    });
  }
};

/**
 * Get all users
 * GET /admin/users
 * 
 * Returns a list of all users in the system.
 */
exports.getAllUsers = async (req, res) => {
  try {
    // Fetch all users, sorted by creation date
    const users = await User.find({}).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching users. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Approve a decorator
 * PUT /admin/decorators/:id/approve
 * 
 * Approves a decorator, allowing them to receive bookings.
 */
exports.approveDecorator = async (req, res) => {
  try {
    const { id } = req.params;

    const decorator = await Decorator.findById(id);
    if (!decorator) {
      return res.status(404).json({
        success: false,
        message: 'Decorator not found.',
      });
    }

    decorator.status = 'approved';
    await decorator.save();

    return res.status(200).json({
      success: true,
      message: 'Decorator approved successfully.',
      data: decorator,
    });
  } catch (error) {
    console.error('Error approving decorator:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid decorator ID format.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error approving decorator. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Disable a decorator
 * PUT /admin/decorators/:id/disable
 * 
 * Disables a decorator, preventing them from receiving new bookings.
 */
exports.disableDecorator = async (req, res) => {
  try {
    const { id } = req.params;

    const decorator = await Decorator.findById(id);
    if (!decorator) {
      return res.status(404).json({
        success: false,
        message: 'Decorator not found.',
      });
    }

    decorator.status = 'disabled';
    await decorator.save();

    return res.status(200).json({
      success: true,
      message: 'Decorator disabled successfully.',
      data: decorator,
    });
  } catch (error) {
    console.error('Error disabling decorator:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid decorator ID format.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error disabling decorator. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Get all decorators
 * GET /admin/decorators
 * 
 * Returns a list of all decorators in the system.
 */
exports.getAllDecorators = async (req, res) => {
  try {
    // Fetch all decorators and populate the associated user's name, email, and image
    const decorators = await Decorator.find({})
      .populate('userId', 'name email image')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: decorators.length,
      data: decorators,
    });
  } catch (error) {
    console.error('Error fetching decorators:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching decorators. Please try again.',
      error: error.message,
    });
  }
};


/**
 * Get revenue analytics
 * GET /admin/analytics/revenue
 * 
 * Returns revenue analytics including total revenue, revenue by period, etc.
 */
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get all successful payments
    const payments = await Payment.find({
      status: 'succeeded',
      ...dateFilter,
    });

    // Calculate total revenue (amount is in cents, convert to dollars)
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0) / 100;

    // Group by month
    const revenueByMonth = {};
    payments.forEach((payment) => {
      const month = payment.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!revenueByMonth[month]) {
        revenueByMonth[month] = 0;
      }
      revenueByMonth[month] += payment.amount / 100;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue: totalRevenue.toFixed(2),
        totalTransactions: payments.length,
        revenueByMonth,
      },
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching revenue analytics. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Get service demand analytics
 * GET /admin/analytics/service-demand
 * 
 * Returns analytics about which services are most in demand.
 */
exports.getServiceDemandAnalytics = async (req, res) => {
  try {
    // Aggregate bookings by service
    const serviceDemand = await Booking.aggregate([
      {
        $group: {
          _id: '$serviceId',
          bookingCount: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service',
        },
      },
      {
        $unwind: '$service',
      },
      {
        $project: {
          serviceName: '$service.service_name',
          serviceCategory: '$service.category',
          bookingCount: 1,
          completedCount: 1,
        },
      },
      {
        $sort: { bookingCount: -1 },
      },
    ]);

    // Group by category
    const demandByCategory = {};
    serviceDemand.forEach((item) => {
      const category = item.serviceCategory;
      if (!demandByCategory[category]) {
        demandByCategory[category] = {
          totalBookings: 0,
          totalCompleted: 0,
          services: [],
        };
      }
      demandByCategory[category].totalBookings += item.bookingCount;
      demandByCategory[category].totalCompleted += item.completedCount;
      demandByCategory[category].services.push({
        name: item.serviceName,
        bookings: item.bookingCount,
        completed: item.completedCount,
      });
    });

    return res.status(200).json({
      success: true,
      data: {
        serviceDemand,
        demandByCategory,
      },
    });
  } catch (error) {
    console.error('Error fetching service demand analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching service demand analytics. Please try again.',
      error: error.message,
    });
  }
};
