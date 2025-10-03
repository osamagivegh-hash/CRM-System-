const express = require('express');
const { body } = require('express-validator');
const {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStats,
  updateCompanyPlan
} = require('../controllers/companyController');
const { protect, authorize, sameCompanyOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createCompanyValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid phone number'),
  body('plan')
    .optional()
    .isIn(['starter', 'professional', 'enterprise'])
    .withMessage('Plan must be starter, professional, or enterprise')
];

const updateCompanyValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid phone number'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please enter a valid website URL')
];

const updatePlanValidation = [
  body('plan')
    .isIn(['starter', 'professional', 'enterprise'])
    .withMessage('Plan must be starter, professional, or enterprise'),
  body('maxUsers')
    .isInt({ min: 1 })
    .withMessage('Max users must be at least 1')
];

// Routes
router.route('/')
  .get(protect, authorize('super_admin'), getCompanies)
  .post(protect, authorize('super_admin'), createCompanyValidation, createCompany);

router.route('/:id')
  .get(protect, sameCompanyOrAdmin, getCompany)
  .put(protect, sameCompanyOrAdmin, updateCompanyValidation, updateCompany)
  .delete(protect, authorize('super_admin'), deleteCompany);

router.route('/:id/stats')
  .get(protect, sameCompanyOrAdmin, getCompanyStats);

router.route('/:id/plan')
  .put(protect, authorize('super_admin'), updatePlanValidation, updateCompanyPlan);

module.exports = router;
