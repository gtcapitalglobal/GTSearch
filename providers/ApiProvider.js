/**
 * API Provider Class
 * 
 * Base class for providers that fetch from external APIs
 * Used in ONLINE MODE
 */

import { BaseProvider } from './BaseProvider.js';
import axios from 'axios';

export class ApiProvider extends BaseProvider {
  constructor(name, config = {}) {
    super(name);
    this.config = config;
    this.isOnline = true;
    this.apiKey = null;
    this.baseUrl = null;
    this.timeout = config.timeout || 30000; // 30s default
  }
  
  async initialize() {
    // Validate config
    if (!this.validateConfig()) {
      console.error(`❌ ${this.name}: Invalid configuration`);
      this.initialized = false;
      return false;
    }
    
    // Test API connection (optional, can be overridden)
    try {
      await this.testConnection();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error(`❌ ${this.name}: Connection test failed:`, error.message);
      this.initialized = false;
      return false;
    }
  }
  
  async fetch(params) {
    if (!this.initialized) {
      throw new Error(`${this.name}: Provider not initialized`);
    }
    
    // Must be implemented by subclass
    throw new Error(`${this.name}: fetch() must be implemented by subclass`);
  }
  
  validateConfig() {
    // Must be implemented by subclass
    throw new Error(`${this.name}: validateConfig() must be implemented by subclass`);
  }
  
  /**
   * Test API connection
   * Can be overridden by subclass
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    // Default: no test
    return true;
  }
  
  /**
   * Make HTTP request with error handling
   * @param {Object} options - Axios request options
   * @returns {Promise<Object>} Response data
   */
  async makeRequest(options) {
    try {
      const response = await axios({
        ...options,
        timeout: this.timeout,
        headers: {
          ...options.headers,
          'User-Agent': 'GTSearch/1.0'
        }
      });
      
      return response.data;
    } catch (error) {
      if (error.response) {
        // API returned error
        throw new Error(`${this.name} API error: ${error.response.status} - ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        // No response received
        throw new Error(`${this.name} API timeout or network error`);
      } else {
        // Request setup error
        throw new Error(`${this.name} request error: ${error.message}`);
      }
    }
  }
}

export default ApiProvider;
