const express = require('express');
const router = express.Router();
const { requireAuth, getCurrentUser, setSentryUser } = require('../middleware/clerk-auth');
const { getAppwriteService } = require('../config/appwrite');
const userQueries = require('../database/queries/userQueries');
const { captureException, addBreadcrumb } = require('../config/sentry');

/**
 * GET /api/v1/users/profile
 * Get current user profile
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Fetching profile for user ${user.id}`, category: 'users' });

    const profile = await userQueries.getUserProfile(user.id);
    
    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    captureException(error, { context: 'get_profile' });
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: error.message,
    });
  }
});

/**
 * PUT /api/v1/users/profile
 * Update user profile
 */
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Updating profile for user ${user.id}`, category: 'users' });

    const updated = await userQueries.updateUserProfile(user.id, req.body);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updated,
    });
  } catch (error) {
    captureException(error, { context: 'update_profile', data: req.body });
    res.status(500).json({
      error: 'Failed to update profile',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/users/stats
 * Get user statistics
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Fetching stats for user ${user.id}`, category: 'users' });

    const stats = await userQueries.getUserStats(user.id);
    
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    captureException(error, { context: 'get_stats' });
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/users/dashboard
 * Get user dashboard data
 */
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    addBreadcrumb({ message: `Fetching dashboard for user ${user.id}`, category: 'users' });

    const profile = await userQueries.getUserProfile(user.id);
    const courses = await userQueries.getUserCourses(user.id);
    const upcomingAssignments = await userQueries.getUserUpcomingAssignments(user.id);
    const stats = await userQueries.getUserStats(user.id);
    
    res.json({
      success: true,
      dashboard: {
        profile,
        courses: courses.documents,
        upcoming_assignments: upcomingAssignments.documents,
        stats,
      },
    });
  } catch (error) {
    captureException(error, { context: 'get_dashboard' });
    res.status(500).json({
      error: 'Failed to fetch dashboard',
      message: error.message,
    });
  }
});

module.exports = router;
