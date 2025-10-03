const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
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
    required: [true, 'Client must belong to a tenant']
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
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'potential', 'lost'],
    default: 'potential'
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'trade_show', 'other'],
    default: 'other'
  },
  value: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
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
  customFields: [{
    name: String,
    value: mongoose.Schema.Types.Mixed,
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'boolean', 'select']
    }
  }]
}, {
  timestamps: true
});

// Virtual for full name
clientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for overdue follow-ups
clientSchema.virtual('isOverdue').get(function() {
  return this.nextFollowUp && this.nextFollowUp < new Date();
});

// Method to add note
clientSchema.methods.addNote = function(content, userId, isPrivate = false) {
  this.notes.push({
    content,
    createdBy: userId,
    isPrivate
  });
  return this.save();
};

// Method to update last contact
clientSchema.methods.updateLastContact = function() {
  this.lastContact = new Date();
  return this.save();
};

// Pre-save middleware to ensure company consistency
clientSchema.pre('save', function(next) {
  if (this.isModified('assignedTo') && this.assignedTo) {
    // Verify assigned user belongs to the same company
    mongoose.model('User').findById(this.assignedTo)
      .populate('role', 'name')
      .then(user => {
        if (!user) {
          console.log('❌ Assigned user not found');
          next(new Error('Assigned user not found'));
          return;
        }

        // Allow super admin users to be assigned to any client
        if (user.role && user.role.name === 'super_admin') {
          console.log('✅ Super admin user can be assigned to any client');
          next();
          return;
        }

        // For regular users, ensure they belong to the same tenant as the client
        if (user.tenant.toString() !== this.tenant.toString()) {
          console.log('❌ Regular user assignment blocked - different tenants');
          console.log('👤 User tenant:', user.tenant.toString());
          console.log('🏢 Client tenant:', this.tenant.toString());
          console.log('👤 User role:', user.role?.name);
          next(new Error('Assigned user must belong to the same tenant as the client'));
        } else {
          console.log('✅ User assignment allowed - same tenant');
          next();
        }
      })
      .catch(next);
  } else {
    next();
  }
});

// Indexes for faster queries
clientSchema.index({ email: 1 });
clientSchema.index({ tenant: 1 });
clientSchema.index({ company: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ assignedTo: 1 });
clientSchema.index({ tenant: 1, status: 1 });
clientSchema.index({ company: 1, status: 1 });
clientSchema.index({ nextFollowUp: 1 });
clientSchema.index({ lastContact: 1 });
clientSchema.index({ tags: 1 });

// Compound index for search
clientSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text',
  companyName: 'text'
});

module.exports = mongoose.model('Client', clientSchema);

