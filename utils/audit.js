/**
 * Audit Log System
 * 
 * Appends audit log on every analysis action
 * Format: timestamp, provider, result
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logError } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// CONFIGURATION
// ========================================

const AUDIT_LOG_DIR = path.join(__dirname, '..', 'logs');
const AUDIT_LOG_FILE = path.join(AUDIT_LOG_DIR, 'audit.log');
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB max log size

// Ensure logs directory exists
if (!fs.existsSync(AUDIT_LOG_DIR)) {
  fs.mkdirSync(AUDIT_LOG_DIR, { recursive: true });
}

// ========================================
// AUDIT LOGGING
// ========================================

/**
 * Append audit log entry
 * @param {Object} entry - Audit log entry
 * @param {string} entry.action - Action performed (e.g., 'property_analysis', 'flood_check')
 * @param {string} entry.provider - Provider used (e.g., 'mock', 'google_maps_api')
 * @param {string} entry.result - Result status (e.g., 'success', 'error')
 * @param {Object} entry.metadata - Additional metadata (optional)
 */
export function auditLog(entry) {
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    timestamp,
    action: entry.action || 'unknown',
    provider: entry.provider || 'unknown',
    result: entry.result || 'unknown',
    metadata: entry.metadata || {}
  };
  
  // Format as JSON line
  const logLine = JSON.stringify(logEntry) + '\n';
  
  try {
    // Check log rotation before writing
    try {
      const stats = fs.statSync(AUDIT_LOG_FILE);
      if (stats.size > MAX_LOG_SIZE) {
        // Rotate: rename current to .old (overwrite previous .old)
        const oldFile = AUDIT_LOG_FILE + '.old';
        fs.renameSync(AUDIT_LOG_FILE, oldFile);
      }
    } catch { /* file doesn't exist yet, that's fine */ }
    
    // Append to audit log file
    fs.appendFileSync(AUDIT_LOG_FILE, logLine, 'utf8');
  } catch (error) {
    logError('Failed to write audit log', error);
  }
}

/**
 * Create audit log middleware for Express
 * Automatically logs all API requests
 * @returns {Function} Express middleware
 */
export function auditLogMiddleware() {
  return (req, res, next) => {
    // Store original res.json
    const originalJson = res.json.bind(res);
    
    // Override res.json to log after response
    res.json = function(data) {
      // Log audit entry
      auditLog({
        action: `${req.method} ${req.path}`,
        provider: data._meta?.provider || 'unknown',
        result: data.error ? 'error' : 'success',
        metadata: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          ip: req.ip,
          userAgent: req.get('user-agent')
        }
      });
      
      // Send response normally
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Read audit log entries
 * @param {Object} options - Query options
 * @param {number} options.limit - Max number of entries to return
 * @param {string} options.action - Filter by action
 * @param {string} options.provider - Filter by provider
 * @param {string} options.result - Filter by result
 * @returns {Array} Array of audit log entries
 */
export function readAuditLog(options = {}) {
  const { limit = 100, action, provider, result } = options;
  
  try {
    if (!fs.existsSync(AUDIT_LOG_FILE)) {
      return [];
    }
    
    const data = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
    const lines = data.trim().split('\n').filter(line => line);
    
    let entries = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(entry => entry !== null);
    
    // Apply filters
    if (action) {
      entries = entries.filter(e => e.action === action);
    }
    if (provider) {
      entries = entries.filter(e => e.provider === provider);
    }
    if (result) {
      entries = entries.filter(e => e.result === result);
    }
    
    // Return latest entries (reverse chronological)
    return entries.slice(-limit).reverse();
  } catch (error) {
    logError('Failed to read audit log', error);
    return [];
  }
}

/**
 * Get audit log statistics
 * @returns {Object} Statistics object
 */
export function getAuditStats() {
  try {
    const entries = readAuditLog({ limit: 10000 }); // Last 10k entries
    
    const stats = {
      totalEntries: entries.length,
      byAction: {},
      byProvider: {},
      byResult: {},
      lastEntry: entries[0] || null
    };
    
    for (const entry of entries) {
      // Count by action
      stats.byAction[entry.action] = (stats.byAction[entry.action] || 0) + 1;
      
      // Count by provider
      stats.byProvider[entry.provider] = (stats.byProvider[entry.provider] || 0) + 1;
      
      // Count by result
      stats.byResult[entry.result] = (stats.byResult[entry.result] || 0) + 1;
    }
    
    return stats;
  } catch (error) {
    logError('Failed to get audit stats', error);
    return {
      totalEntries: 0,
      byAction: {},
      byProvider: {},
      byResult: {},
      lastEntry: null
    };
  }
}

// ========================================
// EXPORTS
// ========================================

export default {
  auditLog,
  auditLogMiddleware,
  readAuditLog,
  getAuditStats
};
