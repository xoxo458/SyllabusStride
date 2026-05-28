const express = require('express');
const router = express.Router();
const { getCurrentUser, requireAuth } = require('../middleware/clerk-auth');
const { getAppwriteService } = require('../config/appwrite');
const { captureException } = require('../config/sentry');

/**
 * POST /api/v1/auth/verify
 * Verify current user session
 */
router.post('/verify', requireAuth, (req, res) => {
  try {
    const user = getCurrentUser(req);
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    captureException(error, { context: 'auth_verify' });
    res.status(500).json({
      error: 'Verification failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout user and clear session
 */
router.post('/logout', requireAuth, (req, res) => {
  try {
    const user = getCurrentUser(req);
    res.json({
      success: true,
      message: 'Logged out successfully',
      user_id: user.id,
    });
  } catch (error) {
    captureException(error, { context: 'auth_logout' });
    res.status(500).json({
      error: 'Logout failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/auth/status
 * Get authentication status
 */
router.get('/status', (req, res) => {
  try {
    if (req.auth && req.auth.userId) {
      const user = getCurrentUser(req);
      res.json({
        authenticated: true,
        user,
      });
    } else {
      res.json({
        authenticated: false,
      });
    }
  } catch (error) {
    res.json({
      authenticated: false,
      error: error.message,
    });
  }
});

module.exports = router;
