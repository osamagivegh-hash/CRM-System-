const express = require('express');
const { getRoles } = require('../controllers/roleController');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Routes
router.route('/')
  .get(protect, checkPermission('read_users'), getRoles);

module.exports = router;













