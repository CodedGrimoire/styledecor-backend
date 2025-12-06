/**
 * User Controller
 * 
 * Handles routes for authenticated users.
 * Users can create bookings, view their bookings, and cancel bookings.
 */

const Booking = require('../models/Booking');
const Service = require('../models/Service');

/**
 * Create a new booking
 * POST /bookings
 * 
 * Creates a booking for the authenticated user.
 * Requires: serviceId, date, location in request body.
 */
exports.createBooking = async (req, res) => {
  try {
    const { serviceId, date, location } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!serviceId || !date || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide serviceId, date, and location.',
      });
    }

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    // Validate date is in the future
    const bookingDate = new Date(date);
    if (bookingDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Booking date must be in the future.',
      });
    }

    // Create booking
    const booking = await Booking.create({
      userId,
      serviceId,
      date: bookingDate,
      location: location.trim(),
      paymentStatus: 'pending',
      status: 'pending',
    });

    // Populate service details in response
    await booking.populate('serviceId', 'service_name cost unit category description image');

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      data: booking,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error creating booking. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Get current user's bookings
 * GET /bookings/me
 * 
 * Returns all bookings made by the authenticated user.
 */
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all bookings for the user
    const bookings = await Booking.find({ userId })
      .populate('serviceId', 'service_name cost unit category description image')
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
 * Delete/Cancel a booking
 * DELETE /bookings/:id
 * 
 * Cancels a booking. Only the user who created the booking can cancel it.
 * Bookings with status 'completed' or 'in-progress' cannot be cancelled.
 */
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find booking
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Verify user owns the booking
    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to cancel this booking.',
      });
    }

    // Check if booking can be cancelled
    if (['completed', 'in-progress'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a booking that is in progress or completed.',
      });
    }

    // Update booking status to cancelled
    booking.status = 'cancelled';
    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: booking,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error cancelling booking. Please try again.',
      error: error.message,
    });
  }
};

