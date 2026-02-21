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

const RENTCAST_AVM_URL = 'https://api.rentcast.io/v1/avm/value';
const RENTCAST_PROPERTIES_URL = 'https://api.rentcast.io/v1/properties';
const REQUEST_TIMEOUT_MS = 15000;  // 15 seconds
const MAX_RETRIES = 1;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MONTHLY_LIMIT = 50; // Hard limit — RentCast free tier = 50 calls/month
const MAX_CACHE_ENTRIES = 500; // Max cache entries before eviction

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
  // Enforce max entries — evict oldest when limit exceeded
  enforceCacheLimit();
  saveCache();
}

/**
 * Enforce max cache entries limit.
 * Evicts oldest entries when cache exceeds MAX_CACHE_ENTRIES.
 */
function enforceCacheLimit() {
  const keys = Object.keys(cacheStore);
  if (keys.length <= MAX_CACHE_ENTRIES) return;
  
  // Sort by timestamp ascending (oldest first)
  const sorted = keys.sort((a, b) => (cacheStore[a]?.timestamp || 0) - (cacheStore[b]?.timestamp || 0));
  const toRemove = sorted.slice(0, keys.length - MAX_CACHE_ENTRIES);
  toRemove.forEach(k => delete cacheStore[k]);
  logInfo(`RentCast cache: evicted ${toRemove.length} oldest entries (limit: ${MAX_CACHE_ENTRIES})`);
}

/**
 * Run startup cache cleanup:
 * 1. Purge expired entries (>7 days)
 * 2. Enforce max entries limit (500)
 * Called once on server startup.
 */
export function startupCacheCleanup() {
  const now = Date.now();
  let purged = 0;
  
  for (const key of Object.keys(cacheStore)) {
    if (now - (cacheStore[key]?.timestamp || 0) > CACHE_TTL_MS) {
      delete cacheStore[key];
      purged++;
    }
  }
  
  // Also enforce max entries
  const beforeLimit = Object.keys(cacheStore).length;
  enforceCacheLimit();
  const afterLimit = Object.keys(cacheStore).length;
  const evicted = beforeLimit - afterLimit;
  
  if (purged > 0 || evicted > 0) {
    saveCache();
    logInfo(`RentCast startup cleanup: purged ${purged} expired, evicted ${evicted} over-limit. Remaining: ${afterLimit}`);
  } else {
    logInfo(`RentCast startup cleanup: cache healthy (${afterLimit} entries)`);
  }
  
  return { purged, evicted, remaining: afterLimit };
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
  comp_count: 6,
  comps: [
    { address: '123 Mock Rd, Ocala, FL 34470', price: 42000, distance_miles: 0.8, sale_date: '2025-09-15', sqft: 0, lot_size_acres: 0.50, bedrooms: 0, bathrooms: 0, year_built: null, correlation: 0.85, days_on_market: null, listing_type: 'Standard', status: 'Sold', property_type: 'Land' },
    { address: '456 Sample Ln, Ocala, FL 34470', price: 48000, distance_miles: 1.2, sale_date: '2025-08-20', sqft: 0, lot_size_acres: 0.45, bedrooms: 0, bathrooms: 0, year_built: null, correlation: 0.72, days_on_market: null, listing_type: 'Standard', status: 'Sold', property_type: 'Land' },
    { address: '789 Test Ave, Ocala, FL 34470', price: 39000, distance_miles: 1.5, sale_date: '2025-07-10', sqft: 0, lot_size_acres: 0.55, bedrooms: 0, bathrooms: 0, year_built: null, correlation: 0.68, days_on_market: null, listing_type: 'Standard', status: 'Sold', property_type: 'Land' },
    { address: '101 Demo Dr, Ocala, FL 34470', price: 51000, distance_miles: 2.0, sale_date: '2025-06-05', sqft: 0, lot_size_acres: 0.48, bedrooms: 0, bathrooms: 0, year_built: null, correlation: 0.55, days_on_market: null, listing_type: 'Standard', status: 'Sold', property_type: 'Land' },
    { address: '202 Fake Blvd, Ocala, FL 34470', price: 44000, distance_miles: 2.3, sale_date: '2025-05-18', sqft: 0, lot_size_acres: 0.52, bedrooms: 0, bathrooms: 0, year_built: null, correlation: 0.48, days_on_market: null, listing_type: 'Auction', status: 'Sold', property_type: 'Land' },
    { address: '303 Phantom Ct, Ocala, FL 34470', price: 47000, distance_miles: 2.8, sale_date: '2025-04-22', sqft: 0, lot_size_acres: 0.40, bedrooms: 0, bathrooms: 0, year_built: null, correlation: 0.42, days_on_market: null, listing_type: 'Standard', status: 'Sold', property_type: 'Land' },
  ],
  subject: {
    year_built: null,
    last_sale_date: '2022-05-10',
    last_sale_price: 25000,
    property_type: 'Land',
    lot_size: 21780,
    lot_size_acres: 0.500,
    sqft: 0,
    bedrooms: 0,
    bathrooms: 0,
    zoning: 'A-1',
    county: 'Marion'
  },
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
    bathrooms: c.bathrooms || 0,
    // Enriched fields (Phase 1)
    year_built: c.yearBuilt || null,
    correlation: c.correlation != null ? parseFloat(Number(c.correlation).toFixed(3)) : null,
    days_on_market: c.daysOnMarket || c.daysOld || null,
    listing_type: c.listingType || null,
    status: c.status || null,
    property_type: c.propertyType || null
  }));
  
  const compCount = comps.length;
  let confidence;
  if (compCount >= 6) confidence = 'HIGH';
  else if (compCount >= 3) confidence = 'MED';
  else confidence = 'LOW';
  
  const usage = checkUsageAllowed();
  
  // Subject property enrichment (from raw response, no extra credit)
  const subject = raw.subjectProperty || raw.subject || {};
  const subjectEnriched = {
    year_built: subject.yearBuilt || raw.yearBuilt || null,
    last_sale_date: subject.lastSaleDate || raw.lastSaleDate || null,
    last_sale_price: subject.lastSalePrice || raw.lastSalePrice || null,
    property_type: subject.propertyType || raw.propertyType || null,
    lot_size: subject.lotSize || raw.lotSize || null,
    lot_size_acres: subject.lotSize ? parseFloat((subject.lotSize / 43560).toFixed(3)) : (raw.lotSize ? parseFloat((raw.lotSize / 43560).toFixed(3)) : null),
    sqft: subject.squareFootage || raw.squareFootage || null,
    bedrooms: subject.bedrooms != null ? subject.bedrooms : (raw.bedrooms != null ? raw.bedrooms : null),
    bathrooms: subject.bathrooms != null ? subject.bathrooms : (raw.bathrooms != null ? raw.bathrooms : null),
    zoning: subject.zoning || raw.zoning || null,
    county: subject.county || raw.county || null
  };
  
  return {
    estimated_fmv: price,
    price_range_low: priceLow,
    price_range_high: priceHigh,
    confidence,
    comp_count: compCount,
    comps,
    subject: subjectEnriched,
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

async function callRentCastAPI(url, queryParams, apiKey) {
  const response = await axios.get(url, {
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
      return await callRentCastAPI(RENTCAST_AVM_URL, queryParams, apiKey);
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

// ========================================
// MOCK DATA — PROPERTY RECORDS (for OFFLINE_MODE)
// ========================================

const MOCK_PROPERTY_RECORD = {
  id: 'mock-prop-001',
  formattedAddress: '3456 SW 34th St, Ocala, FL 34474',
  addressLine1: '3456 SW 34th St',
  addressLine2: null,
  city: 'Ocala',
  state: 'FL',
  stateFips: '12',
  zipCode: '34474',
  county: 'Marion',
  countyFips: '12083',
  latitude: 29.1594,
  longitude: -82.1654,
  propertyType: 'Land',
  bedrooms: 0,
  bathrooms: 0,
  squareFootage: 0,
  lotSize: 21780,
  yearBuilt: null,
  assessorID: 'MOCK-APN-123456',
  legalDescription: 'LOT 5 BLK 3 MOCK SUBDIVISION PB 12 PG 45',
  subdivision: 'Mock Subdivision',
  zoning: 'A-1',
  lastSaleDate: '2020-03-15',
  lastSalePrice: 18000,
  hoa: null,
  features: {
    architectureType: null,
    cooling: false,
    coolingType: null,
    exteriorType: null,
    fireplace: false,
    fireplaceType: null,
    floorCount: 0,
    foundationType: null,
    garage: false,
    garageSpaces: 0,
    garageType: null,
    heating: false,
    heatingType: null,
    pool: false,
    poolType: null,
    roofType: null,
    roomCount: 0,
    unitCount: 0,
    viewType: null
  },
  taxAssessments: {
    '2024': { year: 2024, value: 15000, land: 15000, improvements: 0 },
    '2023': { year: 2023, value: 13500, land: 13500, improvements: 0 }
  },
  propertyTaxes: {
    '2024': { year: 2024, total: 285 },
    '2023': { year: 2023, total: 260 }
  },
  owner: {
    names: ['MOCK OWNER LLC'],
    type: 'Organization',
    mailingAddress: {
      formattedAddress: '100 Main St, Tampa, FL 33601',
      addressLine1: '100 Main St',
      city: 'Tampa',
      state: 'FL',
      zipCode: '33601'
    }
  },
  ownerOccupied: false,
  history: {
    '2020-03-15': { event: 'Sale', date: '2020-03-15', price: 18000 },
    '2015-07-22': { event: 'Sale', date: '2015-07-22', price: 8500 }
  }
};

// ========================================
// PROPERTY RECORDS — GET ALL DATA (1 credit)
// ========================================

/**
 * Get complete property record from RentCast
 * Collects ALL 70+ fields and returns raw + structured data
 * 
 * @param {Object} params
 * @param {string} [params.address] - Full property address
 * @param {number} [params.lat] - Latitude (alternative)
 * @param {number} [params.lon] - Longitude (alternative)
 * @returns {Object} Complete property record with ALL available fields
 */
export async function getPropertyRecord(params = {}) {
  const { address, lat, lon } = params;
  
  // Validate input
  if (!address && (!lat || !lon)) {
    return {
      error: true,
      message: 'Either address or lat+lon is required',
      source: 'RENTCAST',
      endpoint: 'properties',
      _meta: { provider: 'rentcast', timestamp: new Date().toISOString() }
    };
  }
  
  // Check OFFLINE_MODE
  const offlineMode = process.env.OFFLINE_MODE;
  if (offlineMode === undefined || offlineMode === null || offlineMode === '' || offlineMode === 'true') {
    logInfo('RentCast Property Records: OFFLINE_MODE active, returning mock data');
    auditLog({
      action: 'rentcast_property_record',
      provider: 'rentcast_mock',
      result: 'mock',
      metadata: { address: address || `${lat},${lon}`, mode: 'OFFLINE' }
    });
    const usage = checkUsageAllowed();
    return {
      ...MOCK_PROPERTY_RECORD,
      _raw: MOCK_PROPERTY_RECORD,
      source: 'RENTCAST',
      endpoint: 'properties',
      mode: 'MOCK',
      query: { address: address || null, lat: lat || null, lon: lon || null },
      usage: { used: usage.used, remaining: usage.remaining, limit: usage.limit, month: usage.month },
      _meta: { provider: 'rentcast_mock', cached: false, timestamp: new Date().toISOString() }
    };
  }
  
  // Check API key
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    logError('RentCast: RENTCAST_API_KEY not configured');
    return {
      error: true,
      message: 'RENTCAST_API_KEY not configured. Add it to .env or Settings.',
      source: 'RENTCAST',
      endpoint: 'properties',
      _meta: { provider: 'rentcast', timestamp: new Date().toISOString() }
    };
  }
  
  // Cache key for property records (separate namespace)
  const recKey = address 
    ? `rec:${address.toLowerCase().trim()}`
    : `rec:geo:${parseFloat(lat).toFixed(6)},${parseFloat(lon).toFixed(6)}`;
  
  const cached = cacheGet(recKey);
  if (cached) {
    logInfo(`RentCast Property Records: cache HIT for ${recKey}`);
    const usage = checkUsageAllowed();
    auditLog({
      action: 'rentcast_property_record',
      provider: 'rentcast_cache',
      result: 'cache_hit',
      metadata: { key: recKey, address: address || `${lat},${lon}` }
    });
    return {
      ...cached,
      usage: { used: usage.used, remaining: usage.remaining, limit: usage.limit, month: usage.month },
      _meta: { ...cached._meta, cached: true, timestamp: new Date().toISOString() }
    };
  }
  
  // Usage warning
  const usageCheck = checkUsageAllowed();
  let usageWarning = null;
  if (usageCheck.used >= usageCheck.limit) {
    usageWarning = `ATENÇÃO: Limite mensal EXCEDIDO (${usageCheck.used}/${usageCheck.limit}). Chamadas acima de 50 são PAGAS.`;
    logWarn(`RentCast: ${usageWarning}`);
  } else if (usageCheck.remaining <= 10) {
    usageWarning = `Aviso: Restam apenas ${usageCheck.remaining} chamadas gratuitas este mês (${usageCheck.used}/${usageCheck.limit}).`;
    logWarn(`RentCast: ${usageWarning}`);
  }
  
  // Build query
  const queryParams = {};
  if (address) {
    queryParams.address = address;
  } else {
    queryParams.latitude = lat;
    queryParams.longitude = lon;
  }
  
  // Call API
  try {
    logInfo(`RentCast Property Records: calling API for ${address || `${lat},${lon}`} (usage: ${usageCheck.used + 1}/${usageCheck.limit})`);
    
    // Call /v1/properties — returns array, we take first result
    const rawArray = await callWithRetryGeneric(RENTCAST_PROPERTIES_URL, queryParams, apiKey);
    const raw = Array.isArray(rawArray) ? rawArray[0] : rawArray;
    
    if (!raw) {
      return {
        error: true,
        message: 'No property record found for this address',
        source: 'RENTCAST',
        endpoint: 'properties',
        _meta: { provider: 'rentcast_api', timestamp: new Date().toISOString() }
      };
    }
    
    // INCREMENT USAGE
    incrementUsage(`REC:${address || `${lat},${lon}`}`);
    
    // Build structured result — keep ALL raw data + organize key fields
    const result = {
      // === Basic Info ===
      id: raw.id || null,
      formattedAddress: raw.formattedAddress || null,
      addressLine1: raw.addressLine1 || null,
      addressLine2: raw.addressLine2 || null,
      city: raw.city || null,
      state: raw.state || null,
      stateFips: raw.stateFips || null,
      zipCode: raw.zipCode || null,
      county: raw.county || null,
      countyFips: raw.countyFips || null,
      latitude: raw.latitude || null,
      longitude: raw.longitude || null,
      propertyType: raw.propertyType || null,
      bedrooms: raw.bedrooms || 0,
      bathrooms: raw.bathrooms || 0,
      squareFootage: raw.squareFootage || 0,
      lotSize: raw.lotSize || 0,
      lotSizeAcres: raw.lotSize ? parseFloat((raw.lotSize / 43560).toFixed(3)) : 0,
      yearBuilt: raw.yearBuilt || null,
      assessorID: raw.assessorID || null,
      legalDescription: raw.legalDescription || null,
      subdivision: raw.subdivision || null,
      zoning: raw.zoning || null,
      
      // === Last Sale ===
      lastSaleDate: raw.lastSaleDate || null,
      lastSalePrice: raw.lastSalePrice || null,
      
      // === HOA ===
      hoa: raw.hoa || null,
      
      // === Features ===
      features: raw.features || {},
      
      // === Tax Assessments (all years) ===
      taxAssessments: raw.taxAssessments || {},
      
      // === Property Taxes (all years) ===
      propertyTaxes: raw.propertyTaxes || {},
      
      // === Owner ===
      owner: raw.owner || null,
      ownerOccupied: raw.ownerOccupied || false,
      
      // === Sale History ===
      history: raw.history || {},
      
      // === RAW — full unmodified API response for future use ===
      _raw: raw,
      
      // === Meta ===
      source: 'RENTCAST',
      endpoint: 'properties',
      mode: 'LIVE',
      query: { address: address || null, lat: lat || null, lon: lon || null },
      usage: {
        used: usageCheck.used + 1,
        remaining: Math.max(0, usageCheck.remaining - 1),
        limit: usageCheck.limit,
        month: usageCheck.month
      },
      _meta: {
        provider: 'rentcast_api',
        cached: false,
        timestamp: new Date().toISOString()
      }
    };
    
    // Cache
    cacheSet(recKey, result);
    
    // Audit
    auditLog({
      action: 'rentcast_property_record',
      provider: 'rentcast_api',
      result: 'success',
      metadata: {
        address: address || `${lat},${lon}`,
        propertyType: result.propertyType,
        zoning: result.zoning,
        yearBuilt: result.yearBuilt,
        lastSalePrice: result.lastSalePrice,
        usage_count: usageCheck.used + 1
      }
    });
    
    logInfo(`RentCast Property Records: success — ${result.formattedAddress}, type=${result.propertyType}, zoning=${result.zoning} (usage: ${usageCheck.used + 1}/${usageCheck.limit})`);
    if (usageWarning) result.warning = usageWarning;
    return result;
    
  } catch (err) {
    const status = err.response?.status;
    const errMsg = err.response?.data?.message || err.message;
    
    logError(`RentCast Property Records: API error (${status || 'network'}) — ${errMsg}`);
    
    auditLog({
      action: 'rentcast_property_record',
      provider: 'rentcast_api',
      result: 'error',
      metadata: { address: address || `${lat},${lon}`, status, error: errMsg }
    });
    
    if (status && status !== 401 && status !== 403) {
      incrementUsage(`ERROR:REC:${address || `${lat},${lon}`}`);
    }
    
    const usageAfter = checkUsageAllowed();
    const errorResult = {
      error: true,
      message: `RentCast Property Records error: ${errMsg}`,
      status: status || 500,
      source: 'RENTCAST',
      endpoint: 'properties',
      usage: { used: usageAfter.used, remaining: usageAfter.remaining, limit: usageAfter.limit, month: usageAfter.month },
      _meta: { provider: 'rentcast_api', cached: false, timestamp: new Date().toISOString() }
    };
    if (usageWarning) errorResult.warning = usageWarning;
    return errorResult;
  }
}

/**
 * Generic retry wrapper for any RentCast endpoint
 */
async function callWithRetryGeneric(url, queryParams, apiKey) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        logInfo(`RentCast: retry attempt ${attempt}/${MAX_RETRIES}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      return await callRentCastAPI(url, queryParams, apiKey);
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

export default {
  getValueEstimate,
  getPropertyRecord,
  getCacheStats,
  getUsageStats,
  clearCache,
  startupCacheCleanup
};
