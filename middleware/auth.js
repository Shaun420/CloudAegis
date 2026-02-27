import config from '../config/env.js';

// constants
const SECRET_HEADER_NAME = config.secretHeaderName || "";
const SECRET_HEADER_VALUE = config.secretHeaderValue || "";

/**
 * Validates the custom security header
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns {import('express').Response | void}
 */
export const validateHeader = (req, res, next) => {
  const headerValue = req.get(SECRET_HEADER_NAME);
  
  if (!headerValue || headerValue !== SECRET_HEADER_VALUE) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  next();
};

/**
 * Adds security headers to all responses
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns {void}
 */
export const securityHeaders = (req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
};