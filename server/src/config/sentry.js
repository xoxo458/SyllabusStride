const Sentry = require('@sentry/node');
const Integrations = require('@sentry/integrations');
require('dotenv').config();

/**
 * Sentry Error Tracking Configuration
 * Production-grade error monitoring and performance tracking
 */

const initSentry = (app) => {
  if (process.env.ENABLE_SENTRY !== 'true') {
    console.log('⏭️  Sentry monitoring disabled');
    return;
  }

  if (!process.env.SENTRY_DSN) {
    console.warn('⚠️  SENTRY_DSN not configured');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Integrations.OnUncaughtException(),
      new Integrations.OnUnhandledRejection(),
    ],
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACE_SAMPLE_RATE || 0.1),
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILE_SAMPLE_RATE || 0.1),
    maxBreadcrumbs: 50,
    maxValueLength: 1024,
    attachStacktrace: true,
    denyUrls: [
      // Ignore errors from browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
    ],
  });

  // Request handler must be the first middleware
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  console.log('✅ Sentry error tracking initialized');
};

/**
 * Sentry error handler middleware (must be last)
 */
const sentryErrorHandler = Sentry.Handlers.errorHandler();

/**
 * Capture exception with context
 */
const captureException = (error, context = {}) => {
  Sentry.withScope((scope) => {
    Object.keys(context).forEach((key) => {
      scope.setContext(key, context[key]);
    });
    Sentry.captureException(error);
  });
};

/**
 * Capture message
 */
const captureMessage = (message, level = 'info') => {
  Sentry.captureMessage(message, level);
};

/**
 * Set user context for error tracking
 */
const setSentryUser = (userId, email, username = '') => {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
};

/**
 * Clear user context
 */
const clearSentryUser = () => {
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for debugging
 */
const addBreadcrumb = (message, category = 'info', data = {}) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Capture error in API routes
 */
const apiErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  // Capture error with Sentry
  if (statusCode >= 500) {
    Sentry.withScope((scope) => {
      scope.setContext('request', {
        method: req.method,
        url: req.url,
        headers: req.headers,
      });
      scope.setContext('response', {
        statusCode,
        message,
      });
      if (req.auth) {
        scope.setUser({
          id: req.auth.userId,
        });
      }
      Sentry.captureException(err);
    });
  }

  // Log error
  console.error(`[${statusCode}] ${message}`, err);

  // Send response
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err,
    }),
  });
};

module.exports = {
  initSentry,
  sentryErrorHandler,
  captureException,
  captureMessage,
  setSentryUser,
  clearSentryUser,
  addBreadcrumb,
  apiErrorHandler,
};
