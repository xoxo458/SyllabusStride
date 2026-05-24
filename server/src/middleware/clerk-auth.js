const { ClerkExpressWithAuth } = require('@clerk/express');
require('dotenv').config();

/**
 * Clerk Authentication Middleware
 * Provides secure authentication and user context for protected routes
 */

/**
 * Initialize Clerk middleware
 */
const clerkMiddleware = ClerkExpressWithAuth();

/**
 * Require authentication middleware
 * Use this on routes that require an authenticated user
 */
const requireAuth = (req, res, next) => {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }
  next();
};

/**
 * Optional authentication middleware
 * Adds user context if available, but doesn't block requests
 */
const optionalAuth = (req, res, next) => {
  if (req.auth && req.auth.userId) {
    // User is authenticated
    req.user = {
      id: req.auth.userId,
      email: req.auth.sessionClaims?.email,
    };
  }
  next();
};

/**
 * Verify user token from Clerk
 */
const verifyClerkToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    // Token verification happens in ClerkExpressWithAuth middleware
    if (req.auth && req.auth.userId) {
      next();
    } else {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token verification failed',
    });
  }
};

/**
 * Get current user from request
 */
const getCurrentUser = (req) => {
  if (req.auth && req.auth.userId) {
    return {
      id: req.auth.userId,
      email: req.auth.sessionClaims?.email,
      firstName: req.auth.sessionClaims?.first_name,
      lastName: req.auth.sessionClaims?.last_name,
      imageUrl: req.auth.sessionClaims?.image_url,
    };
  }
  return null;
};

/**
 * Sync Clerk user to Appwrite database
 */
const syncClerkUserToAppwrite = async (req, res, next) => {
  try {
    if (req.auth && req.auth.userId) {
      const { getAppwriteService } = require('./appwrite');
      const appwrite = getAppwriteService();
      
      const clerkUser = getCurrentUser(req);
      
      // Check if user exists in Appwrite
      try {
        const existingUser = await appwrite.getDocument('users', clerkUser.id);
        // User exists, update last login
        await appwrite.updateDocument('users', clerkUser.id, {
          last_login: new Date().toISOString(),
        });
      } catch (error) {
        // User doesn't exist, create new user document
        if (error.message.includes('not found')) {
          await appwrite.createDocument('users', {
            $id: clerkUser.id,
            email: clerkUser.email,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
            avatar_url: clerkUser.imageUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
          });
        }
      }
    }
    next();
  } catch (error) {
    console.error('Error syncing Clerk user to Appwrite:', error);
    // Don't block the request if sync fails
    next();
  }
};

/**
 * Check user permissions
 */
const checkPermission = (requiredRole) => {
  return (req, res, next) => {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Get user role from Clerk session claims
    const userRole = req.auth.sessionClaims?.role || 'user';

    if (userRole !== requiredRole && userRole !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Required role: ${requiredRole}`,
      });
    }

    next();
  };
};

module.exports = {
  clerkMiddleware,
  requireAuth,
  optionalAuth,
  verifyClerkToken,
  getCurrentUser,
  syncClerkUserToAppwrite,
  checkPermission,
};
