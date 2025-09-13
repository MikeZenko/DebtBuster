import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import env, { getCorsOrigins, isDevelopment } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import debtRoutes from './routes/debts';
import loanRoutes from './routes/loans';
import plaidRoutes from './routes/plaid';

// Import services for cleanup
import { AuthService } from './services/authService';

const app = express();

// Trust proxy (important for rate limiting behind reverse proxies)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow embedding for Plaid Link
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https://cdn.plaid.com"],
      connectSrc: ["'self'", "https://production.plaid.com", "https://development.plaid.com", "https://sandbox.plaid.com"],
      frameSrc: ["'self'", "https://cdn.plaid.com"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getCorsOrigins();
    
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // 24 hours
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW * 60 * 1000, // Convert minutes to milliseconds
  max: env.RATE_LIMIT_MAX,
  message: {
    error: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (isDevelopment()) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'DebtTruth Coach API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/plaid', plaidRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'DebtTruth Coach API',
    version: '1.0.0',
    endpoints: {
      auth: {
        base: '/api/auth',
        routes: [
          'POST /register - Register new user',
          'POST /login - Login user',
          'POST /refresh - Refresh access token',
          'POST /logout - Logout user',
          'GET /profile - Get user profile',
          'PATCH /profile - Update user profile',
          'POST /change-password - Change password',
          'GET /verify - Verify token',
          'GET /stats - Get user stats',
          'GET /health - Auth service health',
        ]
      },
      debts: {
        base: '/api/debts',
        routes: [
          'GET / - Get all debts',
          'POST / - Create new debt',
          'GET /summary - Get debt summary',
          'GET /analytics - Get debt analytics',
          'POST /payoff-timeline - Calculate payoff timeline',
          'GET /compare-strategies - Compare payoff strategies',
          'POST /import-plaid - Import debts from Plaid',
          'GET /:debtId - Get specific debt',
          'PATCH /:debtId - Update debt',
          'DELETE /:debtId - Delete debt',
          'POST /payments - Add payment',
        ]
      },
      loans: {
        base: '/api/loans',
        routes: [
          'GET / - Get all loans',
          'POST / - Create new loan',
          'GET /summary - Get loan summary',
          'GET /analytics - Get loan analytics',
          'POST /calculate - Calculate loan details',
          'POST /compare - Compare loans',
          'GET /:loanId - Get specific loan',
          'PATCH /:loanId - Update loan',
          'DELETE /:loanId - Delete loan',
          'GET /:loanId/amortization - Get amortization schedule',
        ]
      },
      plaid: {
        base: '/api/plaid',
        routes: [
          'POST /create-link-token - Create Plaid Link token',
          'POST /exchange-token - Exchange public token',
          'GET /accounts - Get connected accounts',
          'GET /connection-status - Get connection status',
          'DELETE /items/:itemId - Remove bank connection',
          'GET /debt-summary - Get debt summary from accounts',
          'POST /sync-transactions - Sync transactions',
          'GET /spending-analysis - Get spending analysis',
          'GET /transaction-categories - Get transaction categories',
          'GET /health - Plaid service health',
        ]
      }
    },
    documentation: 'https://your-docs-url.com',
    support: 'support@debttruthcoach.com',
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  // Close server
  server.close(async () => {
    console.log('HTTP server closed.');
    
    // Clean up expired refresh tokens
    try {
      await AuthService.cleanupExpiredTokens();
      console.log('Cleaned up expired tokens.');
    } catch (error) {
      console.error('Error cleaning up tokens:', error);
    }
    
    // Exit process
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Start server
const server = app.listen(env.PORT, () => {
  console.log(`
🚀 DebtTruth Coach API Server Started Successfully!

📍 Environment: ${env.NODE_ENV}
🌐 Port: ${env.PORT}
🔗 Health Check: http://localhost:${env.PORT}/health
📚 API Docs: http://localhost:${env.PORT}/api
🏦 Plaid Environment: ${process.env.PLAID_ENV || 'sandbox'}

🔐 Security Features Enabled:
  ✅ CORS Protection
  ✅ Rate Limiting (${env.RATE_LIMIT_MAX} requests per ${env.RATE_LIMIT_WINDOW} minutes)
  ✅ Helmet Security Headers
  ✅ Request Compression
  ✅ Input Validation

📊 Available Endpoints:
  🔑 Authentication: /api/auth/*
  💳 Debt Management: /api/debts/*
  🏦 Loan Comparison: /api/loans/*
  🔗 Bank Integration: /api/plaid/*

Ready to serve requests! 🎉
  `);
});

// Setup graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

export default app;
