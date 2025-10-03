const { validationResult } = require('express-validator');
const Client = require('../models/Client');
const mongoose = require('mongoose');

// @desc    Get all clients for a company
// @route   GET /api/clients
// @access  Private
exports.getClients = async (req, res, next) => {
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

    // Overdue follow-ups
    if (req.query.overdue === 'true') {
      query.nextFollowUp = { $lt: new Date() };
    }

    const clients = await Client.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .populate('company', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(startIndex);

    // Get total count
    const total = await Client.countDocuments(query);

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
      count: clients.length,
      total,
      pagination,
      data: clients
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
exports.getClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email phone')
      .populate('company', 'name email')
      .populate('notes.createdBy', 'firstName lastName');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check access permissions
    if (req.user.role.name !== 'super_admin' && 
        client.company._id.toString() !== req.user.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new client
// @route   POST /api/clients
// @access  Private
exports.createClient = async (req, res, next) => {
  try {
    console.log('🚀 CLIENT CREATION REQUEST RECEIVED');
    console.log('📝 Request Body:', req.body);
    console.log('👤 User:', req.user?.firstName, req.user?.lastName);
    console.log('🏢 User Company:', req.user?.company);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation Errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Handle company and tenant assignment
    if (req.user.role.name === 'super_admin') {
      // Super admin can assign clients to specific companies
      if (req.body.company) {
        console.log('🔧 Super admin assigning client to company:', req.body.company);
        // Need to get the company's tenant
        const Company = require('../models/Company');
        const targetCompany = await Company.findById(req.body.company).populate('tenant');
        if (targetCompany) {
          req.body.tenant = targetCompany.tenant._id;
          console.log('✅ Using company tenant:', targetCompany.tenant.name);
        } else {
          return res.status(400).json({
            success: false,
            message: 'Specified company not found'
          });
        }
      } else if (req.user.company && req.user.company._id) {
        // Fallback to super admin's company if no company specified
        req.body.company = req.user.company._id;
        req.body.tenant = req.user.tenant._id;
        console.log('🔧 Super admin fallback to own company:', req.user.company._id);
      } else {
        console.log('❌ Super admin has no company and none specified');
        return res.status(400).json({
          success: false,
          message: 'Company must be specified for client creation'
        });
      }
    } else {
      // Regular users can only create clients for their own company
      if (!req.user.company || !req.user.company._id) {
        console.log('❌ User has no company assigned:', req.user);
        return res.status(400).json({
          success: false,
          message: 'User must belong to a company to create clients'
        });
      }
      req.body.company = req.user.company._id;
      req.body.tenant = req.user.tenant._id;
    }
    
    console.log('📦 Final data for client creation:', req.body);
    
    const client = await Client.create(req.body);
    console.log('✅ Client created successfully:', client._id);

    const populatedClient = await Client.findById(client._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('company', 'name');

    console.log('✅ CLIENT CREATION COMPLETED');
    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: populatedClient
    });
  } catch (error) {
    console.error('❌ CLIENT CREATION ERROR:', error);
    console.error('📊 Error Name:', error.name);
    console.error('📊 Error Message:', error.message);
    if (error.name === 'ValidationError') {
      console.error('📊 Validation Error Details:', error.errors);
    }
    next(error);
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
exports.updateClient = async (req, res, next) => {
  try {
    console.log('🚀 CLIENT UPDATE REQUEST RECEIVED');
    console.log('🆔 Client ID:', req.params.id);
    console.log('📝 Request Body:', req.body);
    console.log('👤 User:', req.user?.firstName, req.user?.lastName);
    console.log('🏢 User Company:', req.user?.company);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation Errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Handle company validation for updates
    if (req.user.role.name !== 'super_admin') {
      if (!req.user.company || !req.user.company._id) {
        console.log('❌ User has no company assigned:', req.user);
        return res.status(400).json({
          success: false,
          message: 'User must belong to a company to update clients'
        });
      }
    }

    let client = await Client.findById(req.params.id);
    console.log('🔍 Found Client:', client ? 'Yes' : 'No');

    if (!client) {
      console.log('❌ Client not found with ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    console.log('📊 Original Client Data:', {
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      companyName: client.companyName,
      company: client.company
    });

    // Check access permissions
    if (req.user.role.name !== 'super_admin' && 
        client.company.toString() !== req.user.company._id.toString()) {
      console.log('❌ Access denied for user:', req.user.firstName);
      console.log('📊 Client company:', client.company.toString());
      console.log('📊 User company:', req.user.company._id.toString());
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log('🔄 UPDATING CLIENT IN DATABASE...');
    console.log('📦 Update data:', req.body);
    
    client = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('assignedTo', 'firstName lastName email')
      .populate('company', 'name');

    console.log('✅ CLIENT UPDATED SUCCESSFULLY');
    console.log('📊 Updated Client Data:', {
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      companyName: client.companyName
    });

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: client
    });
  } catch (error) {
    console.error('❌ CLIENT UPDATE ERROR:', error);
    console.error('📊 Error Name:', error.name);
    console.error('📊 Error Message:', error.message);
    if (error.name === 'ValidationError') {
      console.error('📊 Validation Error Details:', error.errors);
    }
    console.error('📊 Error Stack:', error.stack);
    next(error);
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
exports.deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check access permissions
    if (req.user.role.name !== 'super_admin' && 
        client.company.toString() !== req.user.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await client.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add note to client
// @route   POST /api/clients/:id/notes
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

    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check access permissions
    if (req.user.role.name !== 'super_admin' && 
        client.company.toString() !== req.user.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { content, isPrivate = false } = req.body;

    await client.addNote(content, req.user.id, isPrivate);

    const updatedClient = await Client.findById(client._id)
      .populate('notes.createdBy', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: updatedClient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get client statistics
// @route   GET /api/clients/stats
// @access  Private
exports.getClientStats = async (req, res, next) => {
  try {
    const companyId = req.user.role.name === 'super_admin' 
      ? req.query.company 
      : req.user.company._id;

    const matchStage = companyId 
      ? { company: new mongoose.Types.ObjectId(companyId) }
      : {};

    const stats = await Client.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' },
          avgValue: { $avg: '$value' }
        }
      }
    ]);

    // Get overdue follow-ups count
    const overdueCount = await Client.countDocuments({
      ...matchStage,
      nextFollowUp: { $lt: new Date() }
    });

    // Get recent clients (last 30 days)
    const recentCount = await Client.countDocuments({
      ...matchStage,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const totalClients = await Client.countDocuments(matchStage);
    const totalValue = stats.reduce((sum, item) => sum + item.totalValue, 0);

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        totalClients,
        totalValue,
        overdueFollowUps: overdueCount,
        recentClients: recentCount
      }
    });
  } catch (error) {
    next(error);
  }
};
