const express = require('express');
const {
  getDashboardOverview,
  getSalesFunnel,
  getPerformanceMetrics,
  getUpcomingTasks
} = require('../controllers/dashboardController');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Routes
router.route('/overview')
  .get(protect, checkPermission('view_dashboard'), getDashboardOverview);

router.route('/funnel')
  .get(protect, checkPermission('view_dashboard'), getSalesFunnel);

router.route('/performance')
  .get(protect, checkPermission('view_analytics'), getPerformanceMetrics);

router.route('/tasks')
  .get(protect, checkPermission('view_dashboard'), getUpcomingTasks);

module.exports = router;












