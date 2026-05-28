const express = require('express');
const router = express.Router();
const { requireAuth, getCurrentUser } = require('../middleware/clerk-auth');
const { createCourseValidator, updateCourseValidator, validateRequest } = require('../validators/courseValidator');
const courseQueries = require('../database/queries/courseQueries');
const { captureException, addBreadcrumb } = require('../config/sentry');

/**
 * GET /api/v1/courses
 * List all user courses
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Fetching courses for user ${user.id}`, category: 'courses' });

    const courses = await courseQueries.getUserCourses(user.id);
    
    res.json({
      success: true,
      total: courses.documents.length,
      courses: courses.documents,
    });
  } catch (error) {
    captureException(error, { context: 'get_courses' });
    res.status(500).json({
      error: 'Failed to fetch courses',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/courses
 * Create new course
 */
router.post('/', requireAuth, createCourseValidator, validateRequest, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Creating course for user ${user.id}`, category: 'courses' });

    const course = await courseQueries.createCourse(user.id, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course,
    });
  } catch (error) {
    captureException(error, { context: 'create_course', data: req.body });
    res.status(500).json({
      error: 'Failed to create course',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/courses/:id
 * Get course details
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Fetching course ${req.params.id}`, category: 'courses' });

    const course = await courseQueries.getCourseById(req.params.id);
    
    // Verify ownership
    if (course.user_id !== user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this course',
      });
    }

    const assignments = await courseQueries.getCourseAssignments(req.params.id);
    
    res.json({
      success: true,
      course: {
        ...course,
        assignments: assignments.documents,
      },
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Course not found',
      });
    }
    captureException(error, { context: 'get_course', courseId: req.params.id });
    res.status(500).json({
      error: 'Failed to fetch course',
      message: error.message,
    });
  }
});

/**
 * PUT /api/v1/courses/:id
 * Update course
 */
router.put('/:id', requireAuth, updateCourseValidator, validateRequest, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Updating course ${req.params.id}`, category: 'courses' });

    const course = await courseQueries.getCourseById(req.params.id);
    
    if (course.user_id !== user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this course',
      });
    }

    const updatedCourse = await courseQueries.updateCourse(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'Course updated successfully',
      course: updatedCourse,
    });
  } catch (error) {
    captureException(error, { context: 'update_course', courseId: req.params.id });
    res.status(500).json({
      error: 'Failed to update course',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/v1/courses/:id
 * Delete course
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Deleting course ${req.params.id}`, category: 'courses' });

    const course = await courseQueries.getCourseById(req.params.id);
    
    if (course.user_id !== user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this course',
      });
    }

    await courseQueries.deleteCourse(req.params.id);
    
    res.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    captureException(error, { context: 'delete_course', courseId: req.params.id });
    res.status(500).json({
      error: 'Failed to delete course',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/courses/:id/assignments
 * Get course assignments
 */
router.get('/:id/assignments', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Fetching assignments for course ${req.params.id}`, category: 'courses' });

    const course = await courseQueries.getCourseById(req.params.id);
    
    if (course.user_id !== user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this course',
      });
    }

    const assignments = await courseQueries.getCourseAssignments(req.params.id);
    
    res.json({
      success: true,
      total: assignments.documents.length,
      assignments: assignments.documents,
    });
  } catch (error) {
    captureException(error, { context: 'get_course_assignments', courseId: req.params.id });
    res.status(500).json({
      error: 'Failed to fetch assignments',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/courses/search
 * Search courses
 */
router.get('/search/:term', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Searching courses with term: ${req.params.term}`, category: 'courses' });

    const results = await courseQueries.searchCourses(user.id, req.params.term);
    
    res.json({
      success: true,
      total: results.total,
      courses: results.documents,
    });
  } catch (error) {
    captureException(error, { context: 'search_courses', term: req.params.term });
    res.status(500).json({
      error: 'Failed to search courses',
      message: error.message,
    });
  }
});

module.exports = router;
