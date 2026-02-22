import dotenv from 'dotenv';

// Load environment variables once
dotenv.config();

/**
 * Application configuration
 * @type {Object}
 */
export const config = {
  // Server
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Security
  secretHeaderName: process.env.SECRET_HEADER_NAME || 'X-Secret-Key',
  secretHeaderValue: process.env.SECRET_HEADER_VALUE,
  encryptionKey: process.env.ENCRYPTION_KEY,
  
  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600, // 100MB
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  
  // SSL
  sslKeyPath: process.env.SSL_KEY_PATH || './ssl/key.pem',
  sslCertPath: process.env.SSL_CERT_PATH || './ssl/cert.pem',
  
  // Rate Limiting
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
};

export default config;