const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Company = require('../models/Company');
const User = require('../models/User');

// @desc    Get all companies (Super Admin only)
// @route   GET /api/companies
// @access  Private (Super Admin)
exports.getCompanies = async (req, res, next) => {
  try {
    console.log('🚀 GET COMPANIES REQUEST RECEIVED');
    console.log('👤 User:', req.user?.firstName, req.user?.lastName);
    console.log('🔑 User Role:', req.user?.role?.name);
    console.log('🏢 User Company:', req.user?.company?.name);
    console.log('📊 Query Params:', req.query);
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};
    
    // Search functionality
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    // Filter by plan
    if (req.query.plan) {
      query.plan = req.query.plan;
    }

    // Execute query
    const companies = await Company.find(query)
      .populate('activeUsersCount')
      .populate('clientsCount')
      .populate('leadsCount')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(startIndex);

    // Get total count
    const total = await Company.countDocuments(query);

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
      count: companies.length,
      total,
      pagination,
      data: companies
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single company
// @route   GET /api/companies/:id
// @access  Private (Same company or Super Admin)
exports.getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('activeUsersCount')
      .populate('clientsCount')
      .populate('leadsCount');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private (Company Admin or Super Admin)
exports.updateCompany = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Only super admin can update certain fields
    const restrictedFields = ['plan', 'maxUsers', 'isActive', 'subscriptionStart', 'subscriptionEnd'];
    const updateData = { ...req.body };

    if (req.user.role.name !== 'super_admin') {
      restrictedFields.forEach(field => {
        delete updateData[field];
      });
    }

    company = await Company.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: company
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private (Super Admin only)
exports.deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if company has active users
    const activeUsers = await User.countDocuments({ 
      company: company._id, 
      isActive: true 
    });

    if (activeUsers > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete company with active users. Deactivate users first.'
      });
    }

    await company.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get company statistics
// @route   GET /api/companies/:id/stats
// @access  Private (Same company or Super Admin)
exports.getCompanyStats = async (req, res, next) => {
  try {
    const companyId = req.params.id;

    // Aggregate statistics
    const [userStats, clientStats, leadStats] = await Promise.all([
      User.aggregate([
        { $match: { company: new mongoose.Types.ObjectId(companyId) } },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            inactiveUsers: {
              $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
            }
          }
        }
      ]),
      
      mongoose.model('Client').aggregate([
        { $match: { company: new mongoose.Types.ObjectId(companyId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$value' }
          }
        }
      ]),
      
      mongoose.model('Lead').aggregate([
        { $match: { company: new mongoose.Types.ObjectId(companyId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$estimatedValue' },
            weightedValue: { $sum: { $multiply: ['$estimatedValue', { $divide: ['$probability', 100] }] } }
          }
        }
      ])
    ]);

    // Get company info
    const company = await Company.findById(companyId);

    const stats = {
      company: {
        name: company.name,
        plan: company.plan,
        maxUsers: company.maxUsers,
        currentUsers: company.currentUsers,
        monthlyPrice: company.monthlyPrice
      },
      users: userStats[0] || { totalUsers: 0, activeUsers: 0, inactiveUsers: 0 },
      clients: {
        byStatus: clientStats,
        total: clientStats.reduce((sum, item) => sum + item.count, 0),
        totalValue: clientStats.reduce((sum, item) => sum + item.totalValue, 0)
      },
      leads: {
        byStatus: leadStats,
        total: leadStats.reduce((sum, item) => sum + item.count, 0),
        totalValue: leadStats.reduce((sum, item) => sum + item.totalValue, 0),
        weightedValue: leadStats.reduce((sum, item) => sum + item.weightedValue, 0)
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new company
// @route   POST /api/companies
// @access  Private (Super Admin only)
exports.createCompany = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    console.log('🚀 CREATE COMPANY REQUEST RECEIVED');
    console.log('📝 Request Body:', req.body);
    console.log('👤 Requesting User:', req.user?.firstName, req.user?.lastName);
    console.log('🔑 Requesting User Role:', req.user?.role?.name);
    console.log('🏢 Requesting User Tenant:', req.user?.tenant?.name);

    let companyData = { ...req.body };

    // Handle tenant assignment
    if (req.user.role.name === 'super_admin') {
      // Super admin can create companies for any tenant
      if (!companyData.tenant) {
        // If no tenant specified, create a new tenant
        const Tenant = require('../models/Tenant');
        
        // Generate subdomain from company name
        let subdomain = companyData.name
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '') // Remove spaces
          .replace(/[^a-z0-9-]/g, '') // Keep only letters, numbers, and hyphens
          .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
          .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen

        // Ensure subdomain meets requirements
        if (subdomain.length < 2) {
          subdomain = `company${Date.now()}`.slice(0, 30);
        }
        if (subdomain.length > 30) {
          subdomain = subdomain.slice(0, 30);
        }

        console.log('🔗 Generated subdomain:', subdomain, 'from company name:', companyData.name);

        // Check if subdomain already exists and generate alternative if needed
        let finalSubdomain = subdomain;
        let counter = 1;
        while (await Tenant.findOne({ subdomain: finalSubdomain })) {
          finalSubdomain = `${subdomain}${counter}`;
          if (finalSubdomain.length > 30) {
            finalSubdomain = `${subdomain.slice(0, 28)}${counter}`;
          }
          counter++;
          
          // Prevent infinite loop
          if (counter > 100) {
            finalSubdomain = `company${Date.now()}`.slice(0, 30);
            break;
          }
        }
        
        console.log('✅ Final subdomain:', finalSubdomain);

        // Create new tenant
        const tenant = await Tenant.create({
          name: companyData.name,
          subdomain: finalSubdomain,
          email: companyData.email,
          plan: companyData.plan || 'starter',
          status: 'active',
          features: {
            maxUsers: companyData.maxUsers || 10,
            maxCompanies: 1,
            analytics: true,
            customBranding: (companyData.plan === 'enterprise'),
            apiAccess: (companyData.plan !== 'starter'),
            advancedReporting: (companyData.plan === 'enterprise'),
            multiLanguage: false,
            customFields: (companyData.plan !== 'starter')
          }
        });

        companyData.tenant = tenant._id;
        console.log('✅ New tenant created:', tenant.name, 'with subdomain:', tenant.subdomain);
      }
    } else {
      // Non-super admin users can only create companies within their tenant
      companyData.tenant = req.user.tenant._id;
      console.log('🏢 Using user tenant:', req.user.tenant.name);
    }

    const company = await Company.create(companyData);

    // Populate tenant information for response
    await company.populate('tenant', 'name subdomain plan status');

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company
    });
  } catch (error) {
    console.error('❌ Company creation error:', error);
    next(error);
  }
};

// @desc    Update company plan
// @route   PUT /api/companies/:id/plan
// @access  Private (Super Admin only)
exports.updateCompanyPlan = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { plan, maxUsers } = req.body;

    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if new maxUsers is not less than current users
    if (maxUsers < company.currentUsers) {
      return res.status(400).json({
        success: false,
        message: `Cannot set max users (${maxUsers}) below current users (${company.currentUsers})`
      });
    }

    company.plan = plan;
    company.maxUsers = maxUsers;
    company.calculatePricing();
    await company.save();

    res.status(200).json({
      success: true,
      message: 'Company plan updated successfully',
      data: company
    });
  } catch (error) {
    next(error);
  }
};
