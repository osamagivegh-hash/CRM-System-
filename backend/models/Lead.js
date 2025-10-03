const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  phone: {
    type: String,
    trim: true
  },
  tenant: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tenant',
    required: [true, 'Lead must belong to a tenant']
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company'
  },
  companyName: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'trade_show', 'advertisement', 'other'],
    default: 'other'
  },
  estimatedValue: {
    type: Number,
    default: 0,
    min: 0
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 10
  },
  currency: {
    type: String,
    default: 'USD'
  },
  expectedCloseDate: {
    type: Date
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: [{
    content: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }],
  activities: [{
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'demo', 'proposal', 'follow_up', 'other'],
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    description: String,
    scheduledDate: Date,
    completedDate: Date,
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastContact: {
    type: Date
  },
  nextFollowUp: {
    type: Date
  },
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  customFields: [{
    name: String,
    value: mongoose.Schema.Types.Mixed,
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'boolean', 'select']
    }
  }],
  convertedToClient: {
    type: Boolean,
    default: false
  },
  convertedDate: {
    type: Date
  },
  clientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client'
  }
}, {
  timestamps: true
});

// Virtual for full name
leadSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for weighted value
leadSchema.virtual('weightedValue').get(function() {
  return (this.estimatedValue * this.probability) / 100;
});

// Virtual for overdue status
leadSchema.virtual('isOverdue').get(function() {
  return this.expectedCloseDate && this.expectedCloseDate < new Date() && !['closed_won', 'closed_lost'].includes(this.status);
});

// Virtual for days until close
leadSchema.virtual('daysUntilClose').get(function() {
  if (!this.expectedCloseDate) return null;
  const diff = this.expectedCloseDate - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Method to add note
leadSchema.methods.addNote = function(content, userId, isPrivate = false) {
  this.notes.push({
    content,
    createdBy: userId,
    isPrivate
  });
  return this.save();
};

// Method to add activity
leadSchema.methods.addActivity = function(activityData, userId) {
  this.activities.push({
    ...activityData,
    createdBy: userId
  });
  return this.save();
};

// Method to convert to client
leadSchema.methods.convertToClient = async function() {
  if (this.convertedToClient) {
    throw new Error('Lead is already converted to client');
  }

  const Client = mongoose.model('Client');
  const User = mongoose.model('User');
  
  console.log('🔄 Converting lead to client:', this._id);
  console.log('👤 Lead assigned to:', this.assignedTo);
  console.log('🏢 Lead company:', this.company);
  
  let assignedToUser = null;
  
  // Check if the assigned user can be assigned to this client
  if (this.assignedTo) {
    try {
      assignedToUser = await User.findById(this.assignedTo).populate('role', 'name');
      
      if (assignedToUser) {
        console.log('👤 Assigned user tenant:', assignedToUser.tenant);
        console.log('👤 Assigned user role:', assignedToUser.role?.name);
        
        // Allow super admin users to be assigned across tenants
        if (assignedToUser.role && assignedToUser.role.name === 'super_admin') {
          console.log('✅ Super admin user - allowing cross-tenant assignment');
        }
        // For regular users, check if they belong to the same tenant
        else if (assignedToUser.tenant.toString() !== this.tenant.toString()) {
          console.log('❌ User belongs to different tenant - removing assignment during conversion');
          assignedToUser = null; // Don't assign user from different tenant
        } else {
          console.log('✅ User belongs to same tenant - keeping assignment');
        }
      }
    } catch (error) {
      console.log('❌ Error checking assigned user:', error.message);
      assignedToUser = null; // Don't assign if there's an error
    }
  }
  
  const clientData = {
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone,
    tenant: this.tenant,
    company: this.company,
    companyName: this.companyName,
    jobTitle: this.jobTitle,
    industry: this.industry,
    address: this.address,
    status: 'active',
    source: this.source,
    value: this.estimatedValue,
    currency: this.currency,
    assignedTo: assignedToUser ? this.assignedTo : null, // Only assign if user is compatible
    tags: this.tags,
    socialMedia: this.socialMedia,
    customFields: this.customFields,
    notes: this.notes
  };

  console.log('📦 Client data for creation:', {
    assignedTo: clientData.assignedTo,
    company: clientData.company,
    firstName: clientData.firstName,
    lastName: clientData.lastName
  });

  const client = await Client.create(clientData);
  
  this.convertedToClient = true;
  this.convertedDate = new Date();
  this.clientId = client._id;
  this.status = 'closed_won';
  
  await this.save();
  
  return client;
};

// Method to update probability based on status
leadSchema.methods.updateProbabilityByStatus = function() {
  const statusProbabilities = {
    'new': 10,
    'contacted': 20,
    'qualified': 40,
    'proposal': 60,
    'negotiation': 80,
    'closed_won': 100,
    'closed_lost': 0
  };
  
  this.probability = statusProbabilities[this.status] || this.probability;
};

// Pre-save middleware
leadSchema.pre('save', function(next) {
  // Update probability when status changes
  if (this.isModified('status')) {
    this.updateProbabilityByStatus();
  }
  
  // Update last contact when activities are added
  if (this.isModified('activities') && this.activities.length > 0) {
    const lastActivity = this.activities[this.activities.length - 1];
    if (lastActivity.completedDate) {
      this.lastContact = lastActivity.completedDate;
    }
  }
  
  next();
});

// Indexes for faster queries
leadSchema.index({ email: 1 });
leadSchema.index({ tenant: 1 });
leadSchema.index({ company: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ tenant: 1, status: 1 });
leadSchema.index({ company: 1, status: 1 });
leadSchema.index({ expectedCloseDate: 1 });
leadSchema.index({ nextFollowUp: 1 });
leadSchema.index({ tags: 1 });
leadSchema.index({ convertedToClient: 1 });

// Compound index for search
leadSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text',
  companyName: 'text'
});

module.exports = mongoose.model('Lead', leadSchema);

