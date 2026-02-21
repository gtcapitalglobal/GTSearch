/**
 * Secure Logger Utility
 * 
 * Provides logging functions that automatically mask secrets
 * Shows only last 4 characters of sensitive values
 */

// ========================================
// SECRET MASKING
// ========================================

/**
 * List of environment variable names that contain secrets
 */
const SECRET_KEYS = [
  'GOOGLE_MAPS_API_KEY',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'RAPIDAPI_KEY',
  'RENTCAST_API_KEY',
  'ADMIN_TOKEN',
  'JWT_SECRET',
  'DATABASE_URL',
  'API_KEY',
  'SECRET',
  'PASSWORD',
  'TOKEN'
];

/**
 * Check if a key name indicates a secret
 * @param {string} key - Key name to check
 * @returns {boolean} True if key is likely a secret
 */
function isSecretKey(key) {
  const keyUpper = key.toUpperCase();
  return SECRET_KEYS.some(secretKey => keyUpper.includes(secretKey));
}

/**
 * Mask a secret value, showing only last 4 characters
 * @param {string} value - Secret value to mask
 * @returns {string} Masked value (e.g., "****1234")
 */
export function maskSecret(value) {
  if (!value || typeof value !== 'string') {
    return '****';
  }
  
  if (value.length <= 4) {
    return '****';
  }
  
  const last4 = value.slice(-4);
  return `****${last4}`;
}

/**
 * Mask all secrets in an object
 * @param {Object} obj - Object to mask
 * @returns {Object} New object with masked secrets
 */
export function maskSecrets(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const masked = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (isSecretKey(key)) {
      masked[key] = maskSecret(value);
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSecrets(value);
    } else {
      masked[key] = value;
    }
  }
  
  return masked;
}

// ========================================
// SECURE LOGGING FUNCTIONS
// ========================================

/**
 * Log info message with automatic secret masking
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log (will be masked)
 */
export function logInfo(message, data = null) {
  if (data) {
    console.log(`ℹ️  ${message}`, maskSecrets(data));
  } else {
    console.log(`ℹ️  ${message}`);
  }
}

/**
 * Log warning message with automatic secret masking
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log (will be masked)
 */
export function logWarn(message, data = null) {
  if (data) {
    console.warn(`⚠️  ${message}`, maskSecrets(data));
  } else {
    console.warn(`⚠️  ${message}`);
  }
}

/**
 * Log error message with automatic secret masking
 * @param {string} message - Log message
 * @param {Error|Object} error - Error object or data to log (will be masked)
 */
export function logError(message, error = null) {
  if (error) {
    if (error instanceof Error) {
      console.error(`❌ ${message}`, {
        message: error.message,
        stack: error.stack
      });
    } else {
      console.error(`❌ ${message}`, maskSecrets(error));
    }
  } else {
    console.error(`❌ ${message}`);
  }
}

/**
 * Log debug message with automatic secret masking
 * Only logs if NODE_ENV !== 'production'
 * @param {string} message - Log message
 * @param {Object} data - Optional data to log (will be masked)
 */
export function logDebug(message, data = null) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  
  if (data) {
    console.debug(`🐛 ${message}`, maskSecrets(data));
  } else {
    console.debug(`🐛 ${message}`);
  }
}

/**
 * Log API request with automatic secret masking
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {Object} data - Request data (will be masked)
 */
export function logApiRequest(method, path, data = null) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`📡 [${timestamp}] ${method} ${path}`, maskSecrets(data));
  } else {
    console.log(`📡 [${timestamp}] ${method} ${path}`);
  }
}

/**
 * Log API response with automatic secret masking
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {number} status - Response status code
 * @param {Object} data - Response data (will be masked)
 */
export function logApiResponse(method, path, status, data = null) {
  const timestamp = new Date().toISOString();
  const emoji = status >= 200 && status < 300 ? '✅' : '❌';
  if (data) {
    console.log(`${emoji} [${timestamp}] ${method} ${path} ${status}`, maskSecrets(data));
  } else {
    console.log(`${emoji} [${timestamp}] ${method} ${path} ${status}`);
  }
}

// ========================================
// CONFIG STATUS LOGGER
// ========================================

/**
 * Log config status (booleans only, never values)
 * @param {Object} config - Config object
 * @returns {Object} Safe config status (booleans only)
 */
export function logConfigStatus(config) {
  const status = {};
  
  for (const [key, value] of Object.entries(config)) {
    if (isSecretKey(key)) {
      // For secrets, only show if they exist (boolean)
      status[key] = !!value;
    } else {
      status[key] = value;
    }
  }
  
  logInfo('Config Status', status);
  return status;
}

// ========================================
// EXPORTS
// ========================================

export default {
  maskSecret,
  maskSecrets,
  logInfo,
  logWarn,
  logError,
  logDebug,
  logApiRequest,
  logApiResponse,
  logConfigStatus,
  isSecretKey
};
