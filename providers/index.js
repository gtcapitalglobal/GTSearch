/**
 * Provider Router
 * 
 * Central router that selects Mock vs API providers based on OFFLINE_MODE
 * Provides unified interface for all data providers
 */

import { MockProvider } from './MockProvider.js';
import { logInfo, logWarn } from '../utils/logger.js';

// Import specific API providers (TODO: implement these)
// import { GoogleMapsProvider } from './GoogleMapsProvider.js';
// import { OpenAIProvider } from './OpenAIProvider.js';
// import { GeminiProvider } from './GeminiProvider.js';
// import { ZillowProvider } from './ZillowProvider.js';

/**
 * Provider Registry
 * Maps provider names to their implementations
 */
const PROVIDER_REGISTRY = {
  property: {
    mockFile: 'property.sample.json',
    // apiClass: GoogleMapsProvider, // TODO
  },
  flood: {
    mockFile: 'flood.sample.json',
    // apiClass: FEMAProvider, // TODO
  },
  zoning: {
    mockFile: 'zoning.sample.json',
    // apiClass: ZoningProvider, // TODO
  },
  roadAccess: {
    mockFile: 'road_access.sample.json',
    // apiClass: RoadAccessProvider, // TODO
  },
  redFlags: {
    mockFile: 'redflags.sample.json',
    // apiClass: RedFlagsProvider, // TODO
  }
};

/**
 * Provider Manager
 * Manages provider instances and routing
 */
export class ProviderManager {
  constructor(OFFLINE_MODE = true) {
    this.OFFLINE_MODE = OFFLINE_MODE;
    this.providers = {};
    this.initialized = false;
  }
  
  /**
   * Initialize all providers
   * @returns {Promise<boolean>} True if all providers initialized successfully
   */
  async initialize() {
    logInfo(`Initializing providers (OFFLINE_MODE=${this.OFFLINE_MODE})`);
    
    for (const [name, config] of Object.entries(PROVIDER_REGISTRY)) {
      try {
        if (this.OFFLINE_MODE) {
          // Use Mock Provider
          this.providers[name] = new MockProvider(name, config.mockFile);
        } else {
          // Use API Provider
          if (config.apiClass) {
            this.providers[name] = new config.apiClass(name);
          } else {
            logWarn(`${name}: API provider not implemented, falling back to mock`);
            this.providers[name] = new MockProvider(name, config.mockFile);
          }
        }
        
        await this.providers[name].initialize();
        logInfo(`✅ ${name} provider initialized`);
      } catch (error) {
        logWarn(`Failed to initialize ${name} provider: ${error.message}`);
        // Fallback to mock
        this.providers[name] = new MockProvider(name, config.mockFile);
        await this.providers[name].initialize();
      }
    }
    
    this.initialized = true;
    return true;
  }
  
  /**
   * Get data from a provider
   * @param {string} providerName - Name of provider
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Fetched data
   */
  async fetch(providerName, params = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const provider = this.providers[providerName];
    
    if (!provider) {
      throw new Error(`Unknown provider: ${providerName}`);
    }
    
    return await provider.fetch(params);
  }
  
  /**
   * Get status of all providers
   * @returns {Object} Status object
   */
  getStatus() {
    const status = {
      OFFLINE_MODE: this.OFFLINE_MODE,
      initialized: this.initialized,
      providers: {}
    };
    
    for (const [name, provider] of Object.entries(this.providers)) {
      status.providers[name] = provider.getStatus();
    }
    
    return status;
  }
  
  /**
   * Switch between OFFLINE and ONLINE modes
   * @param {boolean} offline - True for OFFLINE, false for ONLINE
   */
  async switchMode(offline) {
    if (offline === this.OFFLINE_MODE) {
      logInfo(`Already in ${offline ? 'OFFLINE' : 'ONLINE'} mode`);
      return;
    }
    
    logInfo(`Switching to ${offline ? 'OFFLINE' : 'ONLINE'} mode...`);
    this.OFFLINE_MODE = offline;
    this.initialized = false;
    await this.initialize();
  }
}

/**
 * Create and export singleton instance
 * Will be initialized on first use
 */
let providerManager = null;

export function getProviderManager(OFFLINE_MODE = true) {
  if (!providerManager) {
    providerManager = new ProviderManager(OFFLINE_MODE);
  }
  return providerManager;
}

export default {
  ProviderManager,
  getProviderManager
};
