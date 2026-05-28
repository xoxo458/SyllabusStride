const express = require('express');
const router = express.Router();
const { requireAuth, getCurrentUser } = require('../middleware/clerk-auth');
const { createSubmissionValidator, gradeSubmissionValidator, validateRequest } = require('../validators/submissionValidator');
const submissionQueries = require('../database/queries/submissionQueries');
const assignmentQueries = require('../database/queries/assignmentQueries');
const { getAppwriteService } = require('../config/appwrite');
const { captureException, addBreadcrumb } = require('../config/sentry');

/**
 * POST /api/v1/submissions
 * Create new submission
 */
router.post('/', requireAuth, createSubmissionValidator, validateRequest, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Creating submission for assignment ${req.body.assignment_id}`, category: 'submissions' });

    // Check if user already submitted
    const existing = await submissionQueries.getUserAssignmentSubmission(
      req.body.assignment_id,
      user.id
    );

    if (existing) {
      return res.status(400).json({
        error: 'Conflict',
        message: 'You have already submitted this assignment',
      });
    }

    const submission = await submissionQueries.createSubmission({
      ...req.body,
      user_id: user.id,
      status: 'submitted',
      submission_date: new Date().toISOString(),
    });
    
    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      submission,
    });
  } catch (error) {
    captureException(error, { context: 'create_submission', data: req.body });
    res.status(500).json({
      error: 'Failed to create submission',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/submissions/:id
 * Get submission details
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Fetching submission ${req.params.id}`, category: 'submissions' });

    const submission = await submissionQueries.getSubmissionById(req.params.id);
    
    // Verify ownership
    if (submission.user_id !== user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this submission',
      });
    }

    res.json({
      success: true,
      submission,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Submission not found',
      });
    }
    captureException(error, { context: 'get_submission', submissionId: req.params.id });
    res.status(500).json({
      error: 'Failed to fetch submission',
      message: error.message,
    });
  }
});

/**
 * PUT /api/v1/submissions/:id/grade
 * Grade submission
 */
router.put('/:id/grade', requireAuth, gradeSubmissionValidator, validateRequest, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Grading submission ${req.params.id}`, category: 'submissions' });

    const submission = await submissionQueries.getSubmissionById(req.params.id);
    const assignment = await assignmentQueries.getAssignmentById(submission.assignment_id);

    // Verify instructor access (simplified - you may want to add role checking)
    addBreadcrumb({ message: `User ${user.id} grading submission`, category: 'submissions' });

    const gradedSubmission = await submissionQueries.gradeSubmission(req.params.id, {
      grade: req.body.grade,
      feedback: req.body.feedback || '',
      status: 'graded',
    });
    
    // Update assignment status if all submitted
    const allSubmissions = await submissionQueries.getAssignmentSubmissions(assignment.$id);
    const allGraded = allSubmissions.documents.every(s => s.status === 'graded');
    
    if (allGraded) {
      await assignmentQueries.updateAssignment(assignment.$id, { status: 'graded' });
    }

    res.json({
      success: true,
      message: 'Submission graded successfully',
      submission: gradedSubmission,
    });
  } catch (error) {
    captureException(error, { context: 'grade_submission', submissionId: req.params.id });
    res.status(500).json({
      error: 'Failed to grade submission',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/assignments/:assignmentId/submissions
 * Get all submissions for an assignment
 */
router.get('/assignment/:assignmentId', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Fetching submissions for assignment ${req.params.assignmentId}`, category: 'submissions' });

    const submissions = await submissionQueries.getAssignmentSubmissions(req.params.assignmentId);
    
    res.json({
      success: true,
      total: submissions.documents.length,
      submissions: submissions.documents,
    });
  } catch (error) {
    captureException(error, { context: 'get_assignment_submissions', assignmentId: req.params.assignmentId });
    res.status(500).json({
      error: 'Failed to fetch submissions',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/submissions/pending
 * Get pending submissions (not graded)
 */
router.get('/pending', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Fetching pending submissions`, category: 'submissions' });

    const pending = await submissionQueries.getPendingSubmissions();
    
    res.json({
      success: true,
      total: pending.documents.length,
      submissions: pending.documents,
    });
  } catch (error) {
    captureException(error, { context: 'get_pending_submissions' });
    res.status(500).json({
      error: 'Failed to fetch pending submissions',
      message: error.message,
    });
  }
});

module.exports = router;
