const { validationResult } = require('express-validator');
const Lead = require('../models/Lead');
const mongoose = require('mongoose');

// @desc    Get all leads for a company
// @route   GET /api/leads
// @access  Private
exports.getLeads = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query based on user role
    let query = {};
    
    if (req.user.role.name === 'super_admin') {
      if (req.query.company) {
        query.company = req.query.company;
      }
    } else {
      query.company = req.user.company._id;
    }

    // Search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by priority
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    // Filter by assigned user
    if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    // Filter by tags
    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      query.tags = { $in: tags };
    }

    // Date filters
    if (req.query.createdFrom || req.query.createdTo) {
      query.createdAt = {};
      if (req.query.createdFrom) {
        query.createdAt.$gte = new Date(req.query.createdFrom);
      }
      if (req.query.createdTo) {
        query.createdAt.$lte = new Date(req.query.createdTo);
      }
    }

    // Expected close date filters
    if (req.query.closingFrom || req.query.closingTo) {
      query.expectedCloseDate = {};
      if (req.query.closingFrom) {
        query.expectedCloseDate.$gte = new Date(req.query.closingFrom);
      }
      if (req.query.closingTo) {
        query.expectedCloseDate.$lte = new Date(req.query.closingTo);
      }
    }

    // Overdue leads
    if (req.query.overdue === 'true') {
      query.expectedCloseDate = { $lt: new Date() };
      query.status = { $nin: ['closed_won', 'closed_lost'] };
    }

    const leads = await Lead.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .populate('company', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(startIndex);

    // Get total count
    const total = await Lead.countDocuments(query);

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
      count: leads.length,
      total,
      pagination,
      data: leads
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
exports.getLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email phone')
      .populate('company', 'name email')
      .populate('notes.createdBy', 'firstName lastName')
      .populate('activities.createdBy', 'firstName lastName')
      .populate('clientId', 'firstName lastName email status');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check access permissions
    if (req.user.role.name !== 'super_admin' && 
        lead.company._id.toString() !== req.user.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new lead
// @route   POST /api/leads
// @access  Private
exports.createLead = async (req, res, next) => {
  try {
    console.log('🚀 CREATE LEAD REQUEST RECEIVED');
    console.log('📝 Request Body:', req.body);
    console.log('👤 Requesting User:', req.user?.firstName, req.user?.lastName);
    console.log('🏢 User Company:', req.user?.company?.name);
    console.log('🏢 User Tenant:', req.user?.tenant?.name);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation Errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Add tenant and company from requesting user
    req.body.tenant = req.user.tenant._id;
    req.body.company = req.user.company._id;
    
    console.log('✅ Lead data prepared:', {
      tenant: req.user.tenant.name,
      company: req.user.company.name,
      leadName: `${req.body.firstName} ${req.body.lastName}`
    });
    
    const lead = await Lead.create(req.body);

    const populatedLead = await Lead.findById(lead._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('company', 'name');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: populatedLead
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
exports.updateLead = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check access permissions
    if (req.user.role.name !== 'super_admin' && 
        lead.company.toString() !== req.user.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('assignedTo', 'firstName lastName email')
      .populate('company', 'name');

    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private
exports.deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check access permissions
    if (req.user.role.name !== 'super_admin' && 
        lead.company.toString() !== req.user.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await lead.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add note to lead
// @route   POST /api/leads/:id/notes
// @access  Private
exports.addNote = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check access permissions
    if (req.user.role.name !== 'super_admin' && 
        lead.company.toString() !== req.user.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { content, isPrivate = false } = req.body;

    await lead.addNote(content, req.user.id, isPrivate);

    const updatedLead = await Lead.findById(lead._id)
      .populate('notes.createdBy', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: updatedLead
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add activity to lead
// @route   POST /api/leads/:id/activities
// @access  Private
exports.addActivity = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check access permissions
    if (req.user.role.name !== 'super_admin' && 
        lead.company.toString() !== req.user.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await lead.addActivity(req.body, req.user.id);

    const updatedLead = await Lead.findById(lead._id)
      .populate('activities.createdBy', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Activity added successfully',
      data: updatedLead
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Convert lead to client
// @route   POST /api/leads/:id/convert
// @access  Private
exports.convertToClient = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check access permissions
    if (req.user.role.name !== 'super_admin' && 
        lead.company.toString() !== req.user.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const client = await lead.convertToClient();

    res.status(200).json({
      success: true,
      message: 'Lead converted to client successfully',
      data: {
        lead,
        client
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get lead statistics
// @route   GET /api/leads/stats
// @access  Private
exports.getLeadStats = async (req, res, next) => {
  try {
    const companyId = req.user.role.name === 'super_admin' 
      ? req.query.company 
      : req.user.company._id;

    const matchStage = companyId 
      ? { company: new mongoose.Types.ObjectId(companyId) }
      : {};

    const [statusStats, priorityStats, sourceStats] = await Promise.all([
      // Status statistics
      Lead.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$estimatedValue' },
            weightedValue: { $sum: { $multiply: ['$estimatedValue', { $divide: ['$probability', 100] }] } },
            avgProbability: { $avg: '$probability' }
          }
        }
      ]),

      // Priority statistics
      Lead.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
            totalValue: { $sum: '$estimatedValue' }
          }
        }
      ]),

      // Source statistics
      Lead.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 },
            conversionRate: {
              $avg: { $cond: [{ $eq: ['$status', 'closed_won'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    // Get overdue leads count
    const overdueCount = await Lead.countDocuments({
      ...matchStage,
      expectedCloseDate: { $lt: new Date() },
      status: { $nin: ['closed_won', 'closed_lost'] }
    });

    // Get recent leads (last 30 days)
    const recentCount = await Lead.countDocuments({
      ...matchStage,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const totalLeads = await Lead.countDocuments(matchStage);
    const totalValue = statusStats.reduce((sum, item) => sum + item.totalValue, 0);
    const totalWeightedValue = statusStats.reduce((sum, item) => sum + item.weightedValue, 0);

    res.status(200).json({
      success: true,
      data: {
        byStatus: statusStats,
        byPriority: priorityStats,
        bySource: sourceStats,
        totalLeads,
        totalValue,
        totalWeightedValue,
        overdueLeads: overdueCount,
        recentLeads: recentCount
      }
    });
  } catch (error) {
    next(error);
  }
};