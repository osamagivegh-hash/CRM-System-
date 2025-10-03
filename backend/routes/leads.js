const express = require('express');
const { body } = require('express-validator');
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  addNote,
  addActivity,
  convertToClient,
  getLeadStats
} = require('../controllers/leadController');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const leadValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid phone number'),
  body('status')
    .optional()
    .isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('source')
    .optional()
    .isIn(['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'trade_show', 'advertisement', 'other'])
    .withMessage('Invalid source'),
  body('estimatedValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated value must be a positive number'),
  body('probability')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Probability must be between 0 and 100'),
  body('expectedCloseDate')
    .optional()
    .isISO8601()
    .withMessage('Expected close date must be a valid date'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Please provide a valid user ID')
];

const updateLeadValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid phone number'),
  body('status')
    .optional()
    .isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('source')
    .optional()
    .isIn(['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'trade_show', 'advertisement', 'other'])
    .withMessage('Invalid source'),
  body('estimatedValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated value must be a positive number'),
  body('probability')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Probability must be between 0 and 100'),
  body('expectedCloseDate')
    .optional()
    .isISO8601()
    .withMessage('Expected close date must be a valid date'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Please provide a valid user ID')
];

const noteValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note content must be between 1 and 1000 characters'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean')
];

const activityValidation = [
  body('type')
    .isIn(['call', 'email', 'meeting', 'demo', 'proposal', 'follow_up', 'other'])
    .withMessage('Invalid activity type'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid date'),
  body('status')
    .optional()
    .isIn(['scheduled', 'completed', 'cancelled'])
    .withMessage('Status must be scheduled, completed, or cancelled')
];

// Routes
router.route('/stats')
  .get(protect, checkPermission('read_leads'), getLeadStats);

router.route('/')
  .get(protect, checkPermission('read_leads'), getLeads)
  .post(protect, checkPermission('create_leads'), leadValidation, createLead);

router.route('/:id')
  .get(protect, checkPermission('read_leads'), getLead)
  .put(protect, checkPermission('update_leads'), updateLeadValidation, updateLead)
  .delete(protect, checkPermission('delete_leads'), deleteLead);

router.route('/:id/notes')
  .post(protect, checkPermission('update_leads'), noteValidation, addNote);

router.route('/:id/activities')
  .post(protect, checkPermission('update_leads'), activityValidation, addActivity);

router.route('/:id/convert')
  .post(protect, checkPermission('create_clients'), convertToClient);

module.exports = router;













