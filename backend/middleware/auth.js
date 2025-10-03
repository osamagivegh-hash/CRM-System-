const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id)
        .populate('tenant', 'name subdomain status plan features')
        .populate('company', 'name plan maxUsers')
        .populate('role', 'name permissions');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'No user found with this token'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      // Check if tenant is active (except for super admins)
      if (user.role && user.role.name !== 'super_admin' && user.tenant) {
        if (user.tenant.status !== 'active') {
          return res.status(403).json({
            success: false,
            message: `Tenant account is ${user.tenant.status}`,
            tenantStatus: user.tenant.status
          });
        }
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('🔐 AUTHORIZATION CHECK:');
    console.log('👤 User:', req.user?.firstName, req.user?.lastName);
    console.log('🔑 User Role:', req.user?.role?.name);
    console.log('📋 Required Roles:', roles);
    console.log('✅ Has Required Role:', req.user.role && roles.includes(req.user.role.name));
    
    if (!req.user.role || !roles.includes(req.user.role.name)) {
      console.log('❌ AUTHORIZATION FAILED');
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role?.name || 'unknown'}' is not authorized to access this route`
      });
    }
    
    console.log('✅ AUTHORIZATION PASSED');
    next();
  };
};

// Check specific permissions
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user.role || !req.user.role.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to ${permission}`
      });
    }
    next();
  };
};

// Check if user belongs to the same company or is admin
exports.sameCompanyOrAdmin = (req, res, next) => {
  const userCompanyId = req.user.company?._id?.toString();
  const targetCompanyId = req.params.companyId || req.body.company;

  if (req.user.role.name === 'super_admin' || 
      userCompanyId === targetCompanyId?.toString()) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your company data'
    });
  }
};

// Check if user belongs to the same tenant or is super admin
exports.sameTenantOrSuperAdmin = (req, res, next) => {
  const userTenantId = req.user.tenant?._id?.toString();
  const targetTenantId = req.params.tenantId || req.body.tenant || req.tenantId;

  if (req.user.role.name === 'super_admin' || 
      userTenantId === targetTenantId?.toString()) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your tenant data'
    });
  }
};

// Check if user is super admin or tenant admin
exports.requireSuperAdminOrTenantAdmin = (req, res, next) => {
  const userRole = req.user.role?.name;
  
  if (userRole === 'super_admin' || userRole === 'tenant_admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

