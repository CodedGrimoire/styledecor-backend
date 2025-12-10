const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: 
    
    
    {
      type: mongoose.Schema.Types.ObjectId,



      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

 
    date:
    
    
    {
      type: Date,
      required: [true, 'Date is required'],
      validate: {
        validator: function (value) 
        
        
        {
          return value > new Date();
        },
        message: 'Booking date must be in the future',
      },
    },
       
    
    
    
    serviceId: 
       
       
       {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service ID is required'],


      index: true,
    },




    location: 
    {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    
    status: 
    
    {
      type: String,
      enum: ['pending', 'confirmed', 'assigned', 'in-progress', 'completed', 'cancelled'],


      default: 'pending',
    },


    paymentStatus: 
    
    
    {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],



      default: 'pending',
    },



    status1:
    
    
    
    {
      type: String,

      enum: ['assigned', 'planning-phase', 'materials-prepared', 'on-the-way-to-venue', 'setup-in-progress', 'completed'],
      default: null,
    },



    decoratorId: 
    
    
    {
      type: mongoose.Schema.Types.ObjectId,


      
      ref: 'Decorator',
      default: null,
    },
  },

  
  {
    timestamps: true,
  }
);

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ decoratorId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ status1: 1 });
bookingSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
