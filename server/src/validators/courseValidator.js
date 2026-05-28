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

const createCourseValidator = [
  body('code')
    .isLength({ min: 2, max: 20 })
    .withMessage('Course code must be between 2 and 20 characters')
    .trim(),
  body('name')
    .isLength({ min: 3, max: 255 })
    .withMessage('Course name must be between 3 and 255 characters')
    .trim(),
  body('semester')
    .optional()
    .isString()
    .withMessage('Semester must be a string')
    .trim(),
  body('instructor')
    .optional()
    .isString()
    .withMessage('Instructor must be a string')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters')
    .trim(),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex code'),
  body('credits')
    .optional()
    .isInt({ min: 0, max: 12 })
    .withMessage('Credits must be between 0 and 12'),
];

const updateCourseValidator = [
  body('code')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('Course code must be between 2 and 20 characters')
    .trim(),
  body('name')
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage('Course name must be between 3 and 255 characters')
    .trim(),
  body('semester')
    .optional()
    .isString()
    .withMessage('Semester must be a string')
    .trim(),
  body('instructor')
    .optional()
    .isString()
    .withMessage('Instructor must be a string')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters')
    .trim(),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex code'),
  body('credits')
    .optional()
    .isInt({ min: 0, max: 12 })
    .withMessage('Credits must be between 0 and 12'),
];

module.exports = {
  validateRequest,
  createCourseValidator,
  updateCourseValidator,
};
