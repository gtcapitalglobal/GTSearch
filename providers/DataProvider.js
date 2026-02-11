/**
 * Data Provider - Camada de abstração para fontes de dados
 * 
 * Este arquivo implementa o padrão Data Provider para permitir
 * que o sistema funcione em OFFLINE MODE (mock data) ou ONLINE MODE (APIs reais)
 * 
 * Vantagens:
 * - Centraliza toda lógica de acesso a dados
 * - Facilita troca entre mock e APIs reais
 * - Permite testes sem consumir APIs
 * - Segurança: keys nunca expostas no frontend
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OFFLINE_MODE = process.env.OFFLINE_MODE === 'true';

/**
 * Base Data Provider
 */
class DataProvider {
  constructor(name) {
    this.name = name;
    this.offlineMode = OFFLINE_MODE;
  }

  /**
   * Load mock data from /mock folder
   */
  loadMockData(filename) {
    try {
      const filePath = path.join(__dirname, '..', 'mock', filename);
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`❌ Error loading mock data: ${filename}`, error.message);
      return null;
    }
  }

  /**
   * Check if API is allowed
   */
  checkAPIAllowed() {
    if (this.offlineMode) {
      throw new Error(`${this.name} API disabled in OFFLINE MODE`);
    }
  }
}

/**
 * Property Data Provider
 * Fornece dados básicos de propriedades
 */
export class PropertyDataProvider extends DataProvider {
  constructor() {
    super('Property');
  }

  async getPropertyData(address) {
    if (this.offlineMode) {
      console.log(`📦 [OFFLINE] Loading mock property data`);
      return this.loadMockData('property.sample.json');
    }

    this.checkAPIAllowed();
    
    // TODO: Implementar chamada real à API
    // Exemplo: Zillow, Realtor.com, Realty Mole
    throw new Error('Property API not implemented yet');
  }
}

/**
 * Flood Data Provider
 * Fornece dados de risco de inundação (FEMA)
 */
export class FloodDataProvider extends DataProvider {
  constructor() {
    super('Flood');
  }

  async getFloodData(lat, lng) {
    if (this.offlineMode) {
      console.log(`📦 [OFFLINE] Loading mock flood data`);
      return this.loadMockData('flood.sample.json');
    }

    this.checkAPIAllowed();
    
    // TODO: Implementar chamada real à API FEMA
    throw new Error('Flood API not implemented yet');
  }
}

/**
 * Zoning Data Provider
 * Fornece dados de zoneamento
 */
export class ZoningDataProvider extends DataProvider {
  constructor() {
    super('Zoning');
  }

  async getZoningData(lat, lng) {
    if (this.offlineMode) {
      console.log(`📦 [OFFLINE] Loading mock zoning data`);
      return this.loadMockData('zoning.sample.json');
    }

    this.checkAPIAllowed();
    
    // TODO: Implementar chamada real à API de zoneamento
    throw new Error('Zoning API not implemented yet');
  }
}

/**
 * Road Access Data Provider
 * Fornece dados de acesso rodoviário
 */
export class RoadAccessDataProvider extends DataProvider {
  constructor() {
    super('RoadAccess');
  }

  async getRoadAccessData(lat, lng) {
    if (this.offlineMode) {
      console.log(`📦 [OFFLINE] Loading mock road access data`);
      return this.loadMockData('road_access.sample.json');
    }

    this.checkAPIAllowed();
    
    // TODO: Implementar chamada real à API (Google Maps, OpenStreetMap)
    throw new Error('Road Access API not implemented yet');
  }
}

/**
 * Red Flags Data Provider
 * Fornece dados de alertas e problemas
 */
export class RedFlagsDataProvider extends DataProvider {
  constructor() {
    super('RedFlags');
  }

  async getRedFlagsData(address) {
    if (this.offlineMode) {
      console.log(`📦 [OFFLINE] Loading mock red flags data`);
      return this.loadMockData('redflags.sample.json');
    }

    this.checkAPIAllowed();
    
    // TODO: Implementar análise de red flags via APIs
    // - Code enforcement violations
    // - Liens
    // - Environmental issues
    throw new Error('Red Flags API not implemented yet');
  }
}

/**
 * Google Maps Data Provider
 * Fornece dados do Google Maps (mapas, imagens, geocoding)
 */
export class GoogleMapsDataProvider extends DataProvider {
  constructor() {
    super('GoogleMaps');
  }

  async geocode(address) {
    if (this.offlineMode) {
      console.log(`📦 [OFFLINE] Returning mock geocoding data`);
      return {
        lat: 28.5383,
        lng: -81.3792,
        formatted_address: address
      };
    }

    this.checkAPIAllowed();
    
    // TODO: Implementar chamada real ao Google Maps Geocoding API
    throw new Error('Google Maps Geocoding API not implemented yet');
  }

  async getStaticMap(lat, lng, zoom = 15) {
    if (this.offlineMode) {
      throw new Error('Static maps not available in OFFLINE MODE');
    }

    this.checkAPIAllowed();
    
    // TODO: Implementar chamada real ao Google Maps Static API
    throw new Error('Google Maps Static API not implemented yet');
  }
}

/**
 * AI Data Provider
 * Fornece análises via IA (OpenAI, Gemini, Perplexity)
 */
export class AIDataProvider extends DataProvider {
  constructor() {
    super('AI');
  }

  async analyzeProperty(propertyData) {
    if (this.offlineMode) {
      console.log(`📦 [OFFLINE] Returning mock AI analysis`);
      return {
        summary: 'Mock AI analysis - OFFLINE MODE',
        score: 75,
        recommendations: ['Mock recommendation 1', 'Mock recommendation 2']
      };
    }

    this.checkAPIAllowed();
    
    // TODO: Implementar chamada real às APIs de IA
    // - OpenAI GPT-4
    // - Google Gemini
    // - Perplexity
    throw new Error('AI API not implemented yet');
  }
}

/**
 * Comps Data Provider
 * Fornece dados de propriedades comparáveis
 */
export class CompsDataProvider extends DataProvider {
  constructor() {
    super('Comps');
  }

  async getComparables(address, radius = 1) {
    if (this.offlineMode) {
      console.log(`📦 [OFFLINE] Returning mock comps data`);
      return {
        comparables: [
          {
            address: 'Mock Comp 1',
            price: 150000,
            sqft: 1200,
            distance: 0.5
          },
          {
            address: 'Mock Comp 2',
            price: 160000,
            sqft: 1300,
            distance: 0.7
          }
        ]
      };
    }

    this.checkAPIAllowed();
    
    // TODO: Implementar busca de comps via APIs
    // - Zillow
    // - Realtor.com
    // - Redfin
    throw new Error('Comps API not implemented yet');
  }
}

// Export all providers
export default {
  PropertyDataProvider,
  FloodDataProvider,
  ZoningDataProvider,
  RoadAccessDataProvider,
  RedFlagsDataProvider,
  GoogleMapsDataProvider,
  AIDataProvider,
  CompsDataProvider
};
