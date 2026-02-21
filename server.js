import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { validateMockOutputMiddleware } from './utils/validator.js';
import { auditLogMiddleware } from './utils/audit.js';
import { getPropertyDetails } from './api-integrations.js';
import { getValueEstimate, getPropertyRecord, getCacheStats, getUsageStats, clearCache, startupCacheCleanup } from './providers/rentcastProvider.js';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = '5.0.0';

// ========================================
// OFFLINE MODE CONFIGURATION (FAIL-CLOSED)
// ========================================

// Required API keys for ONLINE mode
const REQUIRED_KEYS = [
  'GOOGLE_MAPS_API_KEY',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'RAPIDAPI_KEY'
];

/**
 * Check if all required keys are present
 */
function checkRequiredKeys() {
  const missingKeys = REQUIRED_KEYS.filter(key => !process.env[key]);
  return { valid: missingKeys.length === 0, missingKeys };
}

/**
 * Determine OFFLINE_MODE with FAIL-CLOSED logic:
 * 1. If OFFLINE_MODE is missing or invalid => default TRUE
 * 2. If OFFLINE_MODE=false but keys missing => force TRUE + warn
 */
let OFFLINE_MODE;
const envOfflineMode = process.env.OFFLINE_MODE;

if (envOfflineMode === undefined || envOfflineMode === null || envOfflineMode === '') {
  // Missing => FAIL-CLOSED (default OFFLINE)
  OFFLINE_MODE = true;
  console.warn('⚠️  OFFLINE_MODE not set => defaulting to OFFLINE (fail-closed)');
} else if (envOfflineMode !== 'true' && envOfflineMode !== 'false') {
  // Invalid value => FAIL-CLOSED (default OFFLINE)
  OFFLINE_MODE = true;
  console.warn(`⚠️  OFFLINE_MODE has invalid value "${envOfflineMode}" => defaulting to OFFLINE (fail-closed)`);
} else if (envOfflineMode === 'false') {
  // User wants ONLINE => check keys
  const keyCheck = checkRequiredKeys();
  if (!keyCheck.valid) {
    // Keys missing => FORCE OFFLINE + warn
    OFFLINE_MODE = true;
    console.warn('⚠️  OFFLINE_MODE=false but required keys missing:');
    console.warn(`   Missing: ${keyCheck.missingKeys.join(', ')}`);
    console.warn('   => FORCING OFFLINE MODE for security');
  } else {
    // All keys present => ONLINE OK
    OFFLINE_MODE = false;
  }
} else {
  // OFFLINE_MODE=true => respect it
  OFFLINE_MODE = true;
}

console.log('========================================');
console.log(`🚀 GTSearch Server Starting`);
console.log(`📍 Mode: ${OFFLINE_MODE ? '🔒 OFFLINE (No APIs, No Costs)' : '🌐 ONLINE (APIs Enabled)'}`);
if (!OFFLINE_MODE) {
  console.log(`🔑 API Keys: ${REQUIRED_KEYS.length} loaded`);
}
console.log('========================================');

// Middleware
app.use(cors());
app.use(express.json());

// Audit logging middleware (logs all API requests)
app.use('/api', auditLogMiddleware());

// Validation middleware for mock endpoints
app.use('/api/mock', validateMockOutputMiddleware);

// ========================================
// DEFAULT ROUTE - SERVE MAIN DASHBOARD
// ========================================

// Default route: serve the main dashboard (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Desabilitar cache para analysis.html
app.get('/analysis.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'analysis.html'));
});

// Serve static files from public directory
app.use(express.static('public'));

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Load mock data from /mock folder
 */
function loadMockData(filename) {
  try {
    const filePath = path.join(__dirname, 'mock', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Error loading mock data: ${filename}`, error.message);
    return null;
  }
}

/**
 * Check if API call is allowed in current mode
 */
function checkAPIAllowed(req, res, next) {
  if (OFFLINE_MODE) {
    return res.status(403).json({
      error: 'API calls disabled in OFFLINE MODE',
      message: 'Set OFFLINE_MODE=false to enable API calls',
      offline_mode: true
    });
  }
  next();
}

// ========================================
// CORE ENDPOINTS
// ========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: VERSION,
    offline_mode: OFFLINE_MODE,
    timestamp: new Date().toISOString()
  });
});

// Get system status
app.get('/api/status', (req, res) => {
  res.json({
    OFFLINE_MODE: OFFLINE_MODE,
    offline_mode: OFFLINE_MODE,
    apis_enabled: !OFFLINE_MODE,
    mock_data_available: true,
    version: VERSION,
    timestamp: new Date().toISOString()
  });
});

// Get current API keys status (without exposing the keys)
app.get('/api/config/status', (req, res) => {
  if (OFFLINE_MODE) {
    return res.json({
      offline_mode: true,
      message: 'API keys not checked in OFFLINE MODE',
      google_maps: false,
      openai: false,
      gemini: false,
      perplexity: false,
      rapidapi: false
    });
  }

  res.json({
    offline_mode: false,
    google_maps: !!process.env.GOOGLE_MAPS_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    perplexity: !!process.env.PERPLEXITY_API_KEY,
    rapidapi: !!process.env.RAPIDAPI_KEY,
    rentcast: !!process.env.RENTCAST_API_KEY
  });
});

// ========================================
// DANGEROUS ENDPOINTS (DISABLED IN OFFLINE MODE)
// ========================================

// Save API keys - DISABLED in OFFLINE MODE
app.post('/api/config/save', (req, res) => {
  if (OFFLINE_MODE) {
    return res.status(403).json({
      error: 'Disabled in OFFLINE MODE',
      message: 'Cannot save API keys in OFFLINE MODE for security reasons',
      offline_mode: true
    });
  }

  // In ONLINE mode, this endpoint should require authentication
  // For now, we disable it completely
  return res.status(403).json({
    error: 'Endpoint disabled',
    message: 'Use environment variables to configure API keys',
    recommendation: 'Set keys in .env file or hosting platform'
  });
});

// Get Google Maps API Key for Maps JS SDK loading
// NOTE: Google Maps JS SDK requires client-side key. This is the standard approach.
// Security: Restrict the key by HTTP referrer in Google Cloud Console.
// This endpoint ONLY returns the Maps key, not other API keys.
app.get('/api/google-maps-loader', (req, res) => {
  if (OFFLINE_MODE) {
    return res.json({
      key: null,
      message: 'Google Maps not available in OFFLINE MODE',
      offline_mode: true
    });
  }
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return res.json({ key: null, message: 'GOOGLE_MAPS_API_KEY not configured' });
  }
  res.json({ key });
});

// ========================================
// MOCK DATA ENDPOINTS (ALWAYS AVAILABLE)
// ========================================

// Get mock property data
app.get('/api/mock/property', (req, res) => {
  const data = loadMockData('property.sample.json');
  if (!data) {
    return res.status(500).json({ error: 'Failed to load mock data' });
  }
  res.json(data);
});

// Get mock flood data
app.get('/api/mock/flood', (req, res) => {
  const data = loadMockData('flood.sample.json');
  if (!data) {
    return res.status(500).json({ error: 'Failed to load mock data' });
  }
  res.json(data);
});

// Get mock zoning data
app.get('/api/mock/zoning', (req, res) => {
  const data = loadMockData('zoning.sample.json');
  if (!data) {
    return res.status(500).json({ error: 'Failed to load mock data' });
  }
  res.json(data);
});

// Get mock road access data
app.get('/api/mock/road-access', (req, res) => {
  const data = loadMockData('road_access.sample.json');
  if (!data) {
    return res.status(500).json({ error: 'Failed to load mock data' });
  }
  res.json(data);
});

// Alias with underscore for consistency
app.get('/api/mock/road_access', (req, res) => {
  const data = loadMockData('road_access.sample.json');
  if (!data) {
    return res.status(500).json({ error: 'Failed to load mock data' });
  }
  res.json(data);
});

// Get mock red flags data
app.get('/api/mock/redflags', (req, res) => {
  const data = loadMockData('redflags.sample.json');
  if (!data) {
    return res.status(500).json({ error: 'Failed to load mock data' });
  }
  res.json(data);
});

// Get property schema
app.get('/api/schema/property', (req, res) => {
  const schema = loadMockData('property.schema.json');
  if (!schema) {
    return res.status(500).json({ error: 'Failed to load schema' });
  }
  res.json(schema);
});

// ========================================
// API PROXY ENDPOINTS (DISABLED IN OFFLINE MODE)
// ========================================

// Google Maps API Proxy (with URL allowlist — MED-9)
const GOOGLE_MAPS_ALLOWED_HOSTS = ['maps.googleapis.com', 'roads.googleapis.com'];

app.post('/api/google-maps', checkAPIAllowed, async (req, res) => {
  try {
    const { endpoint, params } = req.body;
    
    if (!endpoint || typeof endpoint !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid endpoint' });
    }
    
    const url = new URL(endpoint);
    
    // Validate URL host against allowlist (prevent SSRF)
    if (!GOOGLE_MAPS_ALLOWED_HOSTS.some(host => url.hostname.endsWith(host))) {
      return res.status(403).json({ error: 'Endpoint not allowed', allowed_hosts: GOOGLE_MAPS_ALLOWED_HOSTS });
    }
    
    url.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY);
    
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await axios.get(url.toString(), { timeout: 15000 });
    res.json(response.data);
  } catch (error) {
    console.error('[Google Maps Proxy] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// OpenAI API Proxy
app.post('/api/openai', checkAPIAllowed, async (req, res) => {
  try {
    const { messages, model = 'gpt-4', max_tokens = 1000 } = req.body;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages,
        max_tokens
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Google Gemini API Proxy
app.post('/api/gemini', checkAPIAllowed, async (req, res) => {
  try {
    const { prompt, model = 'gemini-2.5-flash' } = req.body;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Perplexity API Proxy
app.post('/api/perplexity', checkAPIAllowed, async (req, res) => {
  try {
    const { messages, model = 'llama-3.1-sonar-small-128k-online' } = req.body;

    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model,
        messages
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Zillow API Proxy (RapidAPI)
app.post('/api/zillow', checkAPIAllowed, async (req, res) => {
  try {
    const { endpoint, params } = req.body;
    
    if (!endpoint || typeof endpoint !== 'string' || endpoint.includes('..')) {
      return res.status(400).json({ error: 'Missing or invalid endpoint' });
    }

    const url = new URL(`https://zillow-com1.p.rapidapi.com${endpoint}`);
    
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await axios.get(url.toString(), {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Realtor.com API Proxy (RapidAPI)
app.post('/api/realtor', checkAPIAllowed, async (req, res) => {
  try {
    const { endpoint, params } = req.body;
    
    if (!endpoint || typeof endpoint !== 'string' || endpoint.includes('..')) {
      return res.status(400).json({ error: 'Missing or invalid endpoint' });
    }

    const url = new URL(`https://realtor.p.rapidapi.com${endpoint}`);
    
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await axios.get(url.toString(), {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'realtor.p.rapidapi.com'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Realty Mole API Proxy
app.post('/api/realty-mole', checkAPIAllowed, async (req, res) => {
  try {
    const { endpoint, params } = req.body;
    
    if (!endpoint || typeof endpoint !== 'string' || endpoint.includes('..')) {
      return res.status(400).json({ error: 'Missing or invalid endpoint' });
    }

    const url = new URL(`https://realty-mole-property-api.p.rapidapi.com${endpoint}`);
    
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await axios.get(url.toString(), {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'realty-mole-property-api.p.rapidapi.com'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// NAIP Aerial Imagery
app.post('/api/naip', checkAPIAllowed, async (req, res) => {
  try {
    const { lat, lng, year } = req.body;
    
    // NAIP WMS service URL
    const wmsUrl = `https://gis.apfo.usda.gov/arcgis/services/NAIP/USDA_CONUS_PRIME/ImageServer/WMSServer`;
    
    const params = {
      SERVICE: 'WMS',
      VERSION: '1.3.0',
      REQUEST: 'GetMap',
      LAYERS: '0',
      STYLES: '',
      CRS: 'EPSG:4326',
      BBOX: `${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}`,
      WIDTH: 800,
      HEIGHT: 800,
      FORMAT: 'image/png',
      TIME: year || '2023'
    };

    const queryString = new URLSearchParams(params).toString();
    const fullUrl = `${wmsUrl}?${queryString}`;

    const response = await axios.get(fullUrl, { responseType: 'arraybuffer' });
    
    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    console.error('NAIP error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Landsat Satellite Imagery
app.post('/api/landsat', checkAPIAllowed, async (req, res) => {
  try {
    const { lat, lng, year, satellite } = req.body;
    
    // For now, return mock response
    // Real implementation would use USGS or AWS Landsat data
    res.json({
      message: 'Landsat endpoint - requires implementation',
      params: { lat, lng, year, satellite },
      mock: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// PROPERTY ANALYSIS ENDPOINTS (NEW)
// ========================================

/**
 * Get complete property details (FEMA, Wetlands, Land Use, Zoning)
 * Works for any Florida county. Zoning availability depends on registry.
 */
app.post('/api/property-details', async (req, res) => {
  try {
    const { lat, lng, county, parcelId, parcelGeometry } = req.body;
    
    // Validate required parameters
    if (!lat || !lng || !county) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['lat', 'lng', 'county'],
        received: { lat, lng, county }
      });
    }
    
    // County is accepted dynamically - zoning availability depends on registry
    
    // Get property details from all APIs
    const result = await getPropertyDetails({
      lat,
      lng,
      county,
      parcelId,
      parcelGeometry
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('Error in /api/property-details:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Batch property analysis - analyze multiple properties sequentially
 * Accepts array of properties with lat, lng, county
 * Processes with 500ms delay between each to avoid rate limiting
 * Note: Frontend currently uses individual calls with client-side delay.
 * This endpoint is available for API consumers or future optimization.
 */
app.post('/api/property-details/batch', async (req, res) => {
  try {
    const { properties } = req.body;
    
    if (!Array.isArray(properties) || properties.length === 0) {
      return res.status(400).json({ error: 'properties must be a non-empty array' });
    }
    
    if (properties.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 properties per batch' });
    }
    
    const results = [];
    for (let i = 0; i < properties.length; i++) {
      const { lat, lng, county, parcelId, parcelGeometry } = properties[i];
      
      if (!lat || !lng || !county) {
        results.push({ success: false, error: 'Missing lat, lng, or county', index: i });
        continue;
      }
      
      try {
        const result = await getPropertyDetails({ lat, lng, county, parcelId, parcelGeometry });
        results.push({ ...result, success: true, index: i });
      } catch (err) {
        results.push({ success: false, error: err.message, index: i });
      }
      
      // Rate limit: 500ms between requests
      if (i < properties.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    res.json({
      success: true,
      total: properties.length,
      completed: results.filter(r => r.success === true).length,
      failed: results.filter(r => r.success === false).length,
      results
    });
    
  } catch (error) {
    console.error('Error in /api/property-details/batch:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// ========================================
// RENTCAST COMPS / VALUE ESTIMATE
// ========================================

// Rate limiter: 10 requests per minute per IP for comps endpoint
const compsRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Rate limit: max 10 requests per minute for comps endpoint',
    retry_after_seconds: 60
  }
});

/**
 * GET /api/comps/value-estimate
 * Query params: address OR (lat + lon)
 * Optional filters: propertyType, maxRadius, daysOld, bedrooms, bathrooms, squareFootage, compCount
 * Returns: SSOT value estimate with comps
 * Rate limited: 10 req/min per IP
 */
app.get('/api/comps/value-estimate', compsRateLimiter, async (req, res) => {
  try {
    const { address, lat, lon, propertyType, maxRadius, daysOld, bedrooms, bathrooms, squareFootage, compCount } = req.query;
    
    // Validate input
    if (!address && (!lat || !lon)) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Provide either address or lat+lon',
        usage: {
          by_address: '/api/comps/value-estimate?address=123 Main St, Orlando, FL 32801&propertyType=Land&maxRadius=0.5&daysOld=90',
          by_coords: '/api/comps/value-estimate?lat=28.5383&lon=-81.3792&propertyType=Land'
        }
      });
    }
    
    const params = {};
    if (address) {
      params.address = address;
    } else {
      params.lat = parseFloat(lat);
      params.lon = parseFloat(lon);
      
      if (isNaN(params.lat) || isNaN(params.lon)) {
        return res.status(400).json({
          error: 'Invalid coordinates',
          message: 'lat and lon must be valid numbers'
        });
      }
    }
    
    // Pass optional filters
    if (propertyType) params.propertyType = propertyType;
    if (maxRadius) params.maxRadius = maxRadius;
    if (daysOld) params.daysOld = daysOld;
    if (bedrooms !== undefined && bedrooms !== '') params.bedrooms = bedrooms;
    if (bathrooms !== undefined && bathrooms !== '') params.bathrooms = bathrooms;
    if (squareFootage) params.squareFootage = squareFootage;
    if (compCount) params.compCount = compCount;
    
    const result = await getValueEstimate(params);
    res.json(result);
    
  } catch (error) {
    console.error('Error in /api/comps/value-estimate:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      source: 'RENTCAST'
    });
  }
});

/**
 * GET /api/comps/cache-stats
 * Returns cache statistics (no auth required, read-only)
 */
app.get('/api/comps/cache-stats', (req, res) => {
  res.json(getCacheStats());
});

/**
 * GET /api/comps/usage
 * Returns monthly usage stats (calls used, remaining, limit, last calls)
 */
app.get('/api/comps/usage', (req, res) => {
  res.json(getUsageStats());
});

/**
 * GET /api/property/record
 * Returns complete property record from RentCast (70+ fields)
 * Query params: address OR (lat + lon)
 * Cost: 1 RentCast credit per new lookup (cached for 7 days)
 */
app.get('/api/property/record', compsRateLimiter, async (req, res) => {
  try {
    const { address, lat, lon } = req.query;
    
    if (!address && (!lat || !lon)) {
      return res.status(400).json({
        error: true,
        message: 'Missing required parameter: address OR (lat + lon)',
        usage: {
          by_address: '/api/property/record?address=123 Main St, Orlando, FL 32801',
          by_coords: '/api/property/record?lat=28.5383&lon=-81.3792'
        }
      });
    }
    
    const params = {};
    if (address) params.address = address;
    if (lat) params.lat = parseFloat(lat);
    if (lon) params.lon = parseFloat(lon);
    
    const result = await getPropertyRecord(params);
    res.json(result);
    
  } catch (error) {
    console.error('Error in /api/property/record:', error.message);
    res.status(500).json({
      error: true,
      message: 'Internal server error fetching property record',
      details: error.message
    });
  }
});

/**
 * POST /api/comps/cache-clear
 * Clears the RentCast cache (admin only in production)
 */
app.post('/api/comps/cache-clear', (req, res) => {
  // Only allow cache clear in OFFLINE mode or with a simple auth check
  const authHeader = req.headers['x-admin-key'];
  if (!OFFLINE_MODE && authHeader !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Unauthorized. Set x-admin-key header.' });
  }
  clearCache();
  res.json({ success: true, message: 'RentCast cache cleared' });
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Mode: ${OFFLINE_MODE ? 'OFFLINE' : 'ONLINE'}`);
  console.log(`🔗 Access: http://localhost:${PORT}`);
  console.log('========================================');
  
  // Run cache cleanup on startup
  try {
    const cleanup = startupCacheCleanup();
    console.log(`🧹 Cache cleanup: ${cleanup.purged} expired, ${cleanup.evicted} evicted, ${cleanup.remaining} remaining`);
  } catch (err) {
    console.warn('⚠️ Cache cleanup failed:', err.message);
  }
});
