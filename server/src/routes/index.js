const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const courseRoutes = require('./courses');
const assignmentRoutes = require('./assignments');
const submissionRoutes = require('./submissions');
const userRoutes = require('./users');
const filesRoutes = require('./files');

// Mount route modules
router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/submissions', submissionRoutes);
router.use('/users', userRoutes);
router.use('/files', filesRoutes);

// API documentation
router.get('/', (req, res) => {
  res.json({
    message: 'SyllabusStride API v1',
    endpoints: {
      auth: '/auth',
      courses: '/courses',
      assignments: '/assignments',
      submissions: '/submissions',
      users: '/users',
      files: '/files',
    },
    documentation: 'https://github.com/xoxo458/SyllabusStride/wiki',
  });
});

module.exports = router;
