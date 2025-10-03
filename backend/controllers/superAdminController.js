const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Role = require('../models/Role');
const Lead = require('../models/Lead');
const Client = require('../models/Client');
const Company = require('../models/Company');
const bcrypt = require('bcryptjs');

// @desc    Get all tenants
// @route   GET /api/super-admin/tenants
// @access  Super Admin
exports.getTenants = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const plan = req.query.plan || '';

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subdomain: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) filter.status = status;
    if (plan) filter.plan = plan;

    const tenants = await Tenant.find(filter)
      .populate('adminUser', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Tenant.countDocuments(filter);

    // Add usage statistics for each tenant
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const [userCount, leadCount, clientCount, companyCount] = await Promise.all([
          User.countDocuments({ tenant: tenant._id }),
          Lead.countDocuments({ tenant: tenant._id }),
          Client.countDocuments({ tenant: tenant._id }),
          Company.countDocuments({ tenant: tenant._id })
        ]);

        return {
          ...tenant.toObject(),
          stats: {
            users: userCount,
            leads: leadCount,
            clients: clientCount,
            companies: companyCount
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: tenantsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tenant
// @route   GET /api/super-admin/tenants/:id
// @access  Super Admin
exports.getTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id)
      .populate('adminUser', 'firstName lastName email phone lastLogin');

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Get detailed statistics
    const [userCount, leadCount, clientCount, companyCount, activeUsers] = await Promise.all([
      User.countDocuments({ tenant: tenant._id }),
      Lead.countDocuments({ tenant: tenant._id }),
      Client.countDocuments({ tenant: tenant._id }),
      Company.countDocuments({ tenant: tenant._id }),
      User.countDocuments({ tenant: tenant._id, isActive: true })
    ]);

    // Get recent activity
    const recentUsers = await User.find({ tenant: tenant._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email createdAt');

    const recentLeads = await Lead.find({ tenant: tenant._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email status createdAt');

    res.status(200).json({
      success: true,
      data: {
        ...tenant.toObject(),
        stats: {
          users: userCount,
          activeUsers,
          leads: leadCount,
          clients: clientCount,
          companies: companyCount
        },
        recentActivity: {
          users: recentUsers,
          leads: recentLeads
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new tenant
// @route   POST /api/super-admin/tenants
// @access  Super Admin
exports.createTenant = async (req, res, next) => {
  try {
    const {
      name,
      subdomain,
      email,
      phone,
      plan,
      maxUsers,
      maxStorage,
      adminUser,
      address,
      website,
      industry
    } = req.body;

    // Check if subdomain is available
    const existingTenant = await Tenant.findOne({ subdomain: subdomain.toLowerCase() });
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain already exists'
      });
    }

    // Check if email is already used
    const existingEmail = await Tenant.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create tenant
    const tenant = await Tenant.create({
      name,
      subdomain: subdomain.toLowerCase(),
      email: email.toLowerCase(),
      phone,
      plan: plan || 'trial',
      maxUsers: maxUsers || 5,
      maxStorage: maxStorage || 1000,
      address,
      website,
      industry,
      status: 'active'
    });

    // Create admin user if provided
    if (adminUser) {
      const { firstName, lastName, email: adminEmail, password } = adminUser;

      // Find or create tenant admin role
      let tenantAdminRole = await Role.findOne({ name: 'tenant_admin' });
      if (!tenantAdminRole) {
        tenantAdminRole = await Role.create({
          name: 'tenant_admin',
          displayName: 'Tenant Admin',
          description: 'Administrator for a specific tenant',
          permissions: [
            'create_users', 'read_users', 'update_users', 'delete_users',
            'create_leads', 'read_leads', 'update_leads', 'delete_leads',
            'create_clients', 'read_clients', 'update_clients', 'delete_clients',
            'create_companies', 'read_companies', 'update_companies', 'delete_companies',
            'read_dashboard', 'manage_settings'
          ]
        });
      }

      const admin = await User.create({
        firstName,
        lastName,
        email: adminEmail.toLowerCase(),
        password,
        tenant: tenant._id,
        role: tenantAdminRole._id,
        isActive: true
      });

      // Update tenant with admin user
      tenant.adminUser = admin._id;
      tenant.currentUsers = 1;
      await tenant.save();
    }

    res.status(201).json({
      success: true,
      data: tenant,
      message: 'Tenant created successfully'
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message).join(', ');
      return res.status(400).json({
        success: false,
        message
      });
    }
    next(error);
  }
};

// @desc    Update tenant
// @route   PUT /api/super-admin/tenants/:id
// @access  Super Admin
exports.updateTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Check if subdomain is changing and available
    if (req.body.subdomain && req.body.subdomain !== tenant.subdomain) {
      const existingTenant = await Tenant.findOne({ 
        subdomain: req.body.subdomain.toLowerCase(),
        _id: { $ne: tenant._id }
      });
      if (existingTenant) {
        return res.status(400).json({
          success: false,
          message: 'Subdomain already exists'
        });
      }
    }

    // Update tenant
    const updatedTenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('adminUser', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: updatedTenant,
      message: 'Tenant updated successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message).join(', ');
      return res.status(400).json({
        success: false,
        message
      });
    }
    next(error);
  }
};

// @desc    Delete tenant
// @route   DELETE /api/super-admin/tenants/:id
// @access  Super Admin
exports.deleteTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Delete all related data
    await Promise.all([
      User.deleteMany({ tenant: tenant._id }),
      Lead.deleteMany({ tenant: tenant._id }),
      Client.deleteMany({ tenant: tenant._id }),
      Company.deleteMany({ tenant: tenant._id })
    ]);

    // Delete tenant
    await tenant.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Tenant and all related data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend tenant
// @route   PUT /api/super-admin/tenants/:id/suspend
// @access  Super Admin
exports.suspendTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { status: 'suspended' },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tenant,
      message: 'Tenant suspended successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate tenant
// @route   PUT /api/super-admin/tenants/:id/activate
// @access  Super Admin
exports.activateTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tenant,
      message: 'Tenant activated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/super-admin/dashboard
// @access  Super Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      totalUsers,
      totalLeads,
      totalClients
    ] = await Promise.all([
      Tenant.countDocuments(),
      Tenant.countDocuments({ status: 'active' }),
      Tenant.countDocuments({ plan: 'trial' }),
      User.countDocuments(),
      Lead.countDocuments(),
      Client.countDocuments()
    ]);

    // Get recent tenants
    const recentTenants = await Tenant.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name subdomain plan status createdAt');

    // Get monthly revenue (simplified calculation)
    const paidTenants = await Tenant.find({ 
      plan: { $ne: 'trial' },
      status: 'active'
    }).select('monthlyPrice plan');
    
    const monthlyRevenue = paidTenants.reduce((total, tenant) => total + tenant.monthlyPrice, 0);

    // Get plan distribution
    const planStats = await Tenant.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalTenants,
          activeTenants,
          trialTenants,
          suspendedTenants: totalTenants - activeTenants,
          totalUsers,
          totalLeads,
          totalClients,
          monthlyRevenue
        },
        planDistribution: planStats,
        recentTenants
      }
    });
  } catch (error) {
    next(error);
  }
};





