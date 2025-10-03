const express = require('express');
const {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  suspendTenant,
  activateTenant,
  getDashboardStats
} = require('../controllers/superAdminController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require super admin authentication
router.use(protect);
router.use(authorize('super_admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Tenant management
router.route('/tenants')
  .get(getTenants)
  .post(createTenant);

router.route('/tenants/:id')
  .get(getTenant)
  .put(updateTenant)
  .delete(deleteTenant);

// Tenant status management
router.put('/tenants/:id/suspend', suspendTenant);
router.put('/tenants/:id/activate', activateTenant);

module.exports = router;




