const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tenant',
    required: [true, 'Company must belong to a tenant']
  },
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Company email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  website: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  plan: {
    type: String,
    enum: ['starter', 'professional', 'enterprise'],
    default: 'starter'
  },
  maxUsers: {
    type: Number,
    default: 5,
    min: [1, 'Company must have at least 1 user']
  },
  currentUsers: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlyPrice: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscriptionStart: {
    type: Date,
    default: Date.now
  },
  subscriptionEnd: {
    type: Date
  },
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    currency: {
      type: String,
      default: 'USD'
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY'
    }
  }
}, {
  timestamps: true
});

// Virtual for active users count
companySchema.virtual('activeUsersCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'company',
  count: true,
  match: { isActive: true }
});

// Virtual for clients count
companySchema.virtual('clientsCount', {
  ref: 'Client',
  localField: '_id',
  foreignField: 'company',
  count: true
});

// Virtual for leads count
companySchema.virtual('leadsCount', {
  ref: 'Lead',
  localField: '_id',
  foreignField: 'company',
  count: true
});

// Method to calculate pricing
companySchema.methods.calculatePricing = function() {
  const basePrices = {
    starter: 10,    // $10 per user
    professional: 25, // $25 per user
    enterprise: 50    // $50 per user
  };
  
  const basePrice = basePrices[this.plan] || basePrices.starter;
  this.monthlyPrice = this.currentUsers * basePrice;
  
  // Volume discounts
  if (this.currentUsers >= 50) {
    this.monthlyPrice *= 0.8; // 20% discount
  } else if (this.currentUsers >= 20) {
    this.monthlyPrice *= 0.9; // 10% discount
  }
  
  return this.monthlyPrice;
};

// Pre-save middleware to update pricing
companySchema.pre('save', function(next) {
  if (this.isModified('currentUsers') || this.isModified('plan')) {
    this.calculatePricing();
  }
  next();
});

// Indexes for faster queries
companySchema.index({ tenant: 1 });
companySchema.index({ email: 1 });
companySchema.index({ name: 1 });
companySchema.index({ isActive: 1 });
companySchema.index({ plan: 1 });
companySchema.index({ tenant: 1, isActive: 1 });

module.exports = mongoose.model('Company', companySchema);

