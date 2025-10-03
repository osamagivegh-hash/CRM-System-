const Tenant = require('../models/Tenant');

// Middleware to identify tenant from subdomain
exports.identifyTenant = async (req, res, next) => {
  try {
    let tenantId = null;
    let tenant = null;

    // Method 1: Check for subdomain
    const host = req.get('host') || req.get('x-forwarded-host') || '';
    const subdomain = host.split(':')[0].split('.')[0]; // Handle port numbers
    
    console.log('🌐 Host:', host);
    console.log('📍 Subdomain:', subdomain);

    // Skip tenant identification for super admin routes
    if (req.path.startsWith('/api/super-admin')) {
      console.log('🔓 Super admin route - skipping tenant identification');
      req.tenant = null;
      req.tenantId = null;
      return next();
    }

    // Method 2: Check for tenant header (useful for API clients)
    const tenantHeader = req.get('x-tenant-id');
    
    // Method 3: Check for tenant in JWT token (if user is authenticated)
    if (req.user && req.user.tenant) {
      tenantId = req.user.tenant;
      console.log('👤 Tenant from user token:', tenantId);
    }
    
    // Method 4: For localhost development - allow without tenant initially
    if (host.includes('localhost')) {
      console.log('🏠 Localhost development mode detected');
      if (req.user && req.user.tenant) {
        tenant = await Tenant.findById(req.user.tenant);
        if (tenant) {
          tenantId = tenant._id;
          console.log('🏠 Localhost development - using user tenant:', tenant.name);
        }
      } else {
        console.log('🏠 Localhost development - no user/tenant yet (probably login attempt)');
      }
    }
    
    // Try to find tenant by subdomain first
    if (subdomain && subdomain !== 'localhost' && subdomain !== '127' && subdomain !== 'www' && subdomain !== 'api') {
      tenant = await Tenant.findBySubdomain(subdomain);
      if (tenant) {
        tenantId = tenant._id;
        console.log('✅ Tenant found by subdomain:', tenant.name);
      }
    }
    
    // Fallback to tenant header
    if (!tenant && tenantHeader) {
      tenant = await Tenant.findById(tenantHeader);
      if (tenant) {
        tenantId = tenant._id;
        console.log('✅ Tenant found by header:', tenant.name);
      }
    }
    
    // Fallback to user's tenant
    if (!tenant && tenantId) {
      tenant = await Tenant.findById(tenantId);
      if (tenant) {
        console.log('✅ Tenant found from user:', tenant.name);
      }
    }

    // Check if tenant exists and is active
    if (tenant) {
      if (tenant.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: `Tenant account is ${tenant.status}`,
          tenantStatus: tenant.status
        });
      }

      // Check if trial has expired
      if (tenant.plan === 'trial' && !tenant.isTrialActive) {
        return res.status(403).json({
          success: false,
          message: 'Trial period has expired. Please upgrade your plan.',
          tenantStatus: 'trial_expired'
        });
      }

      // Update last activity
      tenant.updateLastActivity().catch(console.error);
    }

    // Attach tenant info to request
    req.tenant = tenant;
    req.tenantId = tenantId;
    
    console.log('🏢 Final tenant:', tenant?.name || 'None');
    next();
  } catch (error) {
    console.error('❌ Tenant identification error:', error);
    next(error);
  }
};

// Middleware to require tenant (except for super admin routes)
exports.requireTenant = (req, res, next) => {
  // Skip for super admin routes
  if (req.path.startsWith('/api/super-admin')) {
    return next();
  }

  // For localhost development, allow access if user has a tenant
  const host = req.get('host') || req.get('x-forwarded-host') || '';
  if (host.includes('localhost')) {
    console.log('🏠 Localhost development - skipping tenant requirement');
    return next();
  }

  if (!req.tenant || !req.tenantId) {
    return res.status(400).json({
      success: false,
      message: 'Tenant not identified. Please ensure you are accessing the correct subdomain.',
      code: 'TENANT_NOT_FOUND',
      debug: {
        host: host,
        subdomain: host.split(':')[0].split('.')[0],
        hasUser: !!req.user,
        userTenant: req.user?.tenant
      }
    });
  }
  
  next();
};

// Middleware to ensure data isolation by automatically filtering queries
exports.enforceDataIsolation = (req, res, next) => {
  // Skip for super admin routes
  if (req.path.startsWith('/api/super-admin')) {
    return next();
  }

  // Skip if no tenant (will be caught by requireTenant if needed)
  if (!req.tenantId) {
    return next();
  }

  // Store original query methods
  const originalFind = req.Model?.find;
  const originalFindOne = req.Model?.findOne;
  const originalFindById = req.Model?.findById;

  // Override query methods to automatically add tenant filter
  if (req.Model) {
    req.Model.find = function(filter = {}) {
      filter.tenant = req.tenantId;
      return originalFind.call(this, filter);
    };

    req.Model.findOne = function(filter = {}) {
      filter.tenant = req.tenantId;
      return originalFindOne.call(this, filter);
    };

    req.Model.findById = function(id, projection, options) {
      return originalFindOne.call(this, { _id: id, tenant: req.tenantId }, projection, options);
    };
  }

  next();
};

// Middleware to check tenant limits
exports.checkTenantLimits = (limitType) => {
  return async (req, res, next) => {
    try {
      if (!req.tenant) {
        return next();
      }

      switch (limitType) {
        case 'users':
          if (!req.tenant.canAddUser()) {
            return res.status(403).json({
              success: false,
              message: `User limit reached. Current plan allows ${req.tenant.maxUsers} users.`,
              limit: req.tenant.maxUsers,
              current: req.tenant.currentUsers
            });
          }
          break;

        case 'storage':
          const additionalStorage = req.body.fileSize || 0;
          if (!req.tenant.canAddStorage(additionalStorage)) {
            return res.status(403).json({
              success: false,
              message: `Storage limit reached. Current plan allows ${req.tenant.maxStorage}MB.`,
              limit: req.tenant.maxStorage,
              current: req.tenant.currentStorage
            });
          }
          break;

        default:
          console.warn('Unknown limit type:', limitType);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware to check tenant features
exports.requireFeature = (featureName) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant not identified'
      });
    }

    if (!req.tenant.hasFeature(featureName)) {
      return res.status(403).json({
        success: false,
        message: `This feature (${featureName}) is not available in your current plan.`,
        feature: featureName,
        plan: req.tenant.plan
      });
    }

    next();
  };
};

// Helper function to add tenant filter to query
exports.addTenantFilter = (query, tenantId) => {
  if (tenantId) {
    query.tenant = tenantId;
  }
  return query;
};

// Helper function to validate tenant access to resource
exports.validateTenantAccess = async (Model, resourceId, tenantId) => {
  if (!tenantId) return false;
  
  const resource = await Model.findOne({ _id: resourceId, tenant: tenantId });
  return !!resource;
};

