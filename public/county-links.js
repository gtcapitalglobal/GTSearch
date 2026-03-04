/**
 * county-links.js — County links with localStorage-first priority
 *
 * Priority order:
 *   1. Admin localStorage (countyLinksAdmin_v2) — edited via /county-links-admin.html
 *   2. Google Sheets cache (countyLinksCache) — 24h TTL
 *   3. Google Sheets live fetch — fallback
 *
 * Field mapping (internal → legacy API compatibility):
 *   appraisal       → appraisal
 *   gis             → gis
 *   clerks          → clerks
 *   code_enforcement→ codeEnforcement
 *   zoning          → planningZoning
 */

const CountyLinks = (() => {
  'use strict';

  // --- Config ---
  const SHEET_ID    = '1Z5IWpfRtu_D5zwdNbB3u68BMjirKOsdF2t_SoZJLJ04';
  const SHEET_TAB   = 'Site FL';
  const CACHE_KEY   = 'countyLinksCache';
  const ADMIN_KEY   = 'countyLinksAdmin_v2';
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  // Column indices in the CSV (original sheet format)
  const COL = {
    COUNTY: 0,
    COUNTY_WEBSITE: 1,
    APPRAISAL: 2,
    GIS: 3,
    CLERKS: 4,
    CODE_ENFORCEMENT: 5,
    PLANNING_ZONING: 6
  };

  // In-memory cache
  let _memoryCache = null;

  // ─────────────────────────────────────────────
  // ADMIN LOCALSTORAGE (primary source)
  // ─────────────────────────────────────────────
  function getAdminData() {
    try {
      const raw = localStorage.getItem(ADMIN_KEY);
      if (!raw) return null;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr) || arr.length === 0) return null;

      const counties = {};
      arr.forEach(item => {
        const key = (item.county || '').toUpperCase().trim();
        if (!key) return;
        const l = item.links || {};
        const displayName = key.replace(/[A-Za-z]+/g, w =>
          w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        );
        counties[key] = {
          name: displayName,
          countyWebsite: l.homepage || '',
          appraisal: l.appraisal || '',
          gis: l.gis || '',
          clerks: l.clerks || '',
          codeEnforcement: l.code_enforcement || '',
          planningZoning: l.zoning || ''
        };
      });
      return Object.keys(counties).length > 0 ? counties : null;
    } catch (e) {
      console.warn('[CountyLinks] Admin data read failed:', e.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────
  // CSV PARSER
  // ─────────────────────────────────────────────
  function parseCSVRow(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
          else inQuotes = false;
        } else { current += ch; }
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ',') { result.push(current.trim()); current = ''; }
        else current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  function parseCountyData(csvText) {
    const lines = csvText.split('\n');
    const counties = {};
    for (const line of lines) {
      if (!line.trim()) continue;
      const cols = parseCSVRow(line);
      const countyName = (cols[COL.COUNTY] || '').trim();
      if (!countyName || countyName.length < 3) continue;
      if (!cols[COL.COUNTY_WEBSITE] || !cols[COL.COUNTY_WEBSITE].startsWith('http')) continue;
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

  // ─────────────────────────────────────────────
  // GOOGLE SHEETS FETCH
  // ─────────────────────────────────────────────
  async function fetchFromSheets() {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`Google Sheets fetch failed: ${response.status}`);
      const csvText = await response.text();
      return parseCountyData(csvText);
    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') throw new Error('Google Sheets fetch timed out (10s)');
      throw e;
    }
  }

  // ─────────────────────────────────────────────
  // SHEETS CACHE
  // ─────────────────────────────────────────────
  function getCache() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      const age = Date.now() - (parsed.timestamp || 0);
      if (age > CACHE_TTL_MS) { localStorage.removeItem(CACHE_KEY); return null; }
      return parsed.data;
    } catch (e) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }

  function setCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (e) {
      console.warn('[CountyLinks] Cache write failed:', e.message);
    }
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────

  /**
   * Get all county links.
   * Priority: Admin localStorage → Sheets cache → Sheets live fetch
   */
  async function getAll() {
    // 1. In-memory
    if (_memoryCache && Object.keys(_memoryCache).length > 0) return _memoryCache;

    // 2. Admin localStorage (primary — edited by user)
    const adminData = getAdminData();
    if (adminData) {
      console.log('[CountyLinks] Loaded from admin localStorage (' + Object.keys(adminData).length + ' counties)');
      _memoryCache = adminData;
      return adminData;
    }

    // 3. Sheets cache (24h)
    const cached = getCache();
    if (cached && Object.keys(cached).length > 0) {
      console.log('[CountyLinks] Loaded from Sheets cache (' + Object.keys(cached).length + ' counties)');
      _memoryCache = cached;
      return cached;
    }

    // 4. Live fetch from Google Sheets
    console.log('[CountyLinks] Fetching from Google Sheets...');
    try {
      const data = await fetchFromSheets();
      const count = Object.keys(data).length;
      if (count > 0) {
        setCache(data);
        _memoryCache = data;
        console.log('[CountyLinks] Fetched and cached ' + count + ' counties from Sheets');
      } else {
        console.warn('[CountyLinks] No county data found in Sheet');
      }
      return data;
    } catch (e) {
      console.warn('[CountyLinks] Sheets fetch failed:', e.message);
      return {};
    }
  }

  /**
   * Get links for a specific county
   */
  async function getByCounty(countyName) {
    if (!countyName) return null;
    const all = await getAll();
    const key = countyName.toUpperCase().trim();
    return all[key] || null;
  }

  /**
   * Force refresh — clears all caches and re-fetches
   * If admin data exists, it stays as primary source
   */
  async function refresh() {
    localStorage.removeItem(CACHE_KEY);
    _memoryCache = null;
    return await getAll();
  }

  /**
   * Get sorted list of county names
   */
  async function getCountyList() {
    const all = await getAll();
    return Object.keys(all).sort();
  }

  /**
   * Check if using admin data (vs Sheets)
   */
  function isUsingAdminData() {
    return !!getAdminData();
  }

  return { getAll, getByCounty, refresh, getCountyList, isUsingAdminData };
})();
