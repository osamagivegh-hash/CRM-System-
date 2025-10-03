const express = require('express');
const { body } = require('express-validator');
const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  addNote,
  getClientStats
} = require('../controllers/clientController');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const clientValidation = [
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
    .isIn(['active', 'inactive', 'potential', 'lost'])
    .withMessage('Status must be active, inactive, potential, or lost'),
  body('source')
    .optional()
    .isIn(['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'trade_show', 'other'])
    .withMessage('Invalid source'),
  body('value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Value must be a positive number'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Please provide a valid user ID')
];

const updateClientValidation = [
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
    .isIn(['active', 'inactive', 'potential', 'lost'])
    .withMessage('Status must be active, inactive, potential, or lost'),
  body('source')
    .optional()
    .isIn(['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'trade_show', 'other'])
    .withMessage('Invalid source'),
  body('value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Value must be a positive number'),
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

// Routes
router.route('/stats')
  .get(protect, checkPermission('read_clients'), getClientStats);

router.route('/')
  .get(protect, checkPermission('read_clients'), getClients)
  .post(protect, checkPermission('create_clients'), clientValidation, createClient);

router.route('/:id')
  .get(protect, checkPermission('read_clients'), getClient)
  .put(protect, checkPermission('update_clients'), updateClientValidation, updateClient)
  .delete(protect, checkPermission('delete_clients'), deleteClient);

router.route('/:id/notes')
  .post(protect, checkPermission('update_clients'), noteValidation, addNote);

module.exports = router;













