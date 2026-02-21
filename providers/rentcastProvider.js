/**
 * RentCast AVM Provider
 * 
 * Provides property value estimates via RentCast API
 * Features:
 *   - 7-day cache (keyed by address or lat/lon)
 *   - 1 retry + 15s timeout
 *   - OFFLINE_MODE guard (returns mock)
 *   - Monthly usage counter with SOFT LIMIT of 50 API calls (warn-only, NEVER blocks)
 *     (cache hits do NOT count — only real outbound API calls count)
 * 
 * API: GET https://api.rentcast.io/v1/avm/value
 * Auth: X-Api-Key header
 * 
 * @module providers/rentcastProvider
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logInfo, logWarn, logError } from '../utils/logger.js';
import { auditLog } from '../utils/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// CONFIGURATION
// ========================================

const RENTCAST_BASE_URL = 'https://api.rentcast.io/v1/avm/value';
const REQUEST_TIMEOUT_MS = 15000;  // 15 seconds
const MAX_RETRIES = 1;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MONTHLY_LIMIT = 50; // Hard limit — RentCast free tier = 50 calls/month

const CACHE_DIR = path.join(__dirname, '..', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'rentcast_cache.json');
const USAGE_FILE = path.join(CACHE_DIR, 'rentcast_usage.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// ========================================
// MONTHLY USAGE COUNTER (persisted to disk)
// ========================================

let usageData = { month: '', count: 0, calls: [] };

/**
 * Get current month key (YYYY-MM)
 */
function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Load usage data from disk
 */
function loadUsage() {
  try {
    if (fs.existsSync(USAGE_FILE)) {
      const raw = fs.readFileSync(USAGE_FILE, 'utf8');
      usageData = JSON.parse(raw);
    }
  } catch (err) {
    logWarn('RentCast usage: failed to load, starting fresh');
    usageData = { month: '', count: 0, calls: [] };
  }
  
  // Reset if month changed
  const thisMonth = currentMonthKey();
  if (usageData.month !== thisMonth) {
    logInfo(`RentCast usage: new month ${thisMonth}, resetting counter (was ${usageData.count} in ${usageData.month || 'none'})`);
    usageData = { month: thisMonth, count: 0, calls: [] };
    saveUsage();
  }
}

/**
 * Save usage data to disk
 */
function saveUsage() {
  try {
    fs.writeFileSync(USAGE_FILE, JSON.stringify(usageData, null, 2), 'utf8');
  } catch (err) {
    logError('RentCast usage: failed to save', err);
  }
}

/**
 * Increment usage counter (called ONLY on successful outbound API call)
 */
function incrementUsage(query) {
  usageData.count++;
  usageData.calls.push({
    n: usageData.count,
    query: query,
    timestamp: new Date().toISOString()
  });
  // Keep only last 100 call records to avoid file bloat
  if (usageData.calls.length > 100) {
    usageData.calls = usageData.calls.slice(-100);
  }
  saveUsage();
}

/**
 * Check if we can make another API call
 * @returns {{ allowed: boolean, used: number, remaining: number, limit: number, month: string }}
 */
function checkUsageAllowed() {
  const thisMonth = currentMonthKey();
  if (usageData.month !== thisMonth) {
    usageData = { month: thisMonth, count: 0, calls: [] };
    saveUsage();
  }
  return {
    allowed: usageData.count < MONTHLY_LIMIT,
    used: usageData.count,
    remaining: Math.max(0, MONTHLY_LIMIT - usageData.count),
    limit: MONTHLY_LIMIT,
    month: usageData.month
  };
}

/**
 * Get usage stats (public)
 */
export function getUsageStats() {
  const thisMonth = currentMonthKey();
  if (usageData.month !== thisMonth) {
    usageData = { month: thisMonth, count: 0, calls: [] };
    saveUsage();
  }
  return {
    month: usageData.month,
    used: usageData.count,
    remaining: Math.max(0, MONTHLY_LIMIT - usageData.count),
    limit: MONTHLY_LIMIT,
    percent_used: Math.round((usageData.count / MONTHLY_LIMIT) * 100),
    last_calls: usageData.calls.slice(-10) // last 10 calls
  };
}

// Load usage on module init
loadUsage();

// ========================================
// IN-MEMORY CACHE (backed by disk)
// ========================================

let cacheStore = {};

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8');
      cacheStore = JSON.parse(raw);
      const now = Date.now();
      let purged = 0;
      for (const key of Object.keys(cacheStore)) {
        if (now - cacheStore[key].timestamp > CACHE_TTL_MS) {
          delete cacheStore[key];
          purged++;
        }
      }
      if (purged > 0) {
        saveCache();
        logInfo(`RentCast cache: purged ${purged} expired entries`);
      }
      logInfo(`RentCast cache: loaded ${Object.keys(cacheStore).length} entries`);
    }
  } catch (err) {
    logWarn('RentCast cache: failed to load from disk, starting fresh');
    cacheStore = {};
  }
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheStore, null, 2), 'utf8');
  } catch (err) {
    logError('RentCast cache: failed to save to disk', err);
  }
}

function cacheKey(params) {
  let base = null;
  if (params.address) {
    base = `addr:${params.address.toLowerCase().trim()}`;
  } else if (params.lat && params.lon) {
    base = `geo:${parseFloat(params.lat).toFixed(6)},${parseFloat(params.lon).toFixed(6)}`;
  }
  if (!base) return null;
  
  // Include filter params in cache key so different filters = different cache entries
  const filterParts = [];
  if (params.propertyType) filterParts.push(`pt:${params.propertyType}`);
  if (params.maxRadius) filterParts.push(`r:${params.maxRadius}`);
  if (params.daysOld) filterParts.push(`d:${params.daysOld}`);
  if (params.bedrooms !== undefined && params.bedrooms !== null && params.bedrooms !== '') filterParts.push(`bd:${params.bedrooms}`);
  if (params.bathrooms !== undefined && params.bathrooms !== null && params.bathrooms !== '') filterParts.push(`ba:${params.bathrooms}`);
  if (params.squareFootage) filterParts.push(`sf:${params.squareFootage}`);
  if (params.compCount) filterParts.push(`cc:${params.compCount}`);
  
  return filterParts.length > 0 ? `${base}|${filterParts.join('|')}` : base;
}

function cacheGet(key) {
  if (!key || !cacheStore[key]) return null;
  const entry = cacheStore[key];
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    delete cacheStore[key];
    return null;
  }
  return entry.data;
}

function cacheSet(key, data) {
  if (!key) return;
  cacheStore[key] = { timestamp: Date.now(), data };
  saveCache();
}

loadCache();

// ========================================
// MOCK DATA (for OFFLINE_MODE)
// ========================================

const MOCK_RESPONSE = {
  estimated_fmv: 45000,
  price_range_low: 38000,
  price_range_high: 52000,
  confidence: 'HIGH',
  comps: [
    { address: '123 Mock Rd, Ocala, FL 34470', price: 42000, distance_miles: 0.8, sale_date: '2025-09-15', sqft: 0, lot_size_acres: 0.50, bedrooms: 0, bathrooms: 0 },
    { address: '456 Sample Ln, Ocala, FL 34470', price: 48000, distance_miles: 1.2, sale_date: '2025-08-20', sqft: 0, lot_size_acres: 0.45, bedrooms: 0, bathrooms: 0 },
    { address: '789 Test Ave, Ocala, FL 34470', price: 39000, distance_miles: 1.5, sale_date: '2025-07-10', sqft: 0, lot_size_acres: 0.55, bedrooms: 0, bathrooms: 0 },
    { address: '101 Demo Dr, Ocala, FL 34470', price: 51000, distance_miles: 2.0, sale_date: '2025-06-05', sqft: 0, lot_size_acres: 0.48, bedrooms: 0, bathrooms: 0 },
    { address: '202 Fake Blvd, Ocala, FL 34470', price: 44000, distance_miles: 2.3, sale_date: '2025-05-18', sqft: 0, lot_size_acres: 0.52, bedrooms: 0, bathrooms: 0 },
    { address: '303 Phantom Ct, Ocala, FL 34470', price: 47000, distance_miles: 2.8, sale_date: '2025-04-22', sqft: 0, lot_size_acres: 0.40, bedrooms: 0, bathrooms: 0 },
  ],
  source: 'RENTCAST',
  mode: 'MOCK',
  _meta: { provider: 'rentcast_mock', cached: false, timestamp: new Date().toISOString() }
};

// ========================================
// SSOT RESPONSE MAPPER
// ========================================

function mapToSSOT(raw, params, fromCache = false) {
  const price = raw.price || raw.value || 0;
  const priceLow = raw.priceRangeLow || raw.price_range_low || 0;
  const priceHigh = raw.priceRangeHigh || raw.price_range_high || 0;
  
  const rawComps = raw.comparables || raw.comps || [];
  const comps = rawComps.slice(0, 10).map(c => ({
    address: c.formattedAddress || c.address || c.addressLine1 || '-',
    price: c.price || c.lastSalePrice || c.salePrice || 0,
    distance_miles: c.distance ? parseFloat(c.distance.toFixed(2)) : null,
    sale_date: c.lastSaleDate || c.saleDate || c.correlationDate || null,
    sqft: c.squareFootage || c.sqft || 0,
    lot_size_acres: c.lotSize ? parseFloat((c.lotSize / 43560).toFixed(3)) : (c.lot_size_acres || 0),
    bedrooms: c.bedrooms || 0,
    bathrooms: c.bathrooms || 0
  }));
  
  const compCount = comps.length;
  let confidence;
  if (compCount >= 6) confidence = 'HIGH';
  else if (compCount >= 3) confidence = 'MED';
  else confidence = 'LOW';
  
  const usage = checkUsageAllowed();
  
  return {
    estimated_fmv: price,
    price_range_low: priceLow,
    price_range_high: priceHigh,
    confidence,
    comp_count: compCount,
    comps,
    source: 'RENTCAST',
    mode: 'LIVE',
    query: {
      address: params.address || null,
      lat: params.lat || null,
      lon: params.lon || null
    },
    usage: {
      used: usage.used,
      remaining: usage.remaining,
      limit: usage.limit,
      month: usage.month
    },
    _meta: {
      provider: 'rentcast_api',
      cached: fromCache,
      timestamp: new Date().toISOString()
    }
  };
}

// ========================================
// CORE API CALL (with retry)
// ========================================

async function callRentCastAPI(queryParams, apiKey) {
  const response = await axios.get(RENTCAST_BASE_URL, {
    params: queryParams,
    headers: {
      'X-Api-Key': apiKey,
      'Accept': 'application/json'
    },
    timeout: REQUEST_TIMEOUT_MS
  });
  return response.data;
}

async function callWithRetry(queryParams, apiKey) {
  let lastError;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        logInfo(`RentCast: retry attempt ${attempt}/${MAX_RETRIES}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      return await callRentCastAPI(queryParams, apiKey);
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw err;
      }
      logWarn(`RentCast: attempt ${attempt + 1} failed (${err.message})`);
    }
  }
  
  throw lastError;
}

// ========================================
// PUBLIC API
// ========================================

/**
 * Get property value estimate from RentCast
 * 
 * @param {Object} params
 * @param {string} [params.address] - Full property address (preferred)
 * @param {number} [params.lat] - Latitude (alternative to address)
 * @param {number} [params.lon] - Longitude (alternative to address)
 * @param {string} [params.propertyType] - Property type: Land, Single Family, Condo, etc.
 * @param {number} [params.maxRadius] - Max radius in miles for comps (default 0.5)
 * @param {number} [params.daysOld] - Max days since comp listed (default 90)
 * @param {number} [params.bedrooms] - Number of bedrooms
 * @param {number} [params.bathrooms] - Number of bathrooms
 * @param {number} [params.squareFootage] - Square footage
 * @param {number} [params.compCount] - Number of comps to return (5-25, default 10)
 * @returns {Object} SSOT-formatted value estimate with comps
 */
export async function getValueEstimate(params = {}) {
  const { address, lat, lon, propertyType, maxRadius, daysOld, bedrooms, bathrooms, squareFootage, compCount } = params;
  
  // Validate input
  if (!address && (!lat || !lon)) {
    return {
      error: true,
      message: 'Either address or lat+lon is required',
      source: 'RENTCAST',
      _meta: { provider: 'rentcast', timestamp: new Date().toISOString() }
    };
  }
  
  // Check OFFLINE_MODE
  const offlineMode = process.env.OFFLINE_MODE;
  if (offlineMode === undefined || offlineMode === null || offlineMode === '' || offlineMode === 'true') {
    logInfo('RentCast: OFFLINE_MODE active, returning mock data');
    auditLog({
      action: 'rentcast_value_estimate',
      provider: 'rentcast_mock',
      result: 'mock',
      metadata: { address: address || `${lat},${lon}`, mode: 'OFFLINE' }
    });
    const usage = checkUsageAllowed();
    return {
      ...MOCK_RESPONSE,
      query: { address: address || null, lat: lat || null, lon: lon || null },
      usage: { used: usage.used, remaining: usage.remaining, limit: usage.limit, month: usage.month },
      _meta: { ...MOCK_RESPONSE._meta, timestamp: new Date().toISOString() }
    };
  }
  
  // Check API key exists
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    logError('RentCast: RENTCAST_API_KEY not configured');
    return {
      error: true,
      message: 'RENTCAST_API_KEY not configured. Add it to .env or Settings.',
      source: 'RENTCAST',
      _meta: { provider: 'rentcast', timestamp: new Date().toISOString() }
    };
  }
  
  // Check cache FIRST (cache hits don't count toward usage)
  const key = cacheKey(params);
  const cached = cacheGet(key);
  if (cached) {
    logInfo(`RentCast: cache HIT for ${key} (no API call used)`);
    const usage = checkUsageAllowed();
    auditLog({
      action: 'rentcast_value_estimate',
      provider: 'rentcast_cache',
      result: 'cache_hit',
      metadata: { key, address: address || `${lat},${lon}` }
    });
    return {
      ...cached,
      usage: { used: usage.used, remaining: usage.remaining, limit: usage.limit, month: usage.month },
      _meta: { ...cached._meta, cached: true, timestamp: new Date().toISOString() }
    };
  }
  
  // Usage check — warn but NEVER block
  const usageCheck = checkUsageAllowed();
  let usageWarning = null;
  if (usageCheck.used >= usageCheck.limit) {
    usageWarning = `ATENÇÃO: Limite mensal EXCEDIDO (${usageCheck.used}/${usageCheck.limit}). Chamadas acima de 50 são PAGAS.`;
    logWarn(`RentCast: ${usageWarning}`);
  } else if (usageCheck.remaining <= 10) {
    usageWarning = `Aviso: Restam apenas ${usageCheck.remaining} chamadas gratuitas este mês (${usageCheck.used}/${usageCheck.limit}).`;
    logWarn(`RentCast: ${usageWarning}`);
  }
  
  // Build query params
  const queryParams = {};
  if (address) {
    queryParams.address = address;
  } else {
    queryParams.latitude = lat;
    queryParams.longitude = lon;
  }
  // Optional filters — only add if provided
  if (propertyType) queryParams.propertyType = propertyType;
  if (maxRadius) queryParams.maxRadius = parseFloat(maxRadius);
  if (daysOld) queryParams.daysOld = parseInt(daysOld);
  if (bedrooms !== undefined && bedrooms !== null && bedrooms !== '') queryParams.bedrooms = parseFloat(bedrooms);
  if (bathrooms !== undefined && bathrooms !== null && bathrooms !== '') queryParams.bathrooms = parseFloat(bathrooms);
  if (squareFootage) queryParams.squareFootage = parseFloat(squareFootage);
  if (compCount) queryParams.compCount = Math.min(25, Math.max(5, parseInt(compCount)));
  
  // Call API
  try {
    logInfo(`RentCast: calling API for ${address || `${lat},${lon}`} (usage: ${usageCheck.used + 1}/${usageCheck.limit})`);
    const raw = await callWithRetry(queryParams, apiKey);
    
    // *** INCREMENT USAGE ONLY ON SUCCESSFUL API CALL ***
    incrementUsage(address || `${lat},${lon}`);
    
    // Map to SSOT
    const result = mapToSSOT(raw, params, false);
    
    // Cache result
    cacheSet(key, result);
    
    // Audit log
    auditLog({
      action: 'rentcast_value_estimate',
      provider: 'rentcast_api',
      result: 'success',
      metadata: {
        address: address || `${lat},${lon}`,
        estimated_fmv: result.estimated_fmv,
        comp_count: result.comp_count,
        confidence: result.confidence,
        usage_count: usageCheck.used + 1
      }
    });
    
    logInfo(`RentCast: success — FMV=$${result.estimated_fmv}, ${result.comp_count} comps, confidence=${result.confidence} (usage: ${usageCheck.used + 1}/${usageCheck.limit})`);
    if (usageWarning) result.warning = usageWarning;
    return result;
    
  } catch (err) {
    const status = err.response?.status;
    const errMsg = err.response?.data?.message || err.message;
    
    logError(`RentCast: API error (${status || 'network'}) — ${errMsg}`);
    
    auditLog({
      action: 'rentcast_value_estimate',
      provider: 'rentcast_api',
      result: 'error',
      metadata: {
        address: address || `${lat},${lon}`,
        status,
        error: errMsg
      }
    });
    
    // NOTE: Failed calls that returned 4xx/5xx still consumed an API credit
    // at RentCast's end, so we count them too for safety
    if (status && status !== 401 && status !== 403) {
      // Don't count auth errors (key invalid) — those don't consume credits
      incrementUsage(`ERROR:${address || `${lat},${lon}`}`);
    }
    
    const usageAfter = checkUsageAllowed();
    const errorResult = {
      error: true,
      message: `RentCast API error: ${errMsg}`,
      status: status || 500,
      source: 'RENTCAST',
      usage: {
        used: usageAfter.used,
        remaining: usageAfter.remaining,
        limit: usageAfter.limit,
        month: usageAfter.month
      },
      _meta: {
        provider: 'rentcast_api',
        cached: false,
        timestamp: new Date().toISOString()
      }
    };
    if (usageWarning) errorResult.warning = usageWarning;
    return errorResult;
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const entries = Object.keys(cacheStore).length;
  const now = Date.now();
  let validEntries = 0;
  let oldestAge = 0;
  
  for (const entry of Object.values(cacheStore)) {
    const age = now - entry.timestamp;
    if (age <= CACHE_TTL_MS) {
      validEntries++;
      if (age > oldestAge) oldestAge = age;
    }
  }
  
  return {
    total_entries: entries,
    valid_entries: validEntries,
    oldest_age_hours: Math.round(oldestAge / (1000 * 60 * 60)),
    cache_ttl_days: 7
  };
}

/**
 * Clear the cache
 */
export function clearCache() {
  cacheStore = {};
  saveCache();
  logInfo('RentCast cache: cleared');
}

export default {
  getValueEstimate,
  getCacheStats,
  getUsageStats,
  clearCache
};
