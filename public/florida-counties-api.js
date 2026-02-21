// Florida Counties API Integration
// Fetches county data from Google Sheets via backend API

let FLORIDA_COUNTIES_CACHE = null;
let _loadingPromise = null; // Prevent concurrent requests

// Function to load counties from API
async function loadFloridaCounties() {
  // Deduplicate concurrent calls
  if (_loadingPromise) return _loadingPromise;
  _loadingPromise = _loadFloridaCountiesImpl();
  try { return await _loadingPromise; } finally { _loadingPromise = null; }
}

async function _loadFloridaCountiesImpl() {
  try {
    const response = await fetch('/api/florida-counties');
    const data = await response.json();
    
    if (data.success) {
      FLORIDA_COUNTIES_CACHE = data.counties;
      console.log(`✅ Florida counties loaded from ${data.cached ? 'cache' : 'Google Sheets'}:`, data.count, 'counties');
      return data.counties;
    } else {
      console.error('❌ Failed to load counties from API:', data.error);
      // Fallback to static file
      return await loadFallbackCounties();
    }
  } catch (error) {
    console.error('❌ Error loading counties from API:', error);
    // Fallback to static file
    return await loadFallbackCounties();
  }
}

// Fallback: load from static file if API fails
async function loadFallbackCounties() {
  try {
    // Use the global FLORIDA_COUNTIES from florida-counties.js if available
    if (typeof FLORIDA_COUNTIES !== 'undefined') {
      FLORIDA_COUNTIES_CACHE = FLORIDA_COUNTIES;
      console.log('⚠️ Using fallback static data:', Object.keys(FLORIDA_COUNTIES_CACHE).length, 'counties');
      return FLORIDA_COUNTIES_CACHE;
    } else {
      console.error('❌ FLORIDA_COUNTIES not found');
      return {};
    }
  } catch (error) {
    console.error('❌ Failed to load fallback data:', error);
    return {};
  }
}

// Function to get county appraisal link (with auto-load if needed)
async function getCountyAppraisalLink(countyName) {
  if (!countyName) return null;
  
  // Load counties if not cached
  if (!FLORIDA_COUNTIES_CACHE) {
    await loadFloridaCounties();
  }
  
  // Normalize county name (uppercase, remove extra spaces)
  const normalized = countyName.toString().toUpperCase().trim();
  
  // Try exact match first
  if (FLORIDA_COUNTIES_CACHE[normalized]) {
    return FLORIDA_COUNTIES_CACHE[normalized];
  }
  
  // Try ST/SAINT/ST. variants (handles "ST LUCIE", "SAINT LUCIE", "ST. LUCIE")
  const stVariants = [
    { from: /^ST\.?\s+/, to: 'SAINT ' },
    { from: /^SAINT\s+/, to: 'ST ' }
  ];
  for (const { from, to } of stVariants) {
    if (from.test(normalized)) {
      const variant = normalized.replace(from, to);
      if (FLORIDA_COUNTIES_CACHE[variant]) {
        return FLORIDA_COUNTIES_CACHE[variant];
      }
    }
  }
  
  return null;
}

// Pre-load counties when page loads
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    loadFloridaCounties();
  });
}

