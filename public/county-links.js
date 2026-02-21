/**
 * county-links.js — Fetch county links from Google Sheets (Site FL tab)
 * 
 * Source: Google Sheets public API (CSV output)
 * Sheet ID: 1Z5IWpfRtu_D5zwdNbB3u68BMjirKOsdF2t_SoZJLJ04
 * Tab: Site FL
 * Cache: 24h in localStorage
 * 
 * Column mapping (from Sheet):
 *   Col 0:  County Name (uppercase)
 *   Col 1:  County Website URL
 *   Col 8:  Appraisal (Property Search) URL
 *   Col 15: GIS Map URL
 *   Col 22: Clerks Office URL
 *   Col 29: Code Enforcement URL
 *   Col 36: Planning & Zoning URL
 */

const CountyLinks = (() => {
  'use strict';

  // --- Config ---
  const SHEET_ID = '1Z5IWpfRtu_D5zwdNbB3u68BMjirKOsdF2t_SoZJLJ04';
  const SHEET_TAB = 'Site FL';
  const CACHE_KEY = 'countyLinksCache';
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  // Column indices in the CSV
  const COL = {
    COUNTY: 0,
    COUNTY_WEBSITE: 1,
    APPRAISAL: 8,
    GIS: 15,
    CLERKS: 22,
    CODE_ENFORCEMENT: 29,
    PLANNING_ZONING: 36
  };

  // --- CSV Parser (handles quoted fields with commas) ---
  function parseCSVRow(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++; // skip escaped quote
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  }

  // --- Parse CSV text into county objects ---
  function parseCountyData(csvText) {
    const lines = csvText.split('\n');
    const counties = {};

    for (const line of lines) {
      if (!line.trim()) continue;

      const cols = parseCSVRow(line);
      const countyName = (cols[COL.COUNTY] || '').trim();

      // Skip non-county rows (instructions, headers, empty)
      if (!countyName || countyName.length < 3) continue;
      if (!cols[COL.COUNTY_WEBSITE] || !cols[COL.COUNTY_WEBSITE].startsWith('http')) continue;

      // Title case: "PASCO" → "Pasco", "MIAMI-DADE" → "Miami-Dade", "PALM BEACH" → "Palm Beach"
      const displayName = countyName.replace(/[A-Za-z]+/g, w => 
        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      );

      counties[countyName.toUpperCase()] = {
        name: displayName,
        countyWebsite: cols[COL.COUNTY_WEBSITE] || '',
        appraisal: cols[COL.APPRAISAL] || '',
        gis: cols[COL.GIS] || '',
        clerks: cols[COL.CLERKS] || '',
        codeEnforcement: cols[COL.CODE_ENFORCEMENT] || '',
        planningZoning: cols[COL.PLANNING_ZONING] || ''
      };
    }

    return counties;
  }

  // --- Fetch from Google Sheets API ---
  async function fetchFromSheets() {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`;

    // Timeout after 10 seconds to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Google Sheets fetch failed: ${response.status}`);
      }

      const csvText = await response.text();
      return parseCountyData(csvText);
    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        throw new Error('Google Sheets fetch timed out (10s)');
      }
      throw e;
    }
  }

  // --- Cache management ---
  function getCache() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      const age = Date.now() - (parsed.timestamp || 0);

      if (age > CACHE_TTL_MS) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return parsed.data;
    } catch (e) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }

  function setCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: data
      }));
    } catch (e) {
      console.warn('[CountyLinks] Cache write failed:', e.message);
    }
  }

  // --- Public API ---

  // In-memory cache to avoid redundant getAll() calls within same session
  let _memoryCache = null;

  /**
   * Get all county links data (from cache or fresh fetch)
   * @returns {Promise<Object>} Map of county name (uppercase) → link object
   */
  async function getAll() {
    // Return in-memory cache if available
    if (_memoryCache && Object.keys(_memoryCache).length > 0) {
      return _memoryCache;
    }

    // Try localStorage cache
    const cached = getCache();
    if (cached && Object.keys(cached).length > 0) {
      console.log('[CountyLinks] Loaded from cache (' + Object.keys(cached).length + ' counties)');
      _memoryCache = cached;
      return cached;
    }

    // Fetch fresh
    console.log('[CountyLinks] Fetching from Google Sheets...');
    const data = await fetchFromSheets();
    const count = Object.keys(data).length;

    if (count > 0) {
      setCache(data);
      _memoryCache = data;
      console.log('[CountyLinks] Fetched and cached ' + count + ' counties');
    } else {
      console.warn('[CountyLinks] No county data found in Sheet');
    }

    return data;
  }

  /**
   * Get links for a specific county
   * @param {string} countyName - County name (case-insensitive)
   * @returns {Promise<Object|null>} Link object or null if not found
   */
  async function getByCounty(countyName) {
    if (!countyName) return null;

    const all = await getAll();
    const key = countyName.toUpperCase().trim();

    return all[key] || null;
  }

  /**
   * Force refresh from Google Sheets (bypass cache)
   * @returns {Promise<Object>} Fresh county data
   */
  async function refresh() {
    localStorage.removeItem(CACHE_KEY);
    _memoryCache = null;
    return await getAll();
  }

  /**
   * Get the list of available county names
   * @returns {Promise<string[]>} Array of county names
   */
  async function getCountyList() {
    const all = await getAll();
    return Object.keys(all).sort();
  }

  return {
    getAll,
    getByCounty,
    refresh,
    getCountyList
  };
})();
