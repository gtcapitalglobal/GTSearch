/**
 * API Integrations Module
 * Integrates with FEMA, Wetlands (NWI), Land Use (FDOR Statewide), and County Zoning
 * for property analysis in Florida
 * 
 * LAND USE: Florida Statewide Cadastral (FDOR) - covers all 67 counties
 * ZONING: Per-county registry (dynamic - supports any county in zoning_registry.json)
 * WETLANDS: NWI Official MapServer (FWS/USGS)
 * FEMA: NFHL MapServer (official)
 */

import axios from 'axios';
import https from 'https';
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
const CACHE_MAX_ENTRIES = 1000;

function getCached(key) {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
    cache.delete(key);
    return null;
}

function setCache(key, data) {
    cache.set(key, { data, ts: Date.now() });
    // Evict oldest entries if cache exceeds max size
    if (cache.size > CACHE_MAX_ENTRIES) {
        const oldest = cache.keys().next().value;
        cache.delete(oldest);
    }
}

// Periodic cache cleanup (every 10 minutes, remove expired entries)
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of cache) {
        if (now - entry.ts >= CACHE_TTL) {
            cache.delete(key);
            cleaned++;
        }
    }
    if (cleaned > 0) console.log(`[Cache] Cleaned ${cleaned} expired entries. Remaining: ${cache.size}`);
}, 10 * 60 * 1000);

// Pre-create HTTPS agent for self-signed cert servers (reuse across requests)
const SELF_SIGNED_HOSTS = [
    'gis.highlandsfl.gov', 'mgrcmaps.org', 'gis.marionfl.org',
    'gis.sumtercountyfl.gov', 'pascogis.pascocountyfl.net',
    'mapping.pascopa.com', 'gis.polk-county.net', 'maps5.vcgov.org'
];
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

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
                // Allow self-signed certs for known self-hosted county servers
                httpsAgent: SELF_SIGNED_HOSTS.some(host => url.includes(host))
                    ? insecureAgent
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
                lastSaleDate: attrs.SALE_YR1 ? (attrs.SALE_MO1 && attrs.SALE_MO1 > 0 ? `${String(attrs.SALE_MO1).padStart(2, '0')}/${attrs.SALE_YR1}` : `${attrs.SALE_YR1}`) : null,
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
    const cacheKey = `zoning_putnam_${Number(lat).toFixed(6)}_${Number(lng).toFixed(6)}`;
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
// Highlands County Future Land Use (FLUM) Code Lookup
const HIGHLANDS_FLUM_CODES = {
    'RES-LOW': 'Residential (Low Density)',
    'RES-MED': 'Residential (Medium Density)',
    'RES-HIGH': 'Residential (High Density)',
    'COM': 'Commercial',
    'IND': 'Industrial',
    'AG': 'Agriculture',
    'CON': 'Conservation',
    'PUB': 'Public/Institutional',
    'REC': 'Recreation',
    'MXD': 'Mixed Use',
    'RUR': 'Rural',
    'RL': 'Residential Low',
    'RM': 'Residential Medium',
    'RH': 'Residential High',
    'C': 'Commercial',
    'I': 'Industrial',
    'A': 'Agriculture',
    'P': 'Public Facilities',
    'R': 'Recreation',
    'M': 'Mixed Use'
};

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
    const cacheKey = `zoning_highlands_${Number(lat).toFixed(6)}_${Number(lng).toFixed(6)}`;
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
            const zoningCode = attrs.ZON || null;
            const flum = attrs.FLUM || null;
            
            const result = {
                found: true,
                code: zoningCode,
                description: HIGHLANDS_ZONING_CODES[zoningCode] || zoningCode || 'N/A',
                futureLandUse: flum,
                futureLandUseDesc: HIGHLANDS_FLUM_CODES[flum] || flum || 'N/A',
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
// ZONING ROUTER - Dynamic registry-based routing for any Florida county
// ============================================================================

async function getZoningForCounty(county, lat, lng) {
    const countyLower = (county || '').toLowerCase();
    
    // Legacy direct routes for Putnam and Highlands (optimized, keep for backward compat)
    if (countyLower === 'putnam') return getPutnamZoning(lat, lng);
    if (countyLower === 'highlands') return getHighlandsZoning(lat, lng);
    
    // Dynamic registry lookup for all other counties
    const countyConfig = REGISTRY.counties?.[county];
    if (countyConfig?.zoning) {
        const zoningConfig = countyConfig.zoning;
        const manualLink = zoningConfig.manual_link || null;
        
        // Counties flagged as "no zoning" go straight to statewide FLU fallback
        if (zoningConfig.has_zoning === false && zoningConfig.use_statewide_flu) {
            console.log(`[Zoning] ${county} flagged as no zoning service. Going to statewide FLU fallback...`);
            // Fall through to statewide FLU below
        } else if (zoningConfig.has_zoning === false && zoningConfig.layers?.county_flu) {
            // County has FLU but no zoning (e.g., Polk) — query FLU from registry
            const fluResult = await queryFLUService(county, zoningConfig, lat, lng);
            if (fluResult) {
                return {
                    found: true,
                    code: null,
                    description: '⚠️ Zoning não disponível via API',
                    futureLandUse: fluResult.code,
                    futureLandUseDesc: fluResult.description,
                    jurisdiction: `${county} County`,
                    status: '⚠️ PARCIAL (apenas FLU)',
                    source: `${county} County Planning (FLU only)`,
                    note: manualLink 
                        ? `Zoning não disponível via API. FLU disponível. Consulte: ${manualLink}`
                        : 'Zoning não disponível via API. Apenas FLU disponível.',
                    manualLink
                };
            }
        } else {
            // Normal county with zoning service
            const zoningResult = await getGenericRegistryZoning(county, zoningConfig, lat, lng);
            
            // If zoning config has a separate FLU service and we didn't get FLU from the main query
            if (!zoningResult.futureLandUse && zoningConfig.flu) {
                const fluResult = await queryFLUService(county, zoningConfig.flu, lat, lng);
                if (fluResult) {
                    zoningResult.futureLandUse = fluResult.code;
                    zoningResult.futureLandUseDesc = fluResult.description;
                }
            }
            return zoningResult;
        }
    }
    
    // County in registry but no zoning data — try statewide FLU as fallback
    const manualLink = countyConfig?.zoning?.manual_link || countyConfig?.manual_link || null;
    
    // === STATEWIDE FLU FALLBACK ===
    // Uses FGDL FLU_L2_2020_JDX dataset (free, covers all 67 FL counties)
    console.log(`[Zoning] No county-specific data for ${county}. Trying statewide FLU fallback...`);
    try {
        const statewideFLU = await getStatewideFLU(lat, lng);
        
        if (statewideFLU.found) {
            console.log(`[Zoning] Statewide FLU fallback SUCCESS for ${county}: ${statewideFLU.fluL2 || statewideFLU.fluL1} - ${statewideFLU.description}`);
            return {
                found: true,
                code: null,
                description: '⚠️ Zoning não disponível via API',
                futureLandUse: statewideFLU.fluL2 || statewideFLU.fluL1,
                futureLandUseDesc: statewideFLU.description || statewideFLU.fluL2Desc || statewideFLU.fluL1Desc,
                futureLandUseLevel1: statewideFLU.fluL1,
                futureLandUseLevel1Desc: statewideFLU.fluL1Desc,
                jurisdiction: statewideFLU.jurisdiction || `${county} County`,
                status: '⚠️ PARCIAL (FLU estadual)',
                source: `Statewide FLU (FGDL 2020) — ${county} County`,
                note: manualLink 
                    ? `Zoning local não disponível. FLU obtido via dataset estadual (FGDL 2020). Para zoning detalhado, consulte: ${manualLink}`
                    : 'Zoning local não disponível. FLU obtido via dataset estadual (FGDL 2020). Consulte o Planning Department para zoning detalhado.',
                manualLink,
                isStatewideFallback: true
            };
        }
    } catch (err) {
        console.warn(`[Statewide FLU] Fallback failed for ${county}:`, err.message);
    }
    
    // Truly no data available
    return {
        found: false,
        status: '⚠️ ZONING NÃO DISPONÍVEL',
        source: `${county} County`,
        note: manualLink 
            ? `Dados de zoning não disponíveis via API. Consulte: ${manualLink}`
            : 'Dados de zoning não disponíveis via API. Consulte o Planning Department local.',
        manualLink
    };
}

// ============================================================================
// FLU SERVICE QUERY - Queries a separate FLU service from registry config
// ============================================================================

async function queryFLUService(county, fluConfig, lat, lng) {
    try {
        const baseUrl = fluConfig.base_url;
        if (!baseUrl || !fluConfig.layers) return null;
        
        const pointParams = {
            geometry: `${lng},${lat}`,
            geometryType: 'esriGeometryPoint',
            inSR: 4326,
            spatialRel: 'esriSpatialRelIntersects',
            outFields: '*',
            returnGeometry: false,
            f: 'json'
        };
        
        const layerEntries = Object.entries(fluConfig.layers);
        const queries = layerEntries.map(([key, layer]) => {
            const url = `${baseUrl}/${layer.id}/query`;
            return safeArcGISQuery(url, pointParams, { 
                label: `${county} FLU ${layer.name || key}`, 
                timeout: 10000, 
                retries: 2 
            }).catch(err => ({ error: err.message }));
        });
        
        const results = await Promise.allSettled(queries);
        
        for (let i = 0; i < results.length; i++) {
            const [key, layerConfig] = layerEntries[i];
            const res = results[i];
            if (res.status !== 'fulfilled' || !res.value?.features?.length) continue;
            
            const attrs = res.value.features[0].attributes;
            const fields = layerConfig.fields;
            const code = attrs[fields.land_use] || null;
            const desc = fields.description ? (attrs[fields.description] || code) : code;
            
            if (code && code.trim() && code.trim().toUpperCase() !== 'CITY') {
                return { code, description: desc };
            }
        }
        
        return null;
    } catch (error) {
        console.error(`[${county} FLU] Error:`, error.message);
        return null;
    }
}

// ============================================================================
// GENERIC REGISTRY ZONING - Queries any county based on registry config
// ============================================================================

async function getGenericRegistryZoning(county, config, lat, lng) {
    const cacheKey = `zoning_${county.toLowerCase().replace(/\s+/g, '_')}_${Number(lat).toFixed(6)}_${Number(lng).toFixed(6)}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;
    
    try {
        const baseUrl = config.base_url || config.url;
        const timeout = config.timeout_ms || 10000;
        const retries = config.retries || 1;
        
        const pointParams = {
            geometry: `${lng},${lat}`,
            geometryType: 'esriGeometryPoint',
            inSR: 4326,
            spatialRel: 'esriSpatialRelIntersects',
            outFields: '*',
            returnGeometry: false,
            f: 'json'
        };
        
        // If config has layers, query them in parallel
        if (config.layers) {
            const layerEntries = Object.entries(config.layers);
            const queries = layerEntries.map(([key, layer]) => {
                const url = `${baseUrl}/${layer.id}/query`;
                return safeArcGISQuery(url, pointParams, { 
                    label: `${county} ${layer.name || key}`, 
                    timeout, 
                    retries 
                }).catch(err => ({ error: err.message }));
            });
            
            const results = await Promise.allSettled(queries);
            
            // Find first zoning result and first FLU result
            let zoningCode = null, zoningDesc = null, fluCode = null, fluDesc = null;
            let isMunicipal = false;
            
            for (let i = 0; i < results.length; i++) {
                const [key, layerConfig] = layerEntries[i];
                const res = results[i];
                if (res.status !== 'fulfilled' || !res.value?.features?.length) continue;
                
                const attrs = res.value.features[0].attributes;
                const fields = layerConfig.fields;
                
                // Check if this is a zoning layer
                if (fields.zoning_code && !zoningCode) {
                    zoningCode = attrs[fields.zoning_code] || null;
                    zoningDesc = fields.description ? (attrs[fields.description] || zoningCode) : zoningCode;
                    if (key.includes('municipal') || key.includes('muni')) isMunicipal = true;
                }
                
                // Check if this is a FLU layer
                if (fields.land_use && !fluCode) {
                    fluCode = attrs[fields.land_use] || null;
                    fluDesc = fields.description ? (attrs[fields.description] || fluCode) : fluCode;
                }
            }
            
            if (zoningCode || fluCode) {
                const result = {
                    found: true,
                    code: zoningCode,
                    description: zoningDesc || 'N/A',
                    futureLandUse: fluCode,
                    futureLandUseDesc: fluDesc || 'N/A',
                    jurisdiction: isMunicipal ? `Municipal (${county} County)` : `Unincorporated ${county} County`,
                    isMunicipal,
                    status: '✅ DISPONÍVEL',
                    source: `${county} County Planning & Zoning (ArcGIS)`,
                    note: 'Consultar Planning Department para decisões finais',
                    manualLink: config.manual_link || null
                };
                setCache(cacheKey, result);
                return result;
            }
        } else {
            // Single URL query (like Highlands self-hosted)
            const url = config.url || `${baseUrl}/0/query`;
            const data = await safeArcGISQuery(url, pointParams, { label: `${county} Zoning`, timeout, retries });
            
            if (data.features?.length > 0) {
                const attrs = data.features[0].attributes;
                const fields = config.fields || {};
                const zoningCode = attrs[fields.zoning_code] || null;
                const fluCode = attrs[fields.future_land_use] || null;
                
                const result = {
                    found: true,
                    code: zoningCode,
                    description: zoningCode || 'N/A',
                    futureLandUse: fluCode,
                    futureLandUseDesc: fluCode || 'N/A',
                    jurisdiction: `${county} County`,
                    status: '✅ DISPONÍVEL',
                    source: `${county} County Planning & Zoning`,
                    note: 'Consultar Planning Department para decisões finais',
                    manualLink: config.manual_link || null
                };
                setCache(cacheKey, result);
                return result;
            }
        }
        
        return {
            found: false,
            jurisdiction: `${county} County`,
            status: '⚠️ DADOS NÃO DISPONÍVEIS',
            source: `${county} County Planning & Zoning`,
            note: 'Ponto não retornou dados. Pode estar fora da área de cobertura.',
            manualLink: config.manual_link || null
        };
        
    } catch (error) {
        console.error(`[${county} Zoning] Error:`, error.message);
        return {
            found: false,
            error: error.message,
            status: '⚠️ ERRO NA CONSULTA',
            source: `${county} County Planning & Zoning`,
            manualLink: config?.manual_link || null
        };
    }
}

// ============================================================================
// STATEWIDE FLU FALLBACK (FGDL FLU_L2_2020_JDX - covers all 67 FL counties)
// ============================================================================

/**
 * Query the statewide Future Land Use dataset from FGDL (Florida Geographic Data Library)
 * This is a FREE, public FeatureServer covering ALL 67 Florida counties.
 * Used as a universal fallback when county-specific zoning/FLU is not available.
 * Data source: GeoPlan Level 2 Future Land Use 2020
 * Fields: FLU_L1 (code), FLU_L1_DESC (description), FLU_L2_1 (detailed code), FLU_L2_DESC (detailed desc)
 */
async function getStatewideFLU(lat, lng) {
    try {
        const url = 'https://services.arcgis.com/LBbVDC0hKPAnLRpO/arcgis/rest/services/FLU_L2_2020_JDX/FeatureServer/0/query';
        
        const params = {
            geometry: JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 } }),
            geometryType: 'esriGeometryPoint',
            inSR: 4326,
            spatialRel: 'esriSpatialRelIntersects',
            outFields: 'COUNTY,FLU_L1,FLU_L1_DESC,FLU_L2_1,FLU_L2_DESC,JURISDICT_1,DESCRIPT',
            returnGeometry: false,
            f: 'json'
        };
        
        const data = await safeArcGISQuery(url, params, { 
            label: 'Statewide FLU', 
            timeout: 15000, 
            retries: 1 
        });
        
        if (data.features && data.features.length > 0) {
            const attrs = data.features[0].attributes;
            return {
                found: true,
                fluL1: attrs.FLU_L1 || null,
                fluL1Desc: attrs.FLU_L1_DESC || null,
                fluL2: attrs.FLU_L2_1 || null,
                fluL2Desc: attrs.FLU_L2_DESC || null,
                county: attrs.COUNTY || null,
                jurisdiction: attrs.JURISDICT_1 || null,
                description: attrs.DESCRIPT || attrs.FLU_L2_DESC || attrs.FLU_L1_DESC || null
            };
        }
        
        return { found: false };
        
    } catch (error) {
        console.error('[Statewide FLU] Error:', error.message);
        return { found: false, error: error.message };
    }
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
        } else if (wetlands.found && wetlands.highestRisk?.risk === 'high' && wetlands.proximity === 'ON_PROPERTY') {
            overallStatus = '🔴 ALTO RISCO (Wetland no terreno)';
        } else if (wetlands.found && wetlands.highestRisk?.risk === 'high') {
            overallStatus = '⚠️ AVALIAR (Wetland alto risco próximo)';
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
