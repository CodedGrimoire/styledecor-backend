const Service = require('../models/Service');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Decorator = require('../models/Decorator');
const Payment = require('../models/Payment');

exports.createService = async (req, res) => {
  try {
    const { service_name, cost, unit, category, description, image } = req.body;
    const createdByEmail = req.user.email;

    if (!service_name || !cost || !unit || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide service_name, cost, unit, category, and description.',
      });
    }

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

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

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

exports.getAllBookings = async (req, res) => {
  try {
    const { status, paymentStatus } = req.query;

    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

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

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

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

    booking.decoratorId = decoratorId;
    booking.status = 'assigned';
    await booking.save();

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

exports.makeDecorator = async (req, res) => {
  const { id } = req.params;

  try {
    const { specialties } = req.body;

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

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'decorator') {
      const existingDecorator = await Decorator.findOne({ userId: user._id });
      if (existingDecorator) {
        return res.status(400).json({ success: false, message: 'User is already a decorator.' });
      }
    }

    let newDecorator;
    try {
      newDecorator = await Decorator.create({
        userId: user._id,
        specialties: cleanedSpecialties,
        status: 'pending',
      });

      user.role = 'decorator';
      await user.save();
    } catch (error) {
      if (newDecorator) {
        await Decorator.findByIdAndDelete(newDecorator._id);
      }
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'User converted to decorator successfully. Decorator profile created with pending status.',
      data: {
        user: user.toObject(),
        decorator: newDecorator.toObject(),
      },
    });

  } catch (error) {
    console.error(`Error in makeDecorator for user ID ${id}:`, error);

    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Decorator profile already exists for this user.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: `Validation error: ${error.message}` });
    }

    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred while converting user to decorator.',
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
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

exports.getAllDecorators = async (req, res) => {
  try {
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


exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find({
      status: 'succeeded',
      ...dateFilter,
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0) / 100;

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

exports.getServiceDemandAnalytics = async (req, res) => {
  try {
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
