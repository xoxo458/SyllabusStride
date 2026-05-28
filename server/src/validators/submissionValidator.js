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

const createSubmissionValidator = [
  body('assignment_id')
    .isUUID()
    .withMessage('Valid assignment ID is required'),
];

const gradeSubmissionValidator = [
  body('grade')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Grade must be between 0 and 100'),
  body('feedback')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Feedback must not exceed 2000 characters')
    .trim(),
  body('status')
    .optional()
    .isIn(['submitted', 'graded', 'returned'])
    .withMessage('Status must be one of: submitted, graded, returned'),
];

module.exports = {
  validateRequest,
  createSubmissionValidator,
  gradeSubmissionValidator,
};
