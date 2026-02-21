/**
 * Security Middleware
 * 
 * Implements security measures for API endpoints:
 * - Rate limiting (per IP)
 * - Request size limits
 * - Timeouts
 * - Parameter allowlisting
 * - Auth token validation (ADMIN_TOKEN)
 */

import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

// ========================================
// RATE LIMITING
// ========================================

/**
 * Rate limiter for API endpoints
 * Limits: 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Stricter rate limiter for sensitive endpoints
 * Limits: 20 requests per 15 minutes per IP
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'Too many requests to sensitive endpoint, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ========================================
// REQUEST SIZE LIMIT
// ========================================

/**
 * Middleware to enforce request body size limit
 * Max: 1MB
 */
export function requestSizeLimit(req, res, next) {
  const maxSize = 1024 * 1024; // 1MB
  
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    return res.status(413).json({
      error: 'Request body too large',
      maxSize: '1MB',
      received: `${(parseInt(req.headers['content-length']) / 1024 / 1024).toFixed(2)}MB`
    });
  }
  
  next();
}

// ========================================
// TIMEOUT
// ========================================

/**
 * Middleware to enforce request timeout
 * Max: 30 seconds
 */
export function requestTimeout(req, res, next) {
  const timeout = 30000; // 30 seconds
  
  req.setTimeout(timeout, () => {
    res.status(408).json({
      error: 'Request timeout',
      timeout: '30 seconds'
    });
  });
  
  next();
}

// ========================================
// PARAMETER ALLOWLISTING
// ========================================

/**
 * Create middleware to validate request parameters against allowlist
 * @param {string[]} allowedParams - List of allowed parameter names
 * @returns {Function} Express middleware
 */
export function parameterAllowlist(allowedParams) {
  return (req, res, next) => {
    const bodyParams = Object.keys(req.body || {});
    const queryParams = Object.keys(req.query || {});
    const allParams = [...bodyParams, ...queryParams];
    
    const unknownParams = allParams.filter(param => !allowedParams.includes(param));
    
    if (unknownParams.length > 0) {
      return res.status(400).json({
        error: 'Unknown parameters detected',
        unknownParams,
        allowedParams
      });
    }
    
    next();
  };
}

// ========================================
// URL VALIDATION (No Generic Proxy)
// ========================================

/**
 * Middleware to reject user-supplied URLs
 * Prevents generic proxy abuse
 */
export function rejectUserSuppliedUrls(req, res, next) {
  const body = req.body || {};
  const query = req.query || {};
  
  // Check for URL-like parameters
  const urlParams = ['url', 'endpoint', 'target', 'proxy', 'redirect'];
  
  for (const param of urlParams) {
    if (body[param] || query[param]) {
      return res.status(403).json({
        error: 'User-supplied URLs are not allowed',
        reason: 'This endpoint does not accept custom URLs for security reasons'
      });
    }
  }
  
  next();
}

// ========================================
// ADMIN TOKEN AUTH
// ========================================

/**
 * Middleware to validate ADMIN_TOKEN for ONLINE mode
 * Only enforced when OFFLINE_MODE=false
 */
export function requireAdminToken(OFFLINE_MODE) {
  return (req, res, next) => {
    // Skip auth in OFFLINE MODE
    if (OFFLINE_MODE) {
      return next();
    }
    
    // In ONLINE MODE, require ADMIN_TOKEN
    const adminToken = process.env.ADMIN_TOKEN;
    const providedToken = req.headers['x-admin-token'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!adminToken) {
      return res.status(500).json({
        error: 'Server misconfiguration',
        message: 'ADMIN_TOKEN not set on server'
      });
    }
    
    if (!providedToken) {
      return res.status(403).json({
        error: 'Authentication required',
        message: 'Missing X-Admin-Token header'
      });
    }
    
    // Timing-safe comparison to prevent timing attacks
    const tokenMatch = adminToken.length === providedToken.length &&
      crypto.timingSafeEqual(Buffer.from(adminToken), Buffer.from(providedToken));
    if (!tokenMatch) {
      return res.status(403).json({
        error: 'Authentication failed',
        message: 'Invalid ADMIN_TOKEN'
      });
    }
    
    next();
  };
}

// ========================================
// COMBINED SECURITY MIDDLEWARE
// ========================================

/**
 * Apply all security measures to an endpoint
 * @param {Object} options - Security options
 * @param {string[]} options.allowedParams - Allowed parameters
 * @param {boolean} options.strictRateLimit - Use strict rate limiter
 * @param {boolean} options.rejectUrls - Reject user-supplied URLs
 * @param {boolean} options.OFFLINE_MODE - Current OFFLINE_MODE state
 * @returns {Function[]} Array of middleware functions
 */
export function secureEndpoint(options = {}) {
  const {
    allowedParams = [],
    strictRateLimit = false,
    rejectUrls = true,
    OFFLINE_MODE = true
  } = options;
  
  const middleware = [];
  
  // Rate limiting
  middleware.push(strictRateLimit ? strictRateLimiter : apiRateLimiter);
  
  // Request size limit
  middleware.push(requestSizeLimit);
  
  // Timeout
  middleware.push(requestTimeout);
  
  // Parameter allowlisting
  if (allowedParams.length > 0) {
    middleware.push(parameterAllowlist(allowedParams));
  }
  
  // Reject user-supplied URLs
  if (rejectUrls) {
    middleware.push(rejectUserSuppliedUrls);
  }
  
  // Admin token auth
  middleware.push(requireAdminToken(OFFLINE_MODE));
  
  return middleware;
}

export default {
  apiRateLimiter,
  strictRateLimiter,
  requestSizeLimit,
  requestTimeout,
  parameterAllowlist,
  rejectUserSuppliedUrls,
  requireAdminToken,
  secureEndpoint
};
