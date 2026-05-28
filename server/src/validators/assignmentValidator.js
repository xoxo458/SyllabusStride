const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

const createAssignmentValidator = [
  body('course_id')
    .isUUID()
    .withMessage('Valid course ID is required'),
  body('title')
    .isLength({ min: 3, max: 255 })
    .withMessage('Assignment title must be between 3 and 255 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters')
    .trim(),
  body('due_date')
    .isISO8601()
    .withMessage('Valid ISO8601 due date is required'),
  body('status')
    .isIn(['not_started', 'in_progress', 'submitted', 'graded'])
    .withMessage('Status must be one of: not_started, in_progress, submitted, graded'),
];

const updateAssignmentValidator = [
  body('title')
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage('Assignment title must be between 3 and 255 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters')
    .trim(),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Valid ISO8601 due date is required'),
  body('status')
    .optional()
    .isIn(['not_started', 'in_progress', 'submitted', 'graded'])
    .withMessage('Status must be one of: not_started, in_progress, submitted, graded'),
  body('grade')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Grade must be between 0 and 100'),
];

const gradeAssignmentValidator = [
  body('grade')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Grade must be between 0 and 100'),
  body('feedback')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Feedback must not exceed 2000 characters')
    .trim(),
];

module.exports = {
  validateRequest,
  createAssignmentValidator,
  updateAssignmentValidator,
  gradeAssignmentValidator,
};
