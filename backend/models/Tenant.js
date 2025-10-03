const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const tenantSchema = new mongoose.Schema({
  // Basic tenant information
  name: {
    type: String,
    required: [true, 'Tenant name is required'],
    trim: true,
    maxlength: [100, 'Tenant name cannot exceed 100 characters']
  },
  subdomain: {
    type: String,
    required: [true, 'Subdomain is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, 'Subdomain must contain only lowercase letters, numbers, and hyphens'],
    minlength: [2, 'Subdomain must be at least 2 characters'],
    maxlength: [30, 'Subdomain cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Tenant email is required'],
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
  
  // Address information
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  // Business information
  website: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  
  // Subscription and limits
  plan: {
    type: String,
    enum: ['trial', 'starter', 'professional', 'enterprise', 'custom'],
    default: 'trial'
  },
  maxUsers: {
    type: Number,
    default: 5,
    min: [1, 'Tenant must allow at least 1 user']
  },
  currentUsers: {
    type: Number,
    default: 0,
    min: 0
  },
  maxStorage: {
    type: Number, // in MB
    default: 1000, // 1GB
    min: 100
  },
  currentStorage: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Pricing
  monthlyPrice: {
    type: Number,
    default: 0
  },
  yearlyPrice: {
    type: Number,
    default: 0
  },
  
  // Status and dates
  status: {
    type: String,
    enum: ['active', 'suspended', 'cancelled', 'trial_expired'],
    default: 'active'
  },
  trialStart: {
    type: Date,
    default: Date.now
  },
  trialEnd: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days trial
    }
  },
  subscriptionStart: {
    type: Date
  },
  subscriptionEnd: {
    type: Date
  },
  
  // Features and settings
  features: {
    customBranding: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    advancedReporting: { type: Boolean, default: false },
    integrations: { type: Boolean, default: false },
    customFields: { type: Boolean, default: true },
    emailTemplates: { type: Boolean, default: true }
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
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  
  // Custom branding
  branding: {
    logo: String,
    primaryColor: {
      type: String,
      default: '#3B82F6'
    },
    secondaryColor: {
      type: String,
      default: '#1F2937'
    },
    favicon: String
  },
  
  // Admin user for this tenant (first user created)
  adminUser: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  
  // Metadata
  metadata: {
    lastLogin: Date,
    lastActivity: Date,
    signupSource: String,
    notes: String
  }
}, {
  timestamps: true
});

// Virtual for trial status
tenantSchema.virtual('isTrialActive').get(function() {
  return this.plan === 'trial' && this.trialEnd > new Date();
});

// Virtual for trial days remaining
tenantSchema.virtual('trialDaysRemaining').get(function() {
  if (this.plan !== 'trial') return 0;
  const diff = this.trialEnd - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Virtual for subscription status
tenantSchema.virtual('isSubscriptionActive').get(function() {
  if (this.plan === 'trial') return this.isTrialActive;
  return this.status === 'active' && (!this.subscriptionEnd || this.subscriptionEnd > new Date());
});

// Virtual for usage percentage
tenantSchema.virtual('userUsagePercent').get(function() {
  return Math.round((this.currentUsers / this.maxUsers) * 100);
});

tenantSchema.virtual('storageUsagePercent').get(function() {
  return Math.round((this.currentStorage / this.maxStorage) * 100);
});

// Method to calculate pricing
tenantSchema.methods.calculatePricing = function() {
  const basePrices = {
    trial: 0,
    starter: 15,      // $15 per user per month
    professional: 35, // $35 per user per month
    enterprise: 65,   // $65 per user per month
    custom: 0         // Custom pricing
  };
  
  const basePrice = basePrices[this.plan] || basePrices.starter;
  this.monthlyPrice = this.currentUsers * basePrice;
  this.yearlyPrice = this.monthlyPrice * 12 * 0.85; // 15% discount for yearly
  
  // Volume discounts for monthly pricing
  if (this.currentUsers >= 100) {
    this.monthlyPrice *= 0.75; // 25% discount
    this.yearlyPrice = this.monthlyPrice * 12 * 0.85;
  } else if (this.currentUsers >= 50) {
    this.monthlyPrice *= 0.85; // 15% discount
    this.yearlyPrice = this.monthlyPrice * 12 * 0.85;
  } else if (this.currentUsers >= 20) {
    this.monthlyPrice *= 0.9; // 10% discount
    this.yearlyPrice = this.monthlyPrice * 12 * 0.85;
  }
  
  return { monthly: this.monthlyPrice, yearly: this.yearlyPrice };
};

// Method to check if feature is available
tenantSchema.methods.hasFeature = function(featureName) {
  return this.features[featureName] === true;
};

// Method to check usage limits
tenantSchema.methods.canAddUser = function() {
  return this.currentUsers < this.maxUsers;
};

tenantSchema.methods.canAddStorage = function(additionalMB) {
  return (this.currentStorage + additionalMB) <= this.maxStorage;
};

// Method to update last activity
tenantSchema.methods.updateLastActivity = function() {
  this.metadata.lastActivity = new Date();
  return this.save();
};

// Pre-save middleware
tenantSchema.pre('save', function(next) {
  // Calculate pricing when relevant fields change
  if (this.isModified('currentUsers') || this.isModified('plan')) {
    this.calculatePricing();
  }
  
  // Update trial status
  if (this.plan === 'trial' && this.trialEnd < new Date() && this.status === 'active') {
    this.status = 'trial_expired';
  }
  
  next();
});

// Static method to find by subdomain
tenantSchema.statics.findBySubdomain = function(subdomain) {
  return this.findOne({ subdomain: subdomain.toLowerCase() });
};

// Indexes for faster queries
tenantSchema.index({ subdomain: 1 });
tenantSchema.index({ email: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ plan: 1 });
tenantSchema.index({ trialEnd: 1 });
tenantSchema.index({ subscriptionEnd: 1 });
tenantSchema.index({ 'metadata.lastActivity': 1 });

module.exports = mongoose.model('Tenant', tenantSchema);





