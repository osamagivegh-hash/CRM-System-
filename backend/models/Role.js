const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    enum: ['super_admin', 'tenant_admin', 'company_admin', 'manager', 'sales_rep', 'user']
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required']
  },
  description: {
    type: String,
    required: [true, 'Role description is required']
  },
  permissions: [{
    type: String,
    enum: [
      // User management
      'create_users', 'read_users', 'update_users', 'delete_users',
      // Company management
      'create_companies', 'read_companies', 'update_companies', 'delete_companies',
      // Client management
      'create_clients', 'read_clients', 'update_clients', 'delete_clients',
      // Lead management
      'create_leads', 'read_leads', 'update_leads', 'delete_leads',
      // Dashboard access
      'view_dashboard', 'view_analytics', 'read_dashboard',
      // System settings
      'manage_settings', 'manage_roles',
      // Multi-tenant permissions
      'create_tenants', 'read_tenants', 'update_tenants', 'delete_tenants',
      'super_admin_access'
    ]
  }],
  isSystemRole: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
roleSchema.index({ name: 1 });

module.exports = mongoose.model('Role', roleSchema);

