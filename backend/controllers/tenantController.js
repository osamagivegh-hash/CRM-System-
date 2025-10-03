const Tenant = require('../models/Tenant');
const User = require('../models/User');

// @desc    Get current tenant info
// @route   GET /api/tenant/info
// @access  Private (Tenant Users)
exports.getTenantInfo = async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Get tenant with populated admin user
    const tenant = await Tenant.findById(req.tenant._id)
      .populate('adminUser', 'firstName lastName email phone');

    // Get usage statistics
    const [userCount, activeUsers] = await Promise.all([
      User.countDocuments({ tenant: tenant._id }),
      User.countDocuments({ tenant: tenant._id, isActive: true })
    ]);

    // Update current user count
    if (tenant.currentUsers !== userCount) {
      tenant.currentUsers = userCount;
      await tenant.save();
    }

    res.status(200).json({
      success: true,
      data: {
        ...tenant.toObject(),
        stats: {
          users: userCount,
          activeUsers,
          usagePercent: {
            users: tenant.userUsagePercent,
            storage: tenant.storageUsagePercent
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tenant settings
// @route   PUT /api/tenant/settings
// @access  Private (Tenant Admin)
exports.updateTenantSettings = async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Only allow certain fields to be updated by tenant admin
    const allowedFields = [
      'name',
      'email',
      'phone',
      'address',
      'website',
      'industry',
      'settings',
      'branding'
    ];

    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    const tenant = await Tenant.findByIdAndUpdate(
      req.tenant._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: tenant,
      message: 'Tenant settings updated successfully'
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

// @desc    Get tenant usage statistics
// @route   GET /api/tenant/usage
// @access  Private (Tenant Admin)
exports.getTenantUsage = async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const tenant = req.tenant;
    
    // Get detailed usage statistics
    const [userCount, activeUsers, inactiveUsers] = await Promise.all([
      User.countDocuments({ tenant: tenant._id }),
      User.countDocuments({ tenant: tenant._id, isActive: true }),
      User.countDocuments({ tenant: tenant._id, isActive: false })
    ]);

    // Get users created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await User.countDocuments({
      tenant: tenant._id,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get user creation trend (last 7 days)
    const userTrend = await User.aggregate([
      {
        $match: {
          tenant: tenant._id,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        limits: {
          maxUsers: tenant.maxUsers,
          maxStorage: tenant.maxStorage
        },
        usage: {
          users: {
            total: userCount,
            active: activeUsers,
            inactive: inactiveUsers,
            recent: recentUsers,
            percentage: tenant.userUsagePercent,
            remaining: tenant.maxUsers - userCount
          },
          storage: {
            used: tenant.currentStorage,
            percentage: tenant.storageUsagePercent,
            remaining: tenant.maxStorage - tenant.currentStorage
          }
        },
        trends: {
          userCreation: userTrend
        },
        subscription: {
          plan: tenant.plan,
          status: tenant.status,
          isTrialActive: tenant.isTrialActive,
          trialDaysRemaining: tenant.trialDaysRemaining,
          isSubscriptionActive: tenant.isSubscriptionActive
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if tenant can perform action
// @route   POST /api/tenant/check-limit
// @access  Private (Tenant Users)
exports.checkLimit = async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const { action, quantity = 1 } = req.body;
    const tenant = req.tenant;

    let canPerform = false;
    let message = '';
    let limit = 0;
    let current = 0;

    switch (action) {
      case 'add_user':
        canPerform = tenant.canAddUser();
        limit = tenant.maxUsers;
        current = tenant.currentUsers;
        message = canPerform 
          ? 'User can be added'
          : `User limit reached. Current plan allows ${limit} users.`;
        break;

      case 'add_storage':
        const storageAmount = quantity; // in MB
        canPerform = tenant.canAddStorage(storageAmount);
        limit = tenant.maxStorage;
        current = tenant.currentStorage;
        message = canPerform
          ? 'Storage can be added'
          : `Storage limit reached. Current plan allows ${limit}MB.`;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action specified'
        });
    }

    res.status(200).json({
      success: true,
      data: {
        canPerform,
        message,
        limit,
        current,
        remaining: limit - current
      }
    });
  } catch (error) {
    next(error);
  }
};





