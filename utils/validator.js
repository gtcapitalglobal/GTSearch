/**
 * SSOT Validator
 * 
 * Validates all mock outputs against /mock/property.schema.json
 * Ensures data consistency between mock and real APIs
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logError, logWarn } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// SCHEMA LOADING
// ========================================

let propertySchema = null;

/**
 * Load property schema from /mock/property.schema.json
 * @returns {Object} Property schema
 */
function loadPropertySchema() {
  if (propertySchema) {
    return propertySchema;
  }
  
  const schemaPath = path.join(__dirname, '..', 'mock', 'property.schema.json');
  
  try {
    const schemaData = fs.readFileSync(schemaPath, 'utf8');
    propertySchema = JSON.parse(schemaData);
    return propertySchema;
  } catch (error) {
    logError('Failed to load property schema', error);
    throw new Error(`Cannot load property schema: ${error.message}`);
  }
}

// ========================================
// VALIDATION
// ========================================

const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);

/**
 * Validate data against property schema
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result { valid: boolean, errors: array }
 */
export function validatePropertyData(data) {
  const schema = loadPropertySchema();
  const validate = ajv.compile(schema);
  const valid = validate(data);
  
  return {
    valid,
    errors: validate.errors || []
  };
}

/**
 * Validate and throw error if invalid
 * @param {Object} data - Data to validate
 * @throws {Error} If validation fails
 */
export function assertValidPropertyData(data) {
  const result = validatePropertyData(data);
  
  if (!result.valid) {
    const errorMessages = result.errors.map(err => 
      `${err.instancePath} ${err.message}`
    ).join(', ');
    
    throw new Error(`Property data validation failed: ${errorMessages}`);
  }
}

/**
 * Validate mock output before responding
 * Middleware for Express
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function validateMockOutputMiddleware(req, res, next) {
  // Store original res.json
  const originalJson = res.json.bind(res);
  
  // Override res.json to validate before sending
  res.json = function(data) {
    try {
      // Only validate if it looks like property data
      if (data && typeof data === 'object' && !data.error) {
        const result = validatePropertyData(data);
        
        if (!result.valid) {
          logWarn('Mock output validation failed', result.errors);
          
          // Add validation warning to response but don't block
          data._validation = {
            status: 'warning',
            message: 'Data does not fully conform to schema',
            errors: result.errors.map(err => ({
              path: err.instancePath,
              message: err.message
            }))
          };
        }
      }
      
      // Validation passed or not applicable, send normally
      return originalJson(data);
    } catch (error) {
      logError('Validation middleware error', error);
      // Don't block response on validation error
      return originalJson(data);
    }
  };
  
  next();
}

// ========================================
// EXPORTS
// ========================================

export default {
  validatePropertyData,
  assertValidPropertyData,
  validateMockOutputMiddleware,
  loadPropertySchema
};
