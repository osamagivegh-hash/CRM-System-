const { validationResult } = require('express-validator');
const User = require('../models/User');
const Company = require('../models/Company');
const Tenant = require('../models/Tenant');
const Role = require('../models/Role');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      tenantName, 
      tenantEmail, 
      subdomain,
      phone, 
      plan,
      companyName,
      website,
      industry
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if tenant already exists
    const existingTenant = await Tenant.findOne({ 
      $or: [
        { email: tenantEmail },
        { subdomain: subdomain.toLowerCase() }
      ]
    });
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant already exists with this email or subdomain'
      });
    }

    // Create tenant first
    const tenant = await Tenant.create({
      name: tenantName,
      email: tenantEmail,
      subdomain: subdomain.toLowerCase(),
      phone,
      plan: plan || 'trial',
      website,
      industry,
      currentUsers: 1,
      status: 'active'
    });

    // Create company within tenant if specified
    let company = null;
    if (companyName) {
      company = await Company.create({
        name: companyName,
        email: tenantEmail, // Use tenant email as default
        tenant: tenant._id,
        phone,
        website,
        industry,
        currentUsers: 1,
        isActive: true
      });
    }

    // Get tenant admin role
    let adminRole = await Role.findOne({ name: 'tenant_admin' });
    if (!adminRole) {
      // Create default roles if they don't exist
      adminRole = await Role.create({
        name: 'tenant_admin',
        displayName: 'Tenant Administrator',
        description: 'Full access to tenant data and settings',
        permissions: [
          'create_users', 'read_users', 'update_users', 'delete_users',
          'create_companies', 'read_companies', 'update_companies', 'delete_companies',
          'create_clients', 'read_clients', 'update_clients', 'delete_clients',
          'create_leads', 'read_leads', 'update_leads', 'delete_leads',
          'read_dashboard', 'view_analytics', 'manage_settings'
        ],
        isSystemRole: true
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      tenant: tenant._id,
      company: company?._id,
      role: adminRole._id,
      emailVerified: true // Auto-verify first user
    });

    // Set tenant admin user
    tenant.adminUser = user._id;
    await tenant.save();

    // Calculate and update company pricing if company exists
    if (company) {
      company.calculatePricing();
      await company.save();
    }

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Get user with populated fields for response
    const populatedUser = await User.findById(user._id)
      .populate('tenant', 'name subdomain plan status features')
      .populate('company', 'name email plan maxUsers currentUsers monthlyPrice')
      .populate('role', 'name displayName permissions')
      .select('-password');

    res.status(201).json({
      success: true,
      message: 'Tenant and user registered successfully',
      token,
      user: populatedUser,
      tenant: {
        name: tenant.name,
        subdomain: tenant.subdomain,
        url: `https://${tenant.subdomain}.${process.env.DOMAIN || 'mycrm.com'}`
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check for user and include password
    const user = await User.findOne({ email })
      .populate('tenant', 'name subdomain plan status features')
      .populate('company', 'name email plan maxUsers currentUsers monthlyPrice isActive')
      .populate('role', 'name displayName permissions')
      .select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if tenant is active (except for super admin)
    if (user.role.name !== 'super_admin' && user.tenant) {
      if (user.tenant.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: `Tenant account is ${user.tenant.status}`,
          tenantStatus: user.tenant.status
        });
      }

      // Check if trial has expired
      if (user.tenant.plan === 'trial' && !user.tenant.isTrialActive) {
        return res.status(401).json({
          success: false,
          message: 'Trial period has expired. Please upgrade your plan.',
          tenantStatus: 'trial_expired'
        });
      }
    }

    // Check if company is active (if user has company)
    if (user.company && !user.company.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Company account is suspended'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('tenant', 'name subdomain plan status features maxUsers currentUsers')
      .populate('company', 'name email plan maxUsers currentUsers monthlyPrice')
      .populate('role', 'name displayName permissions')
      .select('-password');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, phone, preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        phone,
        preferences
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate('company', 'name email plan maxUsers currentUsers monthlyPrice')
      .populate('role', 'name displayName permissions')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // In a stateless JWT system, logout is handled on the client side
    // But we can blacklist the token if needed (requires additional implementation)
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};








