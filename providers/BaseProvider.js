/**
 * Base Provider Class
 * 
 * Abstract base class for all data providers
 * Defines common interface and behavior
 */

export class BaseProvider {
  constructor(name) {
    this.name = name;
    this.isOnline = false;
  }
  
  /**
   * Initialize provider (setup connections, validate config, etc.)
   * @returns {Promise<boolean>} True if initialization successful
   */
  async initialize() {
    throw new Error(`${this.name}: initialize() must be implemented by subclass`);
  }
  
  /**
   * Fetch data from provider
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Fetched data
   */
  async fetch(params) {
    throw new Error(`${this.name}: fetch() must be implemented by subclass`);
  }
  
  /**
   * Validate provider configuration
   * @returns {boolean} True if config is valid
   */
  validateConfig() {
    throw new Error(`${this.name}: validateConfig() must be implemented by subclass`);
  }
  
  /**
   * Get provider status
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      name: this.name,
      isOnline: this.isOnline,
      initialized: this.initialized || false
    };
  }
}

export default BaseProvider;
