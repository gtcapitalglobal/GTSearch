/**
 * Mock Provider Class
 * 
 * Provides mock data from /mock folder
 * Used in OFFLINE MODE
 */

import { BaseProvider } from './BaseProvider.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MockProvider extends BaseProvider {
  constructor(name, mockFile) {
    super(name);
    this.mockFile = mockFile;
    this.isOnline = false;
  }
  
  async initialize() {
    // Check if mock file exists
    const mockPath = path.join(__dirname, '..', 'mock', this.mockFile);
    
    if (!fs.existsSync(mockPath)) {
      console.warn(`⚠️  Mock file not found: ${this.mockFile}`);
      this.initialized = false;
      return false;
    }
    
    this.initialized = true;
    return true;
  }
  
  async fetch(params) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const mockPath = path.join(__dirname, '..', 'mock', this.mockFile);
    
    try {
      const data = fs.readFileSync(mockPath, 'utf8');
      const parsed = JSON.parse(data);
      
      // Add metadata
      return {
        ...parsed,
        _meta: {
          source: 'mock',
          provider: this.name,
          file: this.mockFile,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`❌ Error loading mock data from ${this.mockFile}:`, error.message);
      throw new Error(`Failed to load mock data: ${error.message}`);
    }
  }
  
  validateConfig() {
    // Mock provider doesn't need config
    return true;
  }
}

export default MockProvider;
