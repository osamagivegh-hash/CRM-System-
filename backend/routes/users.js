const express = require('express');
const { body } = require('express-validator');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  activateUser
} = require('../controllers/userController');
const { protect, authorize, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createUserValidation = [
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
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('role')
    .isMongoId()
    .withMessage('Please provide a valid role ID'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid phone number')
];

const updateUserValidation = [
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
  body('role')
    .optional()
    .isMongoId()
    .withMessage('Please provide a valid role ID'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid phone number')
];

// Routes
router.route('/')
  .get(protect, checkPermission('read_users'), getUsers)
  .post(protect, checkPermission('create_users'), createUserValidation, createUser);

router.route('/:id')
  .get(protect, checkPermission('read_users'), getUser)
  .put(protect, checkPermission('update_users'), updateUserValidation, updateUser)
  .delete(protect, checkPermission('delete_users'), deleteUser);

router.route('/:id/activate')
  .put(protect, checkPermission('update_users'), activateUser);

module.exports = router;













