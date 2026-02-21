/**
 * research-links.js — URL builders for all research link types
 * 
 * Handles:
 * - Owner name parsing (CSV format: "Last First Middle" → firstName, lastName)
 * - URL generation for Owner Research, Skip Trace, Property Research, Comps
 * - State ID mapping for Legacy.com
 * - Coordinate-based links (EPA, FEMA)
 * 
 * Dependencies: county-links.js (for county-specific links)
 */

const ResearchLinks = (() => {
  'use strict';

  // NOTE: Legacy.com state IDs removed — their proprietary IDs don't match
  // standard alphabetical or FIPS ordering. obituarySearch() searches all states.

  // --- Owner Name Parser ---
  /**
   * Parse owner name from CSV format to first/last name
   * CSV formats seen:
   *   "Motley Leo"           → first=Leo, last=Motley
   *   "Stefanski Katherine L" → first=Katherine, last=Stefanski
   *   "King Troy Sean"       → first=Troy, last=King
   *   "LITTELL SANDRA G ESTATE" → first=Sandra, last=Littell (strip suffixes)
   * 
   * @param {string} ownerName - Raw owner name from CSV
   * @returns {{ firstName: string, lastName: string, fullName: string }}
   */
  function parseOwnerName(ownerName) {
    if (!ownerName) return { firstName: '', lastName: '', fullName: '' };

    // Clean up: trim, normalize spaces
    let name = ownerName.trim().replace(/\s+/g, ' ');

    // Remove common suffixes: ESTATE, TRUST, TRUSTEE, LLC, INC, ETAL, ET AL, JR, SR, II, III
    const suffixes = /\b(ESTATE|TRUST|TRUSTEE|LLC|INC|ETAL|ET\s*AL|JR|SR|II|III|IV)\b/gi;
    name = name.replace(suffixes, '').trim().replace(/\s+/g, ' ');

    // Remove trailing punctuation
    name = name.replace(/[,.\s]+$/, '');

    const parts = name.split(' ').filter(p => p.length > 0);

    if (parts.length === 0) {
      return { firstName: '', lastName: '', fullName: ownerName };
    }

    if (parts.length === 1) {
      return { firstName: parts[0], lastName: parts[0], fullName: ownerName };
    }

    // Convention: first word = last name, second word = first name
    const lastName = parts[0];
    const firstName = parts[1];

    // Title case
    const tc = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

    return {
      firstName: tc(firstName),
      lastName: tc(lastName),
      fullName: tc(firstName) + ' ' + tc(lastName)
    };
  }

  // --- Coordinate Parser ---
  /**
   * Parse coordinates string to lat/lng
   * @param {string} coordStr - "28.3252,-82.6016" format
   * @returns {{ lat: number, lng: number } | null}
   */
  function parseCoordinates(coordStr) {
    if (!coordStr) return null;
    const parts = coordStr.split(',').map(s => parseFloat(s.trim()));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
    return null;
  }

  // --- URL Builders ---

  /**
   * Build full property address string
   * @param {Object} prop - Property object with Address, City, State, Zip fields
   * @returns {string} Full address
   */
  function buildAddress(prop) {
    const parts = [
      prop['Address'] || prop.address || '',
      prop['City'] || prop.city || '',
      prop['State'] || prop.state || 'FL',
      prop['Zip'] || prop.zip || ''
    ].filter(Boolean);
    return parts.join(', ');
  }

  // -- Owner Research --

  function googleSearch(ownerName) {
    const name = ownerName || '';
    return `https://www.google.com/search?q=${encodeURIComponent(name)}`;
  }

  function googleNewsOwner(ownerName) {
    const name = ownerName || '';
    return `https://news.google.com/search?q=${encodeURIComponent(name)}&hl=en-US&gl=US&ceid=US:en`;
  }

  function obituarySearch(ownerName) {
    const parsed = parseOwnerName(ownerName);
    return `https://www.legacy.com/obituaries/search?daterange=99999&firstname=${encodeURIComponent(parsed.firstName)}&lastname=${encodeURIComponent(parsed.lastName)}&countryid=1&affiliateid=all`;
  }

  // -- Owner Skip Trace --

  function fastPeopleSearch(ownerName) {
    const parsed = parseOwnerName(ownerName);
    const slug = `${parsed.firstName}-${parsed.lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
    return `https://www.fastpeoplesearch.com/name/${slug}`;
  }

  function truePeopleSearch(ownerName, ownerCity, ownerState) {
    const name = ownerName || '';
    let url = `https://www.truepeoplesearch.com/results?name=${encodeURIComponent(name)}`;
    if (ownerCity && ownerState) {
      url += `&citystatezip=${encodeURIComponent(ownerCity + ', ' + ownerState)}`;
    }
    return url;
  }

  function cyberBackgroundChecks(ownerName, ownerState, ownerCity) {
    const parsed = parseOwnerName(ownerName);
    const slug = `${parsed.firstName}-${parsed.lastName}`.replace(/[^a-zA-Z0-9-]/g, '');
    let url = `https://www.cyberbackgroundchecks.com/people/${slug}`;
    if (ownerState) {
      url += `/${encodeURIComponent(ownerState)}`;
    }
    if (ownerCity) {
      url += `/${encodeURIComponent(ownerCity)}`;
    }
    return url;
  }

  // -- Property Research --

  function googleNewsProperty(address) {
    return `https://news.google.com/search?q=${encodeURIComponent(address)}&hl=en-US&gl=US&ceid=US:en`;
  }

  function epaReport(coordStr) {
    const coords = parseCoordinates(coordStr);
    if (!coords) return 'https://geopub.epa.gov/myem/envmap/myenv.html';
    const buffer = 0.01;
    return `https://geopub.epa.gov/myem/envmap/myenv.html?minx=${(coords.lng - buffer).toFixed(4)}&miny=${(coords.lat - buffer).toFixed(4)}&maxx=${(coords.lng + buffer).toFixed(4)}&maxy=${(coords.lat + buffer).toFixed(4)}`;
  }

  function femaFloodMap(coordStr) {
    const coords = parseCoordinates(coordStr);
    if (!coords) return 'https://msc.fema.gov/portal/search';
    return `https://msc.fema.gov/portal/search?AddressQuery=${coords.lat},${coords.lng}`;
  }

  // -- Research Comparables --

  function realtorComps(prop) {
    const addr = buildAddress(prop);
    return `https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(addr)}`;
  }

  function redfinComps(prop) {
    const addr = buildAddress(prop);
    return `https://www.redfin.com/search#query=${encodeURIComponent(addr)}`;
  }

  function zillowComps(prop) {
    const address = prop['Address'] || prop.address || '';
    const city = prop['City'] || prop.city || '';
    const state = prop['State'] || prop.state || 'FL';
    const zip = prop['Zip'] || prop.zip || '';
    const slug = `${address}-${city}-${state}-${zip}`.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    return `https://www.zillow.com/homes/${slug}_rb/`;
  }

  // --- Generate all links for a property ---

  /**
   * Generate all research links for a property
   * @param {Object} prop - Property object from CSV
   * @param {Object} countyData - County links from CountyLinks.getByCounty()
   * @returns {Object} Organized link groups
   */
  function generateAll(prop, countyData) {
    const ownerName = prop['Owner Name'] || prop['Name'] || prop.ownerName || '';
    const ownerCity = prop['Owner City'] || prop.ownerCity || '';
    const ownerState = prop['Owner State'] || prop.ownerState || '';
    const coordStr = prop['Coordinates'] || prop.coordinates || '';
    const county = prop['County'] || prop.county || '';

    const result = {
      countyLinks: [],
      ownerResearch: [],
      ownerSkipTrace: [],
      propertyResearch: [],
      researchComps: []
    };

    // --- County Links (from Google Sheets) ---
    if (countyData) {
      if (countyData.appraisal) {
        result.countyLinks.push({ label: 'Property Appraiser', url: countyData.appraisal, icon: '🏛️' });
      }
      if (countyData.gis) {
        result.countyLinks.push({ label: 'GIS Map', url: countyData.gis, icon: '🗺️' });
      }
      if (countyData.countyWebsite) {
        result.countyLinks.push({ label: 'County Website', url: countyData.countyWebsite, icon: '🌐' });
      }
      if (countyData.planningZoning) {
        result.countyLinks.push({ label: 'Planning & Zoning', url: countyData.planningZoning, icon: '📋' });
      }
    }

    // --- Owner Research ---
    if (ownerName) {
      result.ownerResearch.push({ label: 'Google Search', url: googleSearch(ownerName), icon: '🔍' });
      result.ownerResearch.push({ label: 'Google News', url: googleNewsOwner(ownerName), icon: '📰' });
      result.ownerResearch.push({ label: 'Obituary Search', url: obituarySearch(ownerName), icon: '🕊️' });
    }

    // --- Owner Skip Trace ---
    if (ownerName) {
      result.ownerSkipTrace.push({ label: 'Fast People Search', url: fastPeopleSearch(ownerName), icon: '👤' });
      result.ownerSkipTrace.push({ label: 'True People Search', url: truePeopleSearch(ownerName, ownerCity, ownerState), icon: '👥' });
      result.ownerSkipTrace.push({ label: 'Cyber Background', url: cyberBackgroundChecks(ownerName, ownerState, ownerCity), icon: '🔎' });
    }

    // --- Property Research ---
    const fullAddress = buildAddress(prop);
    if (fullAddress) {
      result.propertyResearch.push({ label: 'Google News', url: googleNewsProperty(fullAddress), icon: '📰' });
    }
    if (coordStr) {
      result.propertyResearch.push({ label: 'EPA Report', url: epaReport(coordStr), icon: '🌿' });
      result.propertyResearch.push({ label: 'FEMA Flood Map', url: femaFloodMap(coordStr), icon: '🌊' });
    }

    // --- Research Comparables ---
    if (fullAddress || prop['Address']) {
      result.researchComps.push({ label: 'Realtor.com', url: realtorComps(prop), icon: '🏠' });
      result.researchComps.push({ label: 'Redfin', url: redfinComps(prop), icon: '🏡' });
      result.researchComps.push({ label: 'Zillow', url: zillowComps(prop), icon: '🏘️' });
    }

    return result;
  }

  /**
   * Generate Final Due Diligence links (Tela 3 only)
   * @param {Object} countyData - County links from CountyLinks.getByCounty()
   * @returns {Object} Due diligence links
   */
  function generateDueDiligence(countyData) {
    const links = [];

    if (countyData) {
      if (countyData.clerks) {
        links.push({ label: 'Clerks Office', url: countyData.clerks, icon: '⚖️', color: '#dc3545' });
      }
      if (countyData.codeEnforcement) {
        links.push({ label: 'Code Enforcement', url: countyData.codeEnforcement, icon: '🚨', color: '#f59e0b' });
      }
    }

    return links;
  }

  // --- Public API ---
  return {
    parseOwnerName,
    parseCoordinates,
    buildAddress,
    generateAll,
    generateDueDiligence,
    // Individual URL builders (for direct use)
    urls: {
      googleSearch,
      googleNewsOwner,
      obituarySearch,
      fastPeopleSearch,
      truePeopleSearch,
      cyberBackgroundChecks,
      googleNewsProperty,
      epaReport,
      femaFloodMap,
      realtorComps,
      redfinComps,
      zillowComps
    },
    // LEGACY_STATE_IDS removed (incorrect mapping)
  };
})();
