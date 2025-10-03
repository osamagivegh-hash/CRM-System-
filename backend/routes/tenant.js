const express = require('express');
const {
  getTenantInfo,
  updateTenantSettings,
  getTenantUsage,
  checkLimit
} = require('../controllers/tenantController');

const { protect, authorize } = require('../middleware/auth');
const { requireTenant } = require('../middleware/tenant');

const router = express.Router();

// All routes require authentication and tenant identification
router.use(protect);
router.use(requireTenant);

// Get current tenant info - accessible to all tenant users
router.get('/info', getTenantInfo);

// Check limits - accessible to all tenant users
router.post('/check-limit', checkLimit);

// Tenant admin only routes
router.put('/settings', authorize('tenant_admin', 'super_admin'), updateTenantSettings);
router.get('/usage', authorize('tenant_admin', 'super_admin'), getTenantUsage);

module.exports = router;




