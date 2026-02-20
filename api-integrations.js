/**
 * API Integrations Module
 * Integrates with FEMA, Wetlands (NWI), Land Use (FDOR Statewide), and County Zoning
 * for property analysis in Florida
 * 
 * LAND USE: Florida Statewide Cadastral (FDOR) - covers all 67 counties
 * ZONING: Per-county registry (Putnam via ArcGIS Online, Highlands via self-hosted)
 * WETLANDS: NWI Official MapServer (FWS/USGS)
 * FEMA: NFHL MapServer (official)
 */

import axios from 'axios';
import { getWetlandsProgressive } from './wetlands-local.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load zoning registry
let REGISTRY = {};
try {
    const registryPath = join(__dirname, 'zoning_registry.json');
    REGISTRY = JSON.parse(readFileSync(registryPath, 'utf-8'));
    console.log('[Registry] Loaded zoning_registry.json');
} catch (err) {
    console.error('[Registry] Failed to load zoning_registry.json:', err.message);
}

// Simple in-memory cache (parcel_id -> result)
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCached(key) {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
    cache.delete(key);
    return null;
}

function setCache(key, data) {
    cache.set(key, { data, ts: Date.now() });
}

// ============================================================================
// HELPER: Safe ArcGIS query with timeout + retries
// ============================================================================

async function safeArcGISQuery(url, params, { timeout = 10000, retries = 1, label = 'ArcGIS' } = {}) {
    let lastError = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(url, { 
                params, 
                timeout,
                // Allow self-signed certs for county servers
                httpsAgent: url.includes('gis.highlandsfl.gov') || url.includes('mgrcmaps.org')
                    ? new (await import('https')).Agent({ rejectUnauthorized: false })
                    : undefined
            });
            
            if (response.data && response.data.features) {
                return response.data;
            }
            
            // ArcGIS error response
            if (response.data && response.data.error) {
                throw new Error(`ArcGIS error: ${response.data.error.message || JSON.stringify(response.data.error)}`);
            }
            
            return response.data;
            
        } catch (error) {
            lastError = error;
            console.warn(`[${label}] Attempt ${attempt + 1}/${retries + 1} failed: ${error.message}`);
            
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // backoff
            }
        }
    }
    
    throw lastError;
}

// ============================================================================
// FEMA FLOOD ZONE (Statewide - Florida)
// ============================================================================

export async function getFEMAFloodZone(lat, lng) {
    try {
        const url = 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query';
        
        const data = await safeArcGISQuery(url, {
            geometry: `${lng},${lat}`,
            geometryType: 'esriGeometryPoint',
            spatialRel: 'esriSpatialRelIntersects',
            outFields: 'FLD_ZONE,ZONE_SUBTY,STATIC_BFE',
            returnGeometry: false,
            f: 'json'
        }, { label: 'FEMA', timeout: 10000, retries: 1 });
        
        if (data.features && data.features.length > 0) {
            const attrs = data.features[0].attributes;
            const zone = attrs.FLD_ZONE || 'Unknown';
            
            let risk = 'unknown';
            let status = '⚠️ AVALIAR';
            
            if (zone === 'X' || zone === 'C') {
                risk = 'minimal';
                status = '✅ APROVADO';
            } else if (zone === 'V' || zone === 'VE') {
                risk = 'high';
                status = '🔴 REJEITAR';
            } else if (zone.startsWith('A')) {
                risk = 'high';
                status = '🔴 ALTO RISCO';
            }
            
            return {
                found: true,
                zone, subtype: attrs.ZONE_SUBTY || null,
                bfe: attrs.STATIC_BFE || null,
                risk, status,
                source: 'FEMA NFHL (official)'
            };
        }
        
        return { found: false, zone: null, risk: 'unknown', status: '⚠️ DADOS NÃO DISPONÍVEIS', source: 'FEMA NFHL' };
        
    } catch (error) {
        console.error('[FEMA] Error:', error.message);
        return { found: false, error: error.message, status: '⚠️ ERRO NA CONSULTA', source: 'FEMA NFHL' };
    }
}

// ============================================================================
// LAND USE - STATEWIDE (Florida Dept of Revenue)
// ============================================================================

/**
 * Get Land Use via Florida Statewide Cadastral (covers ALL 67 FL counties)
 * Uses DOR_UC (Dept of Revenue Use Code) for classification
 */
export async function getStateLandUse(lat, lng, parcelId = null) {
    const cacheKey = `landuse_${parcelId || `${lat}_${lng}`}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;
    
    try {
        const config = REGISTRY.statewide?.land_use;
        const url = config?.url || 'https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';
        
        const params = {
            geometry: `${lng},${lat}`,
            geometryType: 'esriGeometryPoint',
            inSR: 4326,
            spatialRel: 'esriSpatialRelIntersects',
            outFields: 'PARCEL_ID,DOR_UC,OWN_NAME,LND_VAL,JV,SALE_PRC1,SALE_YR1,SALE_MO1,S_LEGAL,CO_NO,LND_SQFOOT,NO_BULDNG,PHY_ADDR1,PHY_CITY',
            returnGeometry: false,
            f: 'json'
        };

        const data = await safeArcGISQuery(url, params, { label: 'FDOR LandUse', timeout: 10000, retries: 1 });
        
        if (data.features && data.features.length > 0) {
            const attrs = data.features[0].attributes;
            const dorCode = String(attrs.DOR_UC || '').padStart(3, '0');
            const dorInfo = REGISTRY.dor_use_codes?.[dorCode] || null;
            
            const result = {
                found: true,
                parcelId: attrs.PARCEL_ID,
                code: dorCode,
                description: dorInfo?.description || `DOR Code ${dorCode}`,
                category: dorInfo?.category || 'unknown',
                buildable: dorInfo?.buildable ?? null,
                owner: attrs.OWN_NAME,
                landValue: attrs.LND_VAL,
                justValue: attrs.JV,
                lastSalePrice: attrs.SALE_PRC1 && attrs.SALE_PRC1 > 0 ? attrs.SALE_PRC1 : null,
                lastSaleDate: attrs.SALE_YR1 ? (attrs.SALE_MO1 ? `${attrs.SALE_MO1}/${attrs.SALE_YR1}` : `${attrs.SALE_YR1}`) : null,
                legalDesc: attrs.S_LEGAL,
                countyCode: attrs.CO_NO,
                sqfoot: attrs.LND_SQFOOT,
                buildings: attrs.NO_BULDNG,
                address: attrs.PHY_ADDR1,
                city: attrs.PHY_CITY,
                status: '✅ DISPONÍVEL',
                source: 'FL Dept of Revenue (Statewide Cadastral)',
                note: 'Classificação fiscal (DOR Use Code) — NÃO é zoning legal'
            };
            
            setCache(cacheKey, result);
            return result;
        }
        
        return {
            found: false,
            status: '⚠️ DADOS NÃO DISPONÍVEIS',
            source: 'FL Dept of Revenue (Statewide Cadastral)',
            note: 'Parcel não encontrado na base estadual'
        };
        
    } catch (error) {
        console.error('[LandUse] Error:', error.message);
        return {
            found: false,
            error: error.message,
            status: '⚠️ ERRO NA CONSULTA',
            source: 'FL Dept of Revenue (Statewide Cadastral)'
        };
    }
}

// ============================================================================
// ZONING - PUTNAM COUNTY (ArcGIS Online - stable)
// ============================================================================

/**
 * Get Zoning for Putnam County using Planning_ReferenceMap layers
 * Layer 2: County Zoning, Layer 3: Municipal Zoning
 * Layer 4: County Proposed Land Use, Layer 5: Municipal Future Land Use
 */
export async function getPutnamZoning(lat, lng) {
    const cacheKey = `zoning_putnam_${lat}_${lng}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;
    
    try {
        const config = REGISTRY.counties?.Putnam?.zoning;
        const baseUrl = config?.base_url || 'https://services1.arcgis.com/YZc1OyqL6jbIOeOv/arcgis/rest/services/Planning_ReferenceMap/FeatureServer';
        
        const pointParams = {
            geometry: `${lng},${lat}`,
            geometryType: 'esriGeometryPoint',
            inSR: 4326,
            spatialRel: 'esriSpatialRelIntersects',
            outFields: '*',
            returnGeometry: false,
            f: 'json'
        };
        
        // Query all 4 layers in parallel
        const [countyZoning, muniZoning, countyFLU, muniFLU] = await Promise.allSettled([
            safeArcGISQuery(`${baseUrl}/2/query`, pointParams, { label: 'Putnam County Zoning', timeout: 10000 }),
            safeArcGISQuery(`${baseUrl}/3/query`, pointParams, { label: 'Putnam Municipal Zoning', timeout: 10000 }),
            safeArcGISQuery(`${baseUrl}/4/query`, pointParams, { label: 'Putnam County FLU', timeout: 10000 }),
            safeArcGISQuery(`${baseUrl}/5/query`, pointParams, { label: 'Putnam Municipal FLU', timeout: 10000 })
        ]);
        
        // Extract results
        const cz = countyZoning.status === 'fulfilled' && countyZoning.value?.features?.length > 0
            ? countyZoning.value.features[0].attributes : null;
        const mz = muniZoning.status === 'fulfilled' && muniZoning.value?.features?.length > 0
            ? muniZoning.value.features[0].attributes : null;
        const cflu = countyFLU.status === 'fulfilled' && countyFLU.value?.features?.length > 0
            ? countyFLU.value.features[0].attributes : null;
        const mflu = muniFLU.status === 'fulfilled' && muniFLU.value?.features?.length > 0
            ? muniFLU.value.features[0].attributes : null;
        
        // Determine jurisdiction: if municipal zoning found, it's municipal
        const isMunicipal = !!mz;
        const zoningData = mz || cz;
        const fluData = mflu || cflu;
        
        if (zoningData || fluData) {
            const zoningCode = zoningData?.ZONECLASS || null;
            const zoningDesc = zoningData?.ZONEDESC || zoningCode || null;
            const fluCode = fluData?.LANDUSECODE || null;
            const fluDesc = fluData?.LANDUSEDESC || fluCode || null;
            
            const result = {
                found: true,
                code: zoningCode,
                description: zoningDesc || 'N/A',
                futureLandUse: fluCode,
                futureLandUseDesc: fluDesc || 'N/A',
                jurisdiction: isMunicipal ? 'Municipal (Putnam County)' : 'Unincorporated Putnam County',
                isMunicipal,
                status: '✅ DISPONÍVEL',
                source: 'Putnam County Planning & Zoning (ArcGIS Online)',
                note: 'Consultar Planning Department para decisões finais',
                manualLink: config?.manual_link || 'https://www.putnam-fl.com/planning-zoning/'
            };
            
            setCache(cacheKey, result);
            return result;
        }
        
        return {
            found: false,
            jurisdiction: 'Unincorporated Putnam County',
            status: '⚠️ DADOS NÃO DISPONÍVEIS',
            source: 'Putnam County Planning & Zoning',
            note: 'Consultar Planning Department',
            manualLink: config?.manual_link || 'https://www.putnam-fl.com/planning-zoning/'
        };
        
    } catch (error) {
        console.error('[Putnam Zoning] Error:', error.message);
        return {
            found: false,
            error: error.message,
            status: '⚠️ ERRO NA CONSULTA',
            source: 'Putnam County Planning & Zoning',
            manualLink: 'https://www.putnam-fl.com/planning-zoning/'
        };
    }
}

// ============================================================================
// ZONING - HIGHLANDS COUNTY (Self-hosted - best effort)
// ============================================================================

/**
 * Get Zoning for Highlands County
 * Uses self-hosted ArcGIS Server (may have SSL issues from some environments)
 * Fields: ZON (zoning code), FLUM (future land use)
 */
// Highlands County Zoning Code Lookup
const HIGHLANDS_ZONING_CODES = {
    'R-1': 'Single Family Residential (Low Density)',
    'R-2': 'Single Family Residential (Medium Density)',
    'R-3': 'Multi-Family Residential',
    'R-4': 'Mobile Home Residential',
    'RR': 'Rural Residential',
    'C-1': 'Neighborhood Commercial',
    'C-2': 'General Commercial',
    'C-3': 'Highway Commercial',
    'C-4': 'Tourist Commercial',
    'I-1': 'Light Industrial',
    'I-2': 'Heavy Industrial',
    'AG': 'Agricultural',
    'AG-3': 'Agricultural (3-acre minimum)',
    'AG-5': 'Agricultural (5-acre minimum)',
    'AG-10': 'Agricultural (10-acre minimum)',
    'PUD': 'Planned Unit Development',
    'MXD': 'Mixed Use Development',
    'CON': 'Conservation',
    'P': 'Public/Institutional',
    'OS': 'Open Space',
    'RE': 'Rural Estate',
    'RM': 'Residential Mixed'
};

export async function getHighlandsZoning(lat, lng) {
    const cacheKey = `zoning_highlands_${lat}_${lng}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;
    
    try {
        const config = REGISTRY.counties?.Highlands?.zoning;
        const url = config?.url || 'https://gis.highlandsfl.gov/server/rest/services/Layers/Zoning/MapServer/0/query';
        const timeout = config?.timeout_ms || 8000;
        const retries = config?.retries || 2;
        
        const params = {
            geometry: `${lng},${lat}`,
            geometryType: 'esriGeometryPoint',
            inSR: 4326,
            spatialRel: 'esriSpatialRelIntersects',
            outFields: '*',
            returnGeometry: false,
            f: 'json'
        };

        const data = await safeArcGISQuery(url, params, { label: 'Highlands Zoning', timeout, retries });
        
        if (data.features && data.features.length > 0) {
            const attrs = data.features[0].attributes;
            
            // Use correct field names: ZON for zoning, FLUM for future land use
            const zoningCode = attrs.ZON || attrs.ZONE_CODE || attrs.ZONING || null;
            const flum = attrs.FLUM || attrs.FUTURE_LAND_USE || null;
            
            const result = {
                found: true,
                code: zoningCode,
                description: HIGHLANDS_ZONING_CODES[zoningCode] || zoningCode || 'N/A',
                futureLandUse: flum,
                futureLandUseDesc: flum || 'N/A',
                jurisdiction: 'Highlands County',
                status: '✅ DISPONÍVEL',
                source: 'Highlands County Planning & Zoning',
                note: 'Confirmar com Planning Dept para decisões finais',
                manualLink: config?.manual_link || 'https://www.highlandsfl.gov/departments/building-zoning'
            };
            
            setCache(cacheKey, result);
            return result;
        }
        
        return {
            found: false,
            jurisdiction: 'Highlands County',
            status: '⚠️ DADOS NÃO DISPONÍVEIS',
            source: 'Highlands County Planning & Zoning',
            note: 'Consultar Planning Department',
            manualLink: config?.manual_link || 'https://www.highlandsfl.gov/departments/building-zoning'
        };
        
    } catch (error) {
        console.error('[Highlands Zoning] Error:', error.message);
        // Best-effort: return NO_DATA with manual link instead of crashing
        return {
            found: false,
            error: error.message,
            status: '⚠️ ERRO NA CONSULTA',
            source: 'Highlands County Planning & Zoning',
            note: 'Servidor do condado indisponível. Consulte manualmente.',
            manualLink: REGISTRY.counties?.Highlands?.zoning?.manual_link || 'https://www.highlandsfl.gov/departments/building-zoning'
        };
    }
}

// ============================================================================
// ZONING ROUTER - Routes to correct county provider
// ============================================================================

function getZoningForCounty(county, lat, lng) {
    const countyLower = (county || '').toLowerCase();
    
    if (countyLower === 'putnam') return getPutnamZoning(lat, lng);
    if (countyLower === 'highlands') return getHighlandsZoning(lat, lng);
    
    // Unknown county - return NO_DATA
    return Promise.resolve({
        found: false,
        status: '⚠️ CONDADO NÃO SUPORTADO',
        source: `${county} County (não configurado)`,
        note: 'Zoning não disponível para este condado. Consulte o Planning Department local.'
    });
}

// ============================================================================
// MAIN PROPERTY DETAILS FUNCTION
// ============================================================================

/**
 * Get complete property details for a given location
 * Runs all queries in parallel. Never fails the whole pipeline if one service fails.
 */
export async function getPropertyDetails({ lat, lng, county, parcelId = null, parcelGeometry = null }) {
    console.log(`[Analysis] Starting: ${county} County, FL (${lat}, ${lng}) parcel=${parcelId || 'N/A'}`);
    
    try {
        // Run ALL queries in parallel - each one handles its own errors
        const [fema, wetlands, landUse, zoning] = await Promise.all([
            getFEMAFloodZone(lat, lng).catch(err => ({ found: false, error: err.message, status: '⚠️ ERRO NA CONSULTA', source: 'FEMA NFHL' })),
            getWetlandsProgressive(lat, lng).catch(err => ({ found: false, error: err.message, status: '⚠️ ERRO NA CONSULTA', source: 'NWI' })),
            getStateLandUse(lat, lng, parcelId).catch(err => ({ found: false, error: err.message, status: '⚠️ ERRO NA CONSULTA', source: 'FDOR' })),
            getZoningForCounty(county, lat, lng).catch(err => ({ found: false, error: err.message, status: '⚠️ ERRO NA CONSULTA', source: 'Zoning' }))
        ]);
        
        // Determine overall status
        let overallStatus = '✅ APROVADO';
        
        if (fema.status === '🔴 REJEITAR' || fema.status === '🔴 ALTO RISCO') {
            overallStatus = '🔴 REJEITAR';
        } else if (wetlands.error) {
            overallStatus = '⚠️ INCOMPLETO (Wetlands não verificado)';
        } else if (wetlands.found) {
            overallStatus = '⚠️ AVALIAR';
        }
        
        return {
            success: true,
            county,
            coordinates: { lat, lng },
            fema,
            wetlands,
            landUse,
            zoning,
            overallStatus,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('[Analysis] Critical error:', error);
        return {
            success: false,
            error: error.message,
            county,
            coordinates: { lat, lng }
        };
    }
}
