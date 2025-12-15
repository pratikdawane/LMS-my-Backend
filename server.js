// Load environment variables from .env file
// In production (Render), environment variables are set directly in Render dashboard
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const connectDB = require('./src/config/database');
const errorHandler = require('./src/middlewares/errorHandler');
const { getEnvConfig } = require('./src/config/env');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const enrollmentRoutes = require('./src/routes/enrollmentRoutes');

const app = express();
const config = getEnvConfig();

connectDB();

// CORS Configuration - Uses CORS_ORIGINS environment variable (comma-separated URLs)
// Format: CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://yourdomain.com
// Set CORS_ORIGINS in .env file or Render dashboard environment variables
const getCorsOrigins = () => {
  // Default origins for local development
  const defaultLocalOrigins = [
    'https://lms-my-frontend.onrender.com',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];
  
  // Get CORS_ORIGINS from environment variable
  const corsOrigins = config.corsOrigins;
  
  // Always include localhost origins for development purposes
  // Merge configured origins with default localhost origins
  const allOrigins = [...new Set([...defaultLocalOrigins, ...corsOrigins])];
  
  // In development, use defaults if CORS_ORIGINS is not set
  if (config.isDevelopment && corsOrigins.length === 0) {
    return allOrigins;
  }
  
  // In production, if CORS_ORIGINS is not set, allow localhost for development/testing
  // BUT warn that this should be properly configured for production use
  if (config.isProduction && corsOrigins.length === 0) {
    console.warn('⚠️  WARNING: CORS_ORIGINS not set in production!');
    console.warn('⚠️  Allowing localhost origins for development/testing purposes.');
    console.warn('⚠️  For production, please set CORS_ORIGINS environment variable in Render dashboard.');
    console.warn('⚠️  Example: CORS_ORIGINS=http://localhost:5173,https://yourdomain.com');
    // Allow localhost in production if not configured (for development/testing)
    return allOrigins;
  }
  
  // Return configured origins (which now includes localhost)
  return allOrigins;
};

const allowedOrigins = getCorsOrigins();

// Log CORS configuration on startup
console.log('🌐 CORS Configuration:');
console.log(`   Allowed Origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'NONE - CORS will block all requests!'}`);
if (allowedOrigins.length === 0) {
  console.error('❌ ERROR: CORS_ORIGINS not set! Please set it in Render dashboard environment variables.');
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Always allow localhost origins for development
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    if (isLocalhost) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.length === 0) {
      // This should not happen after our update, but keep as fallback
      console.error(`❌ CORS blocked: No allowed origins configured. Origin: ${origin}`);
      return callback(new Error('CORS: No allowed origins configured. Please set CORS_ORIGINS environment variable.'));
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked request from origin: ${origin}`);
      console.warn(`   Allowed origins: ${allowedOrigins.join(', ')}`);
      console.warn(`   To allow this origin, add it to CORS_ORIGINS environment variable.`);
      callback(new Error(`Not allowed by CORS. Allowed origins: ${allowedOrigins.join(', ')}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root route - Welcome message
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Linkcode LMS Backend API is running',
      version: '1.0.0',
      status: 'operational',
      endpoints: {
        health: '/health',
        apiDocs: '/api-docs',
        auth: '/api/auth',
        admin: '/api/admin',
        payments: '/api/payments',
        enrollments: '/api/enrollments'
      },
      timestamp: new Date().toISOString()
    },
    error: null
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/enrollments', enrollmentRoutes);

app.get('/health', (req, res) => {
  res.json({ success: true, data: { message: 'Server is running', status: 'healthy' }, error: null });
});

app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${config.env.toUpperCase()}`);
  console.log(`🌐 CORS Origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : '⚠️  NONE CONFIGURED - CORS WILL BLOCK ALL REQUESTS!'}`);
  if (allowedOrigins.length === 0) {
    console.error(`❌ Set CORS_ORIGINS environment variable in Render dashboard!`);
  }
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
});
