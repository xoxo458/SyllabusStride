const express = require('express');
const router = express.Router();
const { requireAuth, getCurrentUser } = require('../middleware/clerk-auth');
const { createAssignmentValidator, updateAssignmentValidator, gradeAssignmentValidator, validateRequest } = require('../validators/assignmentValidator');
const assignmentQueries = require('../database/queries/assignmentQueries');
const courseQueries = require('../database/queries/courseQueries');
const { captureException, addBreadcrumb } = require('../config/sentry');

/**
 * GET /api/v1/assignments
 * List all assignments
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Fetching assignments for user ${user.id}`, category: 'assignments' });

    const courses = await courseQueries.getUserCourses(user.id);
    let allAssignments = [];

    for (const course of courses.documents) {
      const assignments = await assignmentQueries.getCourseAssignments(course.$id);
      allAssignments = [...allAssignments, ...assignments.documents];
    }

    res.json({
      success: true,
      total: allAssignments.length,
      assignments: allAssignments,
    });
  } catch (error) {
    captureException(error, { context: 'get_assignments' });
    res.status(500).json({
      error: 'Failed to fetch assignments',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/assignments
 * Create new assignment
 */
router.post('/', requireAuth, createAssignmentValidator, validateRequest, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Creating assignment for course ${req.body.course_id}`, category: 'assignments' });

    // Verify course ownership
    const course = await courseQueries.getCourseById(req.body.course_id);
    if (course.user_id !== user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this course',
      });
    }

    const assignment = await assignmentQueries.createAssignment(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment,
    });
  } catch (error) {
    captureException(error, { context: 'create_assignment', data: req.body });
    res.status(500).json({
      error: 'Failed to create assignment',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/assignments/:id
 * Get assignment details
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Fetching assignment ${req.params.id}`, category: 'assignments' });

    const assignment = await assignmentQueries.getAssignmentById(req.params.id);
    const course = await courseQueries.getCourseById(assignment.course_id);

    if (course.user_id !== user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this assignment',
      });
    }

    res.json({
      success: true,
      assignment,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Assignment not found',
      });
    }
    captureException(error, { context: 'get_assignment', assignmentId: req.params.id });
    res.status(500).json({
      error: 'Failed to fetch assignment',
      message: error.message,
    });
  }
});

/**
 * PUT /api/v1/assignments/:id
 * Update assignment
 */
router.put('/:id', requireAuth, updateAssignmentValidator, validateRequest, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Updating assignment ${req.params.id}`, category: 'assignments' });

    const assignment = await assignmentQueries.getAssignmentById(req.params.id);
    const course = await courseQueries.getCourseById(assignment.course_id);

    if (course.user_id !== user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this assignment',
      });
    }

    const updatedAssignment = await assignmentQueries.updateAssignment(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment: updatedAssignment,
    });
  } catch (error) {
    captureException(error, { context: 'update_assignment', assignmentId: req.params.id });
    res.status(500).json({
      error: 'Failed to update assignment',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/v1/assignments/:id
 * Delete assignment
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Deleting assignment ${req.params.id}`, category: 'assignments' });

    const assignment = await assignmentQueries.getAssignmentById(req.params.id);
    const course = await courseQueries.getCourseById(assignment.course_id);

    if (course.user_id !== user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this assignment',
      });
    }

    await assignmentQueries.deleteAssignment(req.params.id);
    
    res.json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    captureException(error, { context: 'delete_assignment', assignmentId: req.params.id });
    res.status(500).json({
      error: 'Failed to delete assignment',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/assignments/upcoming
 * Get upcoming assignments
 */
router.get('/upcoming', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Fetching upcoming assignments for user ${user.id}`, category: 'assignments' });

    const upcoming = await assignmentQueries.getUpcomingAssignments();
    
    res.json({
      success: true,
      total: upcoming.documents.length,
      assignments: upcoming.documents,
    });
  } catch (error) {
    captureException(error, { context: 'get_upcoming_assignments' });
    res.status(500).json({
      error: 'Failed to fetch upcoming assignments',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/assignments/overdue
 * Get overdue assignments
 */
router.get('/overdue', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Fetching overdue assignments for user ${user.id}`, category: 'assignments' });

    const overdue = await assignmentQueries.getOverdueAssignments();
    
    res.json({
      success: true,
      total: overdue.documents.length,
      assignments: overdue.documents,
    });
  } catch (error) {
    captureException(error, { context: 'get_overdue_assignments' });
    res.status(500).json({
      error: 'Failed to fetch overdue assignments',
      message: error.message,
    });
  }
});

module.exports = router;
