const Service = require('../models/Service');
const User = require('../models/User');

const admin = require('../config/firebase');


const Decorator = require('../models/Decorator');

exports.getServices = async (req, res) => 
  
  
  {


  try 
  
  
  {
      const query = {};

    const { category } = req.query;
    
   


    if (category) 
      
      
      {
      query.category = category;
    }

    const services = await Service.find(query).sort({ createdAt: -1 });

    return res.status(200).json(
      
      {
      success: true,
      count: services.length,
      data: services,
    }
  
  
  );
  }
  
  
  
  catch (error) 
  
  
  
  {
    console.error( error);
    return res.status(500).json(
      
      
      
      {
      success: false,
      message: 'Error fetching services. Please try again.',


      error: error.message,
    }
  
  
  
  );
  }
};

exports.getTopDecorators = async (req, res) => 
  
  
  {
  try 
  
  
  {
    const decorators = await Decorator.find({ status: 'approved' })
      .sort({ rating: -1 })
      .limit(3)
      .populate('userId', 'name image');

    if (decorators.length === 0 || !decorators  ) 
      
      
      {
      return res.status(404).json({ success: false, message: 'No top decorators found' });
    }

    res.status(200).json(
      
      
      {
      success: true,
      count: decorators.length,
      data: decorators,
    });
  } 
  
  
  
  catch (err)
  
  
  {
  //  console.error('Error fetching top decorators:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getServiceById = async (req, res) => 
  
  
  {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);

    if (!service)
      
      
      {
      return res.status(404).json(
        
        
        
        
        {
        success: false,
        message: 'Service not found.',



      });
    }

    return res.status(200).json(
      
      
      
      
      
      {
      success: true,
      data: service,
    });
  }
  
  
  
  catch (error)
  
  
  {
    if (error.name === 'CastError')
      
      {
      return res.status(400).json({
        success: false,
     //  message: 'Invalid service ID format. Please provide a valid MongoDB ObjectId.',
      });
    }

   // console.error('Error fetching service:', error);
    return res.status(500).json({
      success: false,
    //  message: 'Error fetching service. Please try again.',
      error: error.message,
    });



  }
};

exports.register = async (req, res) => 
  
  
  
  {
  try 
  
  
  
  {
    const { name, role, image } = req.body;

    if (!name || !name.trim()) 
      
      
      
      {
      return res.status(400).json(
        
        
        
        {
        success: false,
        message: 'Name is required.',
      }
    
    
    
    );
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) 
      
      
      
      {
      return res.status(401).json(
        
        
        
        
        {
        success: false,
       // message: 'No token provided. Please include a Bearer token in the Authorization header.',
      }
    
    
    
    
    );
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) 
      
      
      {
      return res.status(401).json(
        
        
        
        {
        success: false,
        message: 'Invalid token format.',
      }
    
    
    
    );
    }

    let decodedToken;
    try 
    
    
    {
      decodedToken = await admin.auth().verifyIdToken(token);
    }
    
    
    catch (firebaseError) 
    
    
    
    {
      return res.status(401).json(
        
        
        {
        success: false,
       // message: 'Invalid or expired token.',
        error: firebaseError.message,
      }
    
    
    );
    }

    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email)
      
      {
      return res.status(400).json({
        success: false,
       // message: 'Email not found in token. Please ensure your Firebase account has an email.',
      });
    }

    const existingUser = await User.findOne({ firebaseUid });
    if (existingUser) 
      
      
      
      {
      return res.status(200).json(
        
        
        
        
        
        {
        success: true,
      
        data: existingUser,
      });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) 
      
      
      {
      return res.status(400).json(
        
        {
        success: false,
      
      });
    }

    if (role && !['user', 'admin', 'decorator'].includes(role)) 
      
      
      
      {
      return res.status(400).json(
        
        {
        success: false,
       
      });
    }

    const user = await User.create(
      
      
      
      {
      name: name.trim(),
      email: email.toLowerCase(),
      firebaseUid: firebaseUid,


      role: role || 'user',
      image: image || null,
    });

    return res.status(201).json(
      
      
      
      {

      success: true,
      message: 'User profile created successfully.',
      data: user,
    });
  } 
  
  
  
  catch (error)
  
  
  
  {
    console.error('Error registering user:', error);

    if (error.code === 11000) 
      
      
      
      
      {
      const field = Object.keys(error.keyPattern)[0];



      return res.status(400).json(
        
        
        
        {
        success: false,
        //message: `${field} is already registered.`,
      }
    
    
    
    );
    }

    if (error.name === 'ValidationError') 
      
      
      
      {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json(
        
        
        
        {
        success: false,
      //  message: 'Validation error.',
        errors: messages,
      });
    }

    return res.status(500).json(
      
      {
      success: false,
      message: 'Error creating user profile. Please try again.',
      error: error.message,
    });
  }
};
