const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import service integrations
const { initSentry, sentryErrorHandler, apiErrorHandler } = require('./config/sentry');
const { clerkMiddleware, syncClerkUserToAppwrite } = require('./middleware/clerk-auth');
const { getAppwriteService } = require('./config/appwrite');
const { getTestmailService } = require('./services/testmail');

const app = express();

// ============================================
// SECURITY & MONITORING MIDDLEWARE
// ============================================

// Initialize Sentry first (must be before other middleware)
initSentry(app);

// Security headers
app.use(helmet());

// Request logging
app.use(morgan('combined'));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// ============================================
// BODY PARSING & CORS
// ============================================

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: process.env.CORS_ALLOWED_HEADERS?.split(',') || ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

// Clerk authentication
if (process.env.ENABLE_CLERK_AUTH === 'true') {
  app.use(clerkMiddleware);
  app.use(syncClerkUserToAppwrite);
  console.log('✅ Clerk authentication enabled');
}

// ============================================
// HEALTH & DIAGNOSTIC ENDPOINTS
// ============================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.API_VERSION || '1.0.0',
  });
});

/**
 * System diagnostics endpoint
 */
app.get('/api/diagnostics', async (req, res) => {
  try {
    const appwrite = getAppwriteService();
    const appwriteConnected = await appwrite.testConnection();

    const testmail = getTestmailService();
    const testmailConnected = testmail.isEnabled ? await testmail.verifyConnection() : false;

    res.json({
      timestamp: new Date().toISOString(),
      services: {
        appwrite: {
          enabled: true,
          connected: appwriteConnected,
          endpoint: process.env.APPWRITE_ENDPOINT,
        },
        clerk: {
          enabled: process.env.ENABLE_CLERK_AUTH === 'true',
          configured: !!process.env.CLERK_SECRET_KEY,
        },
        sentry: {
          enabled: process.env.ENABLE_SENTRY === 'true',
          configured: !!process.env.SENTRY_DSN,
        },
        testmail: {
          enabled: process.env.ENABLE_TESTMAIL === 'true',
          connected: testmailConnected,
        },
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT || 3000,
        apiVersion: process.env.API_VERSION || '1.0.0',
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Diagnostics check failed',
      message: error.message,
    });
  }
});

// ============================================
// API ROUTES
// ============================================

/**
 * API v1 routes
 */
app.use('/api/v1', require('./routes/index'));

// ============================================
// ERROR HANDLING
// ============================================

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableEndpoints: {
      health: '/health',
      diagnostics: '/api/diagnostics',
      api: '/api/v1',
    },
  });
});

/**
 * Error handler middleware (must be last)
 */
app.use(apiErrorHandler);
app.use(sentryErrorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Initialize services
    console.log('\n🔧 Initializing services...\n');

    // Test Appwrite connection
    const appwrite = getAppwriteService();
    const appwriteConnected = await appwrite.testConnection();

    // Test Testmail connection (if enabled)
    if (process.env.ENABLE_TESTMAIL === 'true') {
      const testmail = getTestmailService();
      await testmail.verifyConnection();
    }

    // Start server
    app.listen(PORT, () => {
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║   🎓 SyllabusStride API Server        ║');
      console.log('╚════════════════════════════════════════╝\n');
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📦 API Version: ${process.env.API_VERSION || '1.0.0'}`);
      console.log('\n🔗 Endpoints:');
      console.log(`   • Health:      ${PORT}/health`);
      console.log(`   • Diagnostics: ${PORT}/api/diagnostics`);
      console.log(`   • API v1:      ${PORT}/api/v1`);
      console.log('\n📚 Integrations:');
      console.log(`   ${appwriteConnected ? '✅' : '❌'} Appwrite Database`);
      console.log(`   ${process.env.ENABLE_CLERK_AUTH === 'true' ? '✅' : '⏭️'} Clerk Auth`);
      console.log(`   ${process.env.ENABLE_SENTRY === 'true' ? '✅' : '⏭️'} Sentry Monitoring`);
      console.log(`   ${process.env.ENABLE_TESTMAIL === 'true' ? '✅' : '⏭️'} Testmail Notifications`);
      console.log('\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
