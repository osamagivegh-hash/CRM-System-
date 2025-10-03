const User = require('../models/User');
const Company = require('../models/Company');
const Client = require('../models/Client');
const Lead = require('../models/Lead');
const mongoose = require('mongoose');

// @desc    Get dashboard overview
// @route   GET /api/dashboard/overview
// @access  Private
exports.getDashboardOverview = async (req, res, next) => {
  try {
    const companyId = req.user.role.name === 'super_admin' 
      ? req.query.company 
      : req.user.company._id;

    const matchStage = companyId 
      ? { company: new mongoose.Types.ObjectId(companyId) }
      : {};

    // Get basic counts
    const [
      totalUsers,
      activeUsers,
      totalClients,
      activeClients,
      totalLeads,
      openLeads,
      company
    ] = await Promise.all([
      User.countDocuments(matchStage),
      User.countDocuments({ ...matchStage, isActive: true }),
      Client.countDocuments(matchStage),
      Client.countDocuments({ ...matchStage, status: 'active' }),
      Lead.countDocuments(matchStage),
      Lead.countDocuments({ 
        ...matchStage, 
        status: { $nin: ['closed_won', 'closed_lost'] } 
      }),
      companyId ? Company.findById(companyId) : null
    ]);

    // Get revenue data
    const revenueData = await Client.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$value' },
          averageDealSize: { $avg: '$value' }
        }
      }
    ]);

    // Get pipeline value
    const pipelineData = await Lead.aggregate([
      { 
        $match: { 
          ...matchStage,
          status: { $nin: ['closed_won', 'closed_lost'] }
        }
      },
      {
        $group: {
          _id: null,
          totalPipelineValue: { $sum: '$estimatedValue' },
          weightedPipelineValue: { 
            $sum: { 
              $multiply: ['$estimatedValue', { $divide: ['$probability', 100] }] 
            } 
          }
        }
      }
    ]);

    // Recent activities (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [recentClients, recentLeads, recentConversions] = await Promise.all([
      Client.countDocuments({ 
        ...matchStage, 
        createdAt: { $gte: thirtyDaysAgo } 
      }),
      Lead.countDocuments({ 
        ...matchStage, 
        createdAt: { $gte: thirtyDaysAgo } 
      }),
      Lead.countDocuments({ 
        ...matchStage, 
        convertedToClient: true,
        convertedDate: { $gte: thirtyDaysAgo }
      })
    ]);

    const overview = {
      company: company ? {
        name: company.name,
        plan: company.plan,
        maxUsers: company.maxUsers,
        currentUsers: company.currentUsers,
        monthlyPrice: company.monthlyPrice
      } : null,
      users: {
        total: totalUsers,
        active: activeUsers
      },
      clients: {
        total: totalClients,
        active: activeClients
      },
      leads: {
        total: totalLeads,
        open: openLeads
      },
      revenue: {
        total: revenueData[0]?.totalRevenue || 0,
        average: revenueData[0]?.averageDealSize || 0
      },
      pipeline: {
        total: pipelineData[0]?.totalPipelineValue || 0,
        weighted: pipelineData[0]?.weightedPipelineValue || 0
      },
      recent: {
        clients: recentClients,
        leads: recentLeads,
        conversions: recentConversions
      }
    };

    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales funnel data
// @route   GET /api/dashboard/funnel
// @access  Private
exports.getSalesFunnel = async (req, res, next) => {
  try {
    const companyId = req.user.role.name === 'super_admin' 
      ? req.query.company 
      : req.user.company._id;

    const matchStage = companyId 
      ? { company: new mongoose.Types.ObjectId(companyId) }
      : {};

    const funnelData = await Lead.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$estimatedValue' },
          weightedValue: { 
            $sum: { 
              $multiply: ['$estimatedValue', { $divide: ['$probability', 100] }] 
            } 
          }
        }
      },
      {
        $sort: {
          '_id': 1
        }
      }
    ]);

    // Define funnel stages order
    const stageOrder = [
      'new', 'contacted', 'qualified', 'proposal', 
      'negotiation', 'closed_won', 'closed_lost'
    ];

    // Organize data by stage order
    const organizedFunnel = stageOrder.map(stage => {
      const stageData = funnelData.find(item => item._id === stage);
      return {
        stage,
        count: stageData?.count || 0,
        totalValue: stageData?.totalValue || 0,
        weightedValue: stageData?.weightedValue || 0
      };
    });

    res.status(200).json({
      success: true,
      data: organizedFunnel
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get performance metrics
// @route   GET /api/dashboard/performance
// @access  Private
exports.getPerformanceMetrics = async (req, res, next) => {
  try {
    const companyId = req.user.role.name === 'super_admin' 
      ? req.query.company 
      : req.user.company._id;

    const matchStage = companyId 
      ? { company: new mongoose.Types.ObjectId(companyId) }
      : {};

    // Get time period from query (default to last 6 months)
    const months = parseInt(req.query.months) || 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Monthly performance data
    const monthlyPerformance = await Lead.aggregate([
      { 
        $match: { 
          ...matchStage,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          leadsCreated: { $sum: 1 },
          leadsConverted: {
            $sum: { $cond: [{ $eq: ['$status', 'closed_won'] }, 1, 0] }
          },
          revenue: {
            $sum: { 
              $cond: [
                { $eq: ['$status', 'closed_won'] }, 
                '$estimatedValue', 
                0
              ] 
            }
          }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      }
    ]);

    // User performance
    const userPerformance = await Lead.aggregate([
      { 
        $match: { 
          ...matchStage,
          assignedTo: { $exists: true },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          leadsAssigned: { $sum: 1 },
          leadsConverted: {
            $sum: { $cond: [{ $eq: ['$status', 'closed_won'] }, 1, 0] }
          },
          revenue: {
            $sum: { 
              $cond: [
                { $eq: ['$status', 'closed_won'] }, 
                '$estimatedValue', 
                0
              ] 
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          email: '$user.email',
          leadsAssigned: 1,
          leadsConverted: 1,
          conversionRate: {
            $cond: [
              { $eq: ['$leadsAssigned', 0] },
              0,
              { $multiply: [{ $divide: ['$leadsConverted', '$leadsAssigned'] }, 100] }
            ]
          },
          revenue: 1
        }
      },
      {
        $sort: { revenue: -1 }
      }
    ]);

    // Source performance
    const sourcePerformance = await Lead.aggregate([
      { 
        $match: { 
          ...matchStage,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $eq: ['$status', 'closed_won'] }, 1, 0] }
          },
          revenue: {
            $sum: { 
              $cond: [
                { $eq: ['$status', 'closed_won'] }, 
                '$estimatedValue', 
                0
              ] 
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          source: '$_id',
          count: 1,
          converted: 1,
          conversionRate: {
            $cond: [
              { $eq: ['$count', 0] },
              0,
              { $multiply: [{ $divide: ['$converted', '$count'] }, 100] }
            ]
          },
          revenue: 1
        }
      },
      {
        $sort: { revenue: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        monthly: monthlyPerformance,
        users: userPerformance,
        sources: sourcePerformance
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming tasks and follow-ups
// @route   GET /api/dashboard/tasks
// @access  Private
exports.getUpcomingTasks = async (req, res, next) => {
  try {
    const companyId = req.user.role.name === 'super_admin' 
      ? req.query.company 
      : req.user.company._id;

    const matchStage = companyId 
      ? { company: new mongoose.Types.ObjectId(companyId) }
      : {};

    // Get upcoming follow-ups for clients
    const clientFollowUps = await Client.find({
      ...matchStage,
      nextFollowUp: { 
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      }
    })
      .populate('assignedTo', 'firstName lastName email')
      .select('firstName lastName email nextFollowUp assignedTo')
      .sort({ nextFollowUp: 1 })
      .limit(20);

    // Get upcoming activities for leads
    const leadActivities = await Lead.find({
      ...matchStage,
      'activities.scheduledDate': {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      },
      'activities.status': 'scheduled'
    })
      .populate('assignedTo', 'firstName lastName email')
      .select('firstName lastName email activities assignedTo')
      .sort({ 'activities.scheduledDate': 1 })
      .limit(20);

    // Get overdue items
    const overdueClients = await Client.countDocuments({
      ...matchStage,
      nextFollowUp: { $lt: new Date() }
    });

    const overdueLeads = await Lead.countDocuments({
      ...matchStage,
      expectedCloseDate: { $lt: new Date() },
      status: { $nin: ['closed_won', 'closed_lost'] }
    });

    res.status(200).json({
      success: true,
      data: {
        clientFollowUps,
        leadActivities,
        overdue: {
          clients: overdueClients,
          leads: overdueLeads
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales funnel data
// @route   GET /api/dashboard/funnel
// @access  Private
exports.getSalesFunnel = async (req, res, next) => {
  try {
    const companyId = req.user.role.name === 'super_admin' 
      ? req.query.company 
      : req.user.company._id;

    const matchStage = companyId 
      ? { company: new mongoose.Types.ObjectId(companyId) }
      : {};

    const funnelData = await Lead.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$estimatedValue' },
          weightedValue: { 
            $sum: { 
              $multiply: ['$estimatedValue', { $divide: ['$probability', 100] }] 
            } 
          }
        }
      },
      {
        $sort: {
          '_id': 1
        }
      }
    ]);

    // Define funnel stages order
    const stageOrder = [
      'new', 'contacted', 'qualified', 'proposal', 
      'negotiation', 'closed_won', 'closed_lost'
    ];

    // Organize data by stage order
    const organizedFunnel = stageOrder.map(stage => {
      const stageData = funnelData.find(item => item._id === stage);
      return {
        stage,
        count: stageData?.count || 0,
        totalValue: stageData?.totalValue || 0,
        weightedValue: stageData?.weightedValue || 0
      };
    });

    res.status(200).json({
      success: true,
      data: organizedFunnel
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get performance metrics
// @route   GET /api/dashboard/performance
// @access  Private
exports.getPerformanceMetrics = async (req, res, next) => {
  try {
    const companyId = req.user.role.name === 'super_admin' 
      ? req.query.company 
      : req.user.company._id;

    const matchStage = companyId 
      ? { company: new mongoose.Types.ObjectId(companyId) }
      : {};

    // Get time period from query (default to last 6 months)
    const months = parseInt(req.query.months) || 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Monthly performance data
    const monthlyPerformance = await Lead.aggregate([
      { 
        $match: { 
          ...matchStage,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          leadsCreated: { $sum: 1 },
          leadsConverted: {
            $sum: { $cond: [{ $eq: ['$status', 'closed_won'] }, 1, 0] }
          },
          revenue: {
            $sum: { 
              $cond: [
                { $eq: ['$status', 'closed_won'] }, 
                '$estimatedValue', 
                0
              ] 
            }
          }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        monthly: monthlyPerformance
      }
    });
  } catch (error) {
    next(error);
  }
};