const Role = require('../models/Role');

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private (Admin only)
exports.getRoles = async (req, res, next) => {
  try {
    let query = {};
    
    // Non-super admins can only see non-super admin roles
    if (req.user.role.name !== 'super_admin') {
      query.name = { $ne: 'super_admin' };
    }

    const roles = await Role.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (error) {
    next(error);
  }
};













