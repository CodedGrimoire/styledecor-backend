const Booking = require('../models/Booking');



const Decorator = require('../models/Decorator');

exports.getProjects = async (req, res) => 
  
  {
  try
  
  
  
  
  
  {
    const userId = req.user._id;

     const decorator = await Decorator.findOne({ userId });

    if (!decorator) 
      
      
      
      {
      return res.status(404).json(
        
        
        
        {
        success: false,
       // message: 'Decorator profile not found. Please contact admin to set up your decorator account.',
      }
    
    
    );
    }

    if (decorator.status !== 'approved') 
      
      {
      return res.status(403).json(
        
        
        
        
        {
        
        
          success: false,
        message: `Your decorator account is ${decorator.status}. Please wait for admin approval.`,
      }
    
    
    );
    }

    const bookings = await Booking.find({ decoratorId: decorator._id })


      .populate('userId', 'name email image')

      .populate('serviceId', 'service_name cost unit category description image')
      .sort({ date: 1 });

    return res.status(200).json(
      
      
      {
      success: true,
      count: bookings.length,
      data: bookings,
    }
  
  
  );



  } 
  
  
  catch (error) 
  
  
  
  {
   // console.error('Error fetching decorator projects:', error);
    return res.status(500).json(
      
      
      {
      success: false,
      message: 'Error fetching projects. Please try again.',

      error: error.message,
    }
  
  
  
  );
  }
};

exports.updateProjectStatus = async (req, res) => 
  
  
  
  
  {



  try {
    const { bookingId } = req.params;

      const userId = req.user._id;

    const { status } = req.body;
   

    const validStatuses = ['assigned', 'in-progress', 'completed'];

    if (!status || !validStatuses.includes(status)) 
      
      {
      return res.status(400).json(
        
        
        
        {
        success: false,
      //  message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      }
    
    
    
    );
    }

    const decorator = await Decorator.findOne({ userId });


    if (!decorator) 
      
      
      
      {
      return res.status(404).json(
        
        
        {
        success: false,
        message: 'Decorator profile not found.',
      }
    
    
    
    );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) 
      
      
      
      {
      return res.status(404).json(
        
        
        
        {
        success: false,
        message: 'Booking not found.',
      }
    
    
    
    
    );
    }

    if (booking.decoratorId?.toString() !== decorator._id.toString()) 
      
      
      
      {
      return res.status(403).json(
        
        
        {
        success: false,


       // message: 'This booking is not assigned to you.',aegeg



      }
    
    );
    }

    const currentStatus = booking.status;
    const allowedTransitions = 
    
    
    {
      assigned: ['in-progress', 'completed'],
      'in-progress': ['completed'],
    };

    if (currentStatus === 'completed' || currentStatus === 'cancelled')
      
      
      {
      return res.status(400).json(
        
        
        {
        success: false,
       // message: `Cannot update status of a booking that is already ${currentStatus}.`,
      });
    }

    if (!allowedTransitions[currentStatus] || !allowedTransitions[currentStatus].includes(status)) 
      
      
      {
      return res.status(400).json(
        
        
        
        {
        success: false,
        message: `Invalid status transition from '${currentStatus}' to '${status}'.`,
      }
    
    
    );
    }

    booking.status = status;
    await booking.save();

      await booking.populate('userId', 'name email image');

    await booking.populate('serviceId', 'service_name cost unit category description image');

    return res.status(200).json(
      
      
      {
      success: true,
      message: 'Booking status updated successfully.',

      data: booking,
    });
  } 
  
  
  catch (error) 
  
  
  {
    console.error('Error updating project status:', error);
    
   

    return res.status(500).json(
      
      
      {
      success: false,
     // message: 'Error updating project status. Please try again.',
      error: error.message,
    }
  
  
  
  );
  }
};


exports.updateOnSiteStatus = async (req, res) => 
  
  
  
  {
  try {
    const { bookingId } = req.params;


      const userId = req.user._id;



    const { status1 } = req.body;
   

    const validStatuses = 
    
    
    [
      'assigned',
      'planning-phase',
      'materials-prepared',
      'on-the-way-to-venue',
      'setup-in-progress',
      'completed'
    ];

    if (!status1 || !validStatuses.includes(status1)) 
      
      
      
      {
      return res.status(400).json(
        
        
        
        {
        success: false,
        message: `Invalid status1. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const decorator = await Decorator.findOne({ userId });
    if (!decorator) 
      
      
      {
      return res.status(404).json(
        
        
        {
        success: false,
        message: 'Decorator profile not found.',
      }
    
    
    
    
    );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking)
      
      
      {
      return res.status(404).json(
        
        
        
        {
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.decoratorId?.toString() !== decorator._id.toString())
      
      
      
      {
      return res.status(403).json(
        
        
        {
        success: false,
        message: 'This booking is not assigned to you.',
      }
    
    
    
    
    
    );
    }

   
    const statusOrder = 
    
    [
      'assigned',
      'planning-phase',
      'materials-prepared',
      'on-the-way-to-venue',
      'setup-in-progress',
      'completed'
    ];

    const currentIndex = booking.status1 
      ? statusOrder.indexOf(booking.status1) 
      : -1;
    const newIndex = statusOrder.indexOf(status1);

    
    if (currentIndex >= 0 && newIndex < currentIndex) 
      
      
      {
      return res.status(400).json({
        success: false,
        message: `Cannot move status backwards from '${booking.status1}' to '${status1}'.`,
      });
    }

    // Update status1
    booking.status1 = status1;
    
   
    if (status1 === 'completed') 
      
      
      {
      booking.status = 'completed';
    }
    
    await booking.save();

    await booking.populate('userId', 'name email image');
    await booking.populate('serviceId', 'service_name cost unit category description image');

    return res.status(200).json(
      
      
      
      {
      success: true,
      message: 'On-site service status updated successfully.',
      data: booking,
    }
  
  
  );



  } 
  
  
  catch (error) 
  
  
  {
  //  console.error('Error updating on-site service status:', error);
    

    return res.status(500).json(
      
      
      
      
      {
      success: false,
     // message: 'Error updating on-site service status. Please try again.',
      error: error.message,
    });
  }
};
