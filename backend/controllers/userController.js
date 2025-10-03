const { validationResult } = require('express-validator');
const User = require('../models/User');
const Company = require('../models/Company');
const Role = require('../models/Role');

// @desc    Get all users for a company
// @route   GET /api/users
// @access  Private (Company Admin, Manager, or Super Admin)
exports.getUsers = async (req, res, next) => {
  try {
    console.log('🚀 GET USERS REQUEST RECEIVED');
    console.log('👤 Requesting User:', req.user?.firstName, req.user?.lastName);
    console.log('🔑 Requesting User Role:', req.user?.role?.name);
    console.log('🏢 Requesting User Company:', req.user?.company?.name);
    console.log('🏢 Requesting User Tenant:', req.user?.tenant?.name);
    console.log('📊 Query Params:', req.query);
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query based on user role
    let query = {};
    
    if (req.user.role.name === 'super_admin') {
      // Super admin can see all users
      if (req.query.tenant) {
        query.tenant = req.query.tenant;
      }
      if (req.query.company) {
        query.company = req.query.company;
      }
    } else {
      // Others can only see users from their tenant
      query.tenant = req.user.tenant._id;
      console.log('🏢 Filtering by tenant:', req.user.tenant?.name);
      
      // For company filtering, be more flexible but secure
      if (req.user.company) {
        // If user has a company, default to showing users from same company
        query.company = req.user.company._id;
        console.log('🔒 Filtering by user company:', req.user.company.name);
      } else {
        // If user has no company, show all users in the tenant
        console.log('🔓 User has no company - showing all tenant users');
      }
      
      // Allow company admins to see users from other companies in their tenant
      if (req.user.role.name === 'company_admin' && req.query.company) {
        // Verify the requested company belongs to the same tenant
        const Company = require('../models/Company');
        const requestedCompany = await Company.findById(req.query.company);
        if (requestedCompany && requestedCompany.tenant.toString() === req.user.tenant._id.toString()) {
          query.company = req.query.company;
          console.log('✅ Company admin accessing company:', requestedCompany.name);
        } else {
          console.log('⚠️ SECURITY: Invalid company access attempt');
        }
      }
    }

    // Search functionality
    if (req.query.search) {
      query.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    // Filter by role
    if (req.query.role) {
      // If role is provided as a name (e.g., "super_admin"), find the role ID
      const Role = require('../models/Role');
      const roleDoc = await Role.findOne({ name: req.query.role });
      if (roleDoc) {
        query.role = roleDoc._id;
      } else {
        // If it's already an ObjectId, use it directly
        query.role = req.query.role;
      }
    }

    console.log('🔍 Final query:', JSON.stringify(query, null, 2));
    console.log('🔍 Query explanation:');
    console.log('  - Tenant filter:', query.tenant ? 'Applied' : 'None');
    console.log('  - Company filter:', query.company ? 'Applied' : 'None');
    console.log('  - Search filter:', query.$or ? 'Applied' : 'None');

    const users = await User.find(query)
      .populate('tenant', 'name subdomain')
      .populate('company', 'name email plan')
      .populate('role', 'name displayName permissions')
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(startIndex);

    console.log('📊 Query results:');
    console.log('  - Found users:', users.length);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`     Company: ${user.company?.name || 'None'}`);
      console.log(`     Tenant: ${user.tenant?.name || 'None'}`);
      console.log(`     Role: ${user.role?.name || 'None'}`);
    });

    // Get total count
    const total = await User.countDocuments(query);
    console.log('📊 Total users matching query:', total);

    // Pagination result
    const pagination = {};
    
    if (startIndex + limit < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Same company or Super Admin)
exports.getUser = async (req, res, next) => {
  try {
    console.log('🚀 GET USER REQUEST RECEIVED');
    console.log('📝 User ID:', req.params.id);
    console.log('👤 Requesting User:', req.user?.firstName, req.user?.lastName);
    console.log('🔑 Requesting User Role:', req.user?.role?.name);
    
    const user = await User.findById(req.params.id)
      .populate('tenant', 'name subdomain plan status')
      .populate('company', 'name email plan maxUsers currentUsers')
      .populate('role', 'name displayName permissions')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user can access this user's data
    if (req.user.role.name !== 'super_admin') {
      // Check tenant access first
      if (user.tenant._id.toString() !== req.user.tenant._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - different tenant'
        });
      }
      
      // Then check company access (if both users have companies)
      if (user.company && req.user.company && 
          user.company._id.toString() !== req.user.company._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - different company'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Company Admin or Super Admin)
exports.createUser = async (req, res, next) => {
  try {
    console.log('🚀 USER CREATION REQUEST RECEIVED');
    console.log('📝 Request Body:', req.body);
    console.log('👤 Requesting User:', req.user?.firstName, req.user?.lastName);
    console.log('🔑 Requesting User Role:', req.user?.role?.name);
    console.log('🏢 Requesting User Company:', req.user?.company?.name);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation Errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, phone, role, company, tenant } = req.body;

    // Clean up empty strings for ObjectId fields
    const cleanCompany = company && company !== '' ? company : undefined;
    const cleanTenant = tenant && tenant !== '' ? tenant : undefined;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Determine tenant and company ID
    let tenantId, companyId;
    if (req.user.role.name === 'super_admin') {
      tenantId = cleanTenant || req.user.tenant?._id;
      companyId = cleanCompany;
      console.log('👑 Super admin creating user:');
      console.log('  - Target tenant:', tenantId);
      console.log('  - Target company:', companyId);
    } else {
      tenantId = req.user.tenant._id;
      companyId = cleanCompany || req.user.company?._id;
      console.log('👤 Regular user creating user:');
      console.log('  - User tenant:', req.user.tenant?.name);
      console.log('  - User company:', req.user.company?.name);
      console.log('  - Target tenant:', tenantId);
      console.log('  - Target company:', companyId);
    }

    // Check tenant user limit
    const Tenant = require('../models/Tenant');
    const targetTenant = await Tenant.findById(tenantId);
    if (!targetTenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    if (!targetTenant.canAddUser()) {
      return res.status(400).json({
        success: false,
        message: `Tenant has reached maximum user limit (${targetTenant.maxUsers})`
      });
    }

    // Check company if specified
    let targetCompany = null;
    if (companyId) {
      targetCompany = await Company.findById(companyId);
      if (!targetCompany) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }
      
      // Ensure company belongs to the same tenant
      if (targetCompany.tenant.toString() !== tenantId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Company does not belong to the specified tenant'
        });
      }
    }

    // Validate role
    const userRole = await Role.findById(role);
    if (!userRole) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Only super admin can create super admin users
    if (userRole.name === 'super_admin' && req.user.role.name !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can create super admin users'
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      tenant: tenantId,
      company: companyId,
      role
    });

    // Update tenant user count
    targetTenant.currentUsers += 1;
    await targetTenant.save();

    // Update company user count if company is specified
    if (targetCompany) {
      targetCompany.currentUsers += 1;
      targetCompany.calculatePricing();
      await targetCompany.save();
    }

    // Get populated user for response
    const populatedUser = await User.findById(user._id)
      .populate('tenant', 'name subdomain')
      .populate('company', 'name email plan maxUsers currentUsers')
      .populate('role', 'name displayName permissions')
      .select('-password');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: populatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Company Admin, Super Admin, or own profile)
exports.updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    const isSameUser = user._id.toString() === req.user.id;
    const isSameCompany = user.company.toString() === req.user.company._id.toString();
    const isAuthorized = req.user.role.name === 'super_admin' || 
                        (isSameCompany && ['company_admin', 'manager'].includes(req.user.role.name)) ||
                        isSameUser;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Restrict certain fields based on permissions
    const updateData = { ...req.body };
    
    // Only admins can change role, company, and isActive
    if (!['super_admin', 'company_admin'].includes(req.user.role.name)) {
      delete updateData.role;
      delete updateData.company;
      delete updateData.isActive;
    }

    // Users can't change their own role or active status
    if (isSameUser) {
      delete updateData.role;
      delete updateData.isActive;
    }

    // Don't allow password updates through this endpoint
    delete updateData.password;

    user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('company', 'name email plan maxUsers currentUsers')
      .populate('role', 'name displayName permissions')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Deactivate user
// @route   DELETE /api/users/:id
// @access  Private (Company Admin or Super Admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user can delete this user
    const isSameCompany = user.company.toString() === req.user.company._id.toString();
    const canDelete = req.user.role.name === 'super_admin' || 
                     (isSameCompany && req.user.role.name === 'company_admin');

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Can't delete yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Soft delete (deactivate) instead of hard delete
    user.isActive = false;
    await user.save();

    // Update company user count
    const company = await Company.findById(user.company);
    if (company) {
      company.currentUsers = Math.max(0, company.currentUsers - 1);
      company.calculatePricing();
      await company.save();
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate user
// @route   PUT /api/users/:id/activate
// @access  Private (Company Admin or Super Admin)
exports.activateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'User is already active'
      });
    }

    // Check company user limit
    const company = await Company.findById(user.company);
    if (company.currentUsers >= company.maxUsers) {
      return res.status(400).json({
        success: false,
        message: `Company has reached maximum user limit (${company.maxUsers})`
      });
    }

    // Activate user
    user.isActive = true;
    await user.save();

    // Update company user count
    company.currentUsers += 1;
    company.calculatePricing();
    await company.save();

    const populatedUser = await User.findById(user._id)
      .populate('company', 'name email plan maxUsers currentUsers')
      .populate('role', 'name displayName permissions')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'User activated successfully',
      data: populatedUser
    });
  } catch (error) {
    next(error);
  }
};

