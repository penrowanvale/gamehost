const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// NOTE: Cleanup scheduler is lazy-loaded only when running as a traditional server
// This prevents crashes on serverless platforms (Vercel, AWS Lambda)
let CleanupScheduler = null;

const app = express();
const PORT = process.env.PORT || 3000;

// Detect if running in serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint - useful for debugging deployment issues
app.get('/api/health', (req, res) => {
  const { isConfigured, missingEnvVars } = require('./config/database');
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: isServerless ? 'serverless' : 'traditional',
    platform: process.env.VERCEL ? 'vercel' : (process.env.AWS_LAMBDA_FUNCTION_NAME ? 'aws-lambda' : 'node'),
    nodeVersion: process.version,
    database: {
      configured: isConfigured,
      missingVars: missingEnvVars || []
    },
    envVars: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      JWT_SECRET: !!process.env.JWT_SECRET,
      GOOGLE_SERVICE_ACCOUNT_KEY: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      GOOGLE_DRIVE_STORAGE_FOLDER_ID: !!process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID
    }
  };
  
  // Set overall status based on database configuration
  if (!isConfigured) {
    health.status = 'degraded';
    health.message = 'Database not configured - API endpoints will not work';
  }
  
  res.json(health);
});

// Public config endpoint - returns contact info for frontend display
// This allows customizing admin details via environment variables
app.get('/api/config/public', (req, res) => {
  res.json({
    appName: process.env.APP_NAME || 'GameBlast Mobile',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
    supportWhatsApp: process.env.SUPPORT_WHATSAPP || '+919876543210',
    supportHours: process.env.SUPPORT_HOURS || '9 AM - 9 PM IST',
    appUrl: process.env.APP_URL || ''
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Import API routes with error handling
let authRoutes, gameRoutes, organiserRoutes, adminRoutes, userRoutes, contactRoutes;

try {
  authRoutes = require('./api/auth');
  gameRoutes = require('./api/games');
  organiserRoutes = require('./api/organiser');
  adminRoutes = require('./api/admin');
  userRoutes = require('./api/users');
  contactRoutes = require('./api/contact');
  console.log('✅ All API routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load API routes:', error.message);
  // Create fallback routes that return helpful error messages
  const createFallbackRoute = (routeName) => {
    const router = require('express').Router();
    router.all('*', (req, res) => {
      res.status(503).json({
        error: 'Service temporarily unavailable',
        message: `The ${routeName} service failed to initialize`,
        details: error.message,
        help: 'Please check your environment variables and try again'
      });
    });
    return router;
  };
  
  authRoutes = authRoutes || createFallbackRoute('auth');
  gameRoutes = gameRoutes || createFallbackRoute('games');
  organiserRoutes = organiserRoutes || createFallbackRoute('organiser');
  adminRoutes = adminRoutes || createFallbackRoute('admin');
  userRoutes = userRoutes || createFallbackRoute('users');
  contactRoutes = contactRoutes || createFallbackRoute('contact');
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/organiser', organiserRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);

// Serve HTML files for different routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/games', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games.html'));
});

app.get('/game/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game-details.html'));
});

app.get('/how-to-play', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'how-to-play.html'));
});

app.get('/organiser', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'organiser.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/leaderboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/secure-download', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'secure-download.html'));
});

app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy-policy.html'));
});

app.get('/terms-conditions', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms-conditions.html'));
});

app.get('/disclaimer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'disclaimer.html'));
});

app.get('/refund-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'refund-policy.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/help', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/image-upload-guide.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'image-upload-guide.html'));
});

// Global error handler - prevents serverless function crashes
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err.message);
  console.error('Stack:', err.stack);
  
  // Don't expose internal errors in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(500).json({
    error: 'Internal server error',
    message: isProduction ? 'Something went wrong' : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `API endpoint ${req.originalUrl} does not exist`
  });
});

// Handle 404 for other routes - serve the SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Only start listening if NOT in serverless mode
// Vercel handles this automatically through the exported app
if (!isServerless) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Dashboard: http://localhost:${PORT}`);
    console.log(`👥 Admin: http://localhost:${PORT}/admin.html`);
    console.log(`🎮 Organiser: http://localhost:${PORT}/organiser.html`);
    
    // Initialize Google Drive cleanup scheduler ONLY on traditional servers
    // Serverless functions don't support cron jobs - use Vercel Cron or external scheduler
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY && process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID) {
      try {
        console.log('☁️ Initializing Google Drive storage cleanup scheduler...');
        // Lazy load the scheduler only when needed
        CleanupScheduler = require('./scripts/cleanup-scheduler');
        new CleanupScheduler();
        console.log('✅ Google Drive auto-cleanup enabled (2-day retention)');
      } catch (error) {
        console.error('❌ Failed to initialize Google Drive cleanup scheduler:', error.message);
        console.log('⚠️ Cleanup scheduler disabled - manual cleanup still available');
      }
    } else {
      console.log('⚠️ Google Drive storage not configured - skipping cleanup scheduler');
      console.log('📖 See GOOGLE_DRIVE_STORAGE_SETUP.md for setup instructions');
    }
  });
} else {
  console.log('☁️ Running in serverless mode (Vercel/Lambda/Netlify)');
  console.log('⚠️ Cleanup scheduler disabled - use Vercel Cron Jobs for scheduled tasks');
}

module.exports = app;