/**
 * Environment Configuration
 * Centralized environment variable management with validation
 */

const requiredEnvVars = {
  development: ['MONGO_URI', 'JWT_SECRET'],
  production: ['MONGO_URI', 'JWT_SECRET']
};

/**
 * Validate required environment variables
 */
const validateEnv = () => {
  const env = process.env.NODE_ENV || 'development';
  const required = requiredEnvVars[env] || requiredEnvVars.development;
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    if (env === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    console.warn('⚠️  Continuing with missing variables (not recommended)');
  }
};

/**
 * Get environment configuration
 */
const getEnvConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  return {
    env,
    isDevelopment: env === 'development',
    isProduction: env === 'production',
    
    // Server
    port: Number(process.env.PORT) || 4000,
    
    // Database
    mongoUri: process.env.MONGO_URI,
    
    // JWT
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    accessTokenMaxAge: Number(process.env.ACCESS_TOKEN_MAX_AGE_MS || 15 * 60 * 1000),
    
    // CORS
    corsOrigins: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
      : [],
    
    // Email
    smtp: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    
    // AWS S3 (Optional)
    aws: {
      region: process.env.AWS_REGION || 'ap-south-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucketName: process.env.S3_BUCKET_NAME
    },
    
    // Razorpay (Optional)
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
    }
  };
};

// Validate on module load
validateEnv();

module.exports = {
  getEnvConfig,
  validateEnv
};

