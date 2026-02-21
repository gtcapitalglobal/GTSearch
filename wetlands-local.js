/**
 * Wetlands Detection Module - Official NWI MapServer (FWS/USGS)
 * 
 * Uses the OFFICIAL U.S. Fish & Wildlife Service NWI MapServer
 * No GDAL, no pyproj, no local geodatabase needed - just internet access
 * 
 * API: https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0
 * Source: National Wetlands Inventory (NWI) - U.S. Fish & Wildlife Service
 * Cost: FREE (official government MapServer)
 * Coverage: All 50 US states
 * Max Records: 1500 per query
 * 
 * Fields returned (via JOIN with NWI_Wetland_Codes table):
 *   Wetlands.ATTRIBUTE - NWI code (e.g., PSS1C, PFO1Fd)
 *   Wetlands.WETLAND_TYPE - Type description (e.g., Freshwater Forested/Shrub Wetland)
 *   Wetlands.ACRES - Official acreage (accurate, not derived from Shape__Area)
 *   NWI_Wetland_Codes.SYSTEM_NAME, CLASS_NAME, SUBCLASS_NAME, WATER_REGIME_NAME, MODIFIER1_NAME, etc.
 */

const NWI_API_URL = 'https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0/query';

/**
 * Risk classification based on NWI wetland codes
 */
function classifyRisk(code, wetlandType) {
    const nwi = (code || '').toUpperCase();
    
    // Palustrine (freshwater) wetlands - most common on land
    // Use full code for more accurate classification
    if (nwi.startsWith('PFO')) {
        // Forested wetland - check water regime for severity
        // Codes ending in C (Seasonally Flooded) or H (Permanently Flooded) are higher risk
        const regime = nwi.length >= 5 ? nwi.charAt(4) : '';
        if ('HFG'.includes(regime)) return { risk: 'high', level: 'ALTO RISCO', color: '🔴', buildability: 'Muito restrita - permanentemente inundada, requer permit USACE + mitigação ($50k-$100k+)' };
        return { risk: 'high', level: 'ALTO RISCO', color: '🔴', buildability: 'Muito restrita - requer permit USACE + mitigação ($20k-$100k+)' };
    }
    if (nwi.startsWith('PSS')) return { risk: 'medium-high', level: 'RISCO MÉDIO-ALTO', color: '🟠', buildability: 'Restrita - provável necessidade de permit USACE + mitigação' };
    if (nwi.startsWith('PEM')) return { risk: 'medium', level: 'RISCO MÉDIO', color: '🟡', buildability: 'Moderada - pode requerer permit dependendo da extensão' };
    if (nwi.startsWith('PAB') || nwi.startsWith('PUB')) return { risk: 'medium', level: 'RISCO MÉDIO', color: '🟡', buildability: 'Moderada - área aquática, requer avaliação' };
    // Other Palustrine (PUS, etc.)
    if (nwi.startsWith('P')) return { risk: 'medium', level: 'RISCO MÉDIO', color: '🟡', buildability: 'Requer avaliação - wetland palustrine' };
    
    // Lacustrine (lake) and Riverine (river) - typically not buildable
    if (nwi.startsWith('L')) return { risk: 'high', level: 'ALTO RISCO', color: '🔴', buildability: 'Corpo d\'\u00e1gua - n\u00e3o constru\u00edvel' };
    if (nwi.startsWith('R')) return { risk: 'high', level: 'ALTO RISCO', color: '🔴', buildability: 'Curso d\'\u00e1gua - n\u00e3o constru\u00edvel' };
    
    // Estuarine and Marine
    if (nwi.startsWith('E')) return { risk: 'high', level: 'ALTO RISCO', color: '🔴', buildability: 'Estuário - altamente restrita' };
    if (nwi.startsWith('M')) return { risk: 'high', level: 'ALTO RISCO', color: '🔴', buildability: 'Marinho - não construível' };
    
    // Default
    return { risk: 'medium', level: 'RISCO MÉDIO', color: '🟡', buildability: 'Requer avaliação específica' };
}

/**
 * Build decoded description from API attributes
 * The official MapServer returns fields with table prefix (e.g., "NWI_Wetland_Codes.SYSTEM_NAME")
 */
function buildDecodedDescription(attrs) {
    const parts = [];
    
    // Try both prefixed and non-prefixed field names
    const get = (field) => attrs[`NWI_Wetland_Codes.${field}`] || attrs[field] || '';
    
    const systemName = get('SYSTEM_NAME');
    const system = get('SYSTEM');
    if (systemName) parts.push(`${systemName}${system ? ` (${system})` : ''}`);
    if (get('CLASS_NAME')) parts.push(get('CLASS_NAME'));
    if (get('SUBCLASS_NAME')) parts.push(get('SUBCLASS_NAME'));
    if (get('WATER_REGIME_NAME')) parts.push(get('WATER_REGIME_NAME'));
    if (get('MODIFIER1_NAME')) parts.push(get('MODIFIER1_NAME'));
    if (get('MODIFIER2_NAME')) parts.push(get('MODIFIER2_NAME'));
    
    return parts.join(' | ');
}

/**
 * Query NWI Official MapServer for wetlands at a specific location with buffer
 * 
 * @param {number} lat - Latitude (WGS84)
 * @param {number} lng - Longitude (WGS84)
 * @param {number} bufferMeters - Search radius in meters
 * @returns {Object} Wetlands data
 */
async function getWetlandsFromAPI(lat, lng, bufferMeters = 20) {
    try {
        const params = new URLSearchParams({
            where: '1=1',
            geometry: JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 } }),
            geometryType: 'esriGeometryPoint',
            spatialRel: 'esriSpatialRelIntersects',
            distance: bufferMeters.toString(),
            units: 'esriSRUnit_Meter',
            outFields: [
                'Wetlands.ATTRIBUTE',
                'Wetlands.WETLAND_TYPE',
                'Wetlands.ACRES',
                'NWI_Wetland_Codes.SYSTEM',
                'NWI_Wetland_Codes.SYSTEM_NAME',
                'NWI_Wetland_Codes.CLASS_NAME',
                'NWI_Wetland_Codes.SUBCLASS_NAME',
                'NWI_Wetland_Codes.WATER_REGIME_NAME',
                'NWI_Wetland_Codes.MODIFIER1_NAME',
                'NWI_Wetland_Codes.MODIFIER2_NAME'
            ].join(','),
            returnGeometry: 'false',
            f: 'json'
        });
        
        const url = `${NWI_API_URL}?${params.toString()}`;
        console.log(`Querying NWI Official MapServer with buffer ${bufferMeters}m...`);
        
        // Retry logic: 1 retry with 2s delay
        let response;
        for (let attempt = 0; attempt <= 1; attempt++) {
            try {
                response = await fetch(url, {
                    headers: { 'User-Agent': 'GTSearch/2.0' },
                    signal: AbortSignal.timeout(30000) // 30s timeout
                });
                if (response.ok) break;
                if (attempt === 0) {
                    console.warn(`NWI API attempt 1 failed (HTTP ${response.status}), retrying in 2s...`);
                    await new Promise(r => setTimeout(r, 2000));
                }
            } catch (fetchErr) {
                if (attempt === 0) {
                    console.warn(`NWI API attempt 1 failed (${fetchErr.message}), retrying in 2s...`);
                    await new Promise(r => setTimeout(r, 2000));
                } else {
                    throw fetchErr;
                }
            }
        }
        
        if (!response || !response.ok) {
            throw new Error(`NWI API HTTP error: ${response?.status || 'no response'}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`NWI API error: ${data.error.message || JSON.stringify(data.error)}`);
        }
        
        const features = data.features || [];
        
        if (features.length === 0) {
            return {
                found: false,
                method: 'nwi_official_mapserver',
                status: '✅ SEM WETLANDS',
                statusDetail: `Nenhum wetland encontrado num raio de ${bufferMeters}m`,
                source: 'NWI Official MapServer (FWS/USGS)',
                wetlands: [],
                totalAcres: 0,
                bufferMeters
            };
        }
        
        // Process wetlands found
        const wetlands = features.map(f => {
            const attrs = f.attributes;
            // Handle both prefixed and non-prefixed field names
            const code = attrs['Wetlands.ATTRIBUTE'] || attrs.ATTRIBUTE || '';
            const wetlandType = attrs['Wetlands.WETLAND_TYPE'] || attrs.WETLAND_TYPE || '';
            const acres = attrs['Wetlands.ACRES'] || attrs.ACRES || 0;
            const riskInfo = classifyRisk(code, wetlandType);
            const decoded = buildDecodedDescription(attrs);
            
            // Extract decoded fields
            const get = (field) => attrs[`NWI_Wetland_Codes.${field}`] || attrs[field] || '';
            
            return {
                code,
                type: wetlandType,
                acres: Number(Number(acres).toFixed(2)),
                decoded,
                risk: riskInfo.risk,
                riskLevel: riskInfo.level,
                riskColor: riskInfo.color,
                buildability: riskInfo.buildability,
                // Extra details from API
                system: get('SYSTEM_NAME'),
                class: get('CLASS_NAME'),
                subclass: get('SUBCLASS_NAME'),
                waterRegime: get('WATER_REGIME_NAME'),
                modifier1: get('MODIFIER1_NAME'),
                modifier2: get('MODIFIER2_NAME')
            };
        });
        
        // Sort by risk (highest first) then by acres (largest first)
        const riskOrder = { 'high': 0, 'medium-high': 1, 'medium': 2, 'low': 3 };
        wetlands.sort((a, b) => {
            const riskDiff = (riskOrder[a.risk] || 99) - (riskOrder[b.risk] || 99);
            if (riskDiff !== 0) return riskDiff;
            return b.acres - a.acres;
        });
        
        const totalAcres = wetlands.reduce((sum, w) => sum + w.acres, 0);
        const highestRisk = wetlands[0];
        
        // Build status
        let status = '';
        if (highestRisk.risk === 'high') {
            status = `🔴 WETLAND DETECTADO - ${highestRisk.riskLevel}`;
        } else if (highestRisk.risk === 'medium-high') {
            status = `🟠 WETLAND DETECTADO - ${highestRisk.riskLevel}`;
        } else {
            status = `🟡 WETLAND DETECTADO - ${highestRisk.riskLevel}`;
        }
        
        const typeSummary = wetlands.map(w => `${w.type} (${w.code})`).join(', ');
        
        return {
            found: true,
            method: 'nwi_official_mapserver',
            status,
            statusDetail: `${wetlands.length} wetland(s) encontrado(s) - ${typeSummary}`,
            wetlands,
            totalAcres: totalAcres.toFixed(2),
            highestRisk: {
                code: highestRisk.code,
                type: highestRisk.type,
                risk: highestRisk.risk,
                riskLevel: highestRisk.riskLevel,
                riskColor: highestRisk.riskColor,
                buildability: highestRisk.buildability
            },
            count: wetlands.length,
            bufferMeters,
            source: 'NWI Official MapServer (FWS/USGS)',
            disclaimers: [
                'NWI é screening biológico, NÃO define limites regulatórios legais',
                'Para compliance, consultar US Army Corps of Engineers (USACE)',
                'Dados podem não refletir alterações recentes no terreno'
            ]
        };
        
    } catch (error) {
        console.error(`NWI API error (buffer ${bufferMeters}m):`, error.message);
        return {
            found: false,
            method: 'nwi_official_mapserver',
            error: error.message,
            status: '❌ ERRO NA CONSULTA DE WETLANDS',
            statusDetail: `Erro ao consultar NWI API: ${error.message}`,
            source: 'NWI Official MapServer (FWS/USGS)',
            wetlands: [],
            totalAcres: 0,
            bufferMeters
        };
    }
}

/**
 * Progressive wetlands search - checks 20m, 50m, then 100m
 * Returns as soon as wetlands are found at any level
 * 
 * Buffer distances optimized for typical land lots (~0.23 acres / ~930m²):
 *   20m = within the lot boundary (ON PROPERTY)
 *   50m = immediate neighbors (~1.5x lot size)
 *   100m = 2-3 lots away (area screening)
 * 
 * @param {number} lat - Latitude (WGS84)
 * @param {number} lng - Longitude (WGS84)
 * @returns {Object} Wetlands analysis with proximity info
 */
export async function getWetlandsProgressive(lat, lng) {
    // Level 1: Directly on property (20m buffer)
    const onProperty = await getWetlandsFromAPI(lat, lng, 20);
    
    // If API error, propagate immediately
    if (onProperty.error) {
        console.error('❌ Erro na consulta de wetlands:', onProperty.error);
        return {
            found: false,
            method: 'nwi_official_mapserver',
            error: onProperty.error,
            proximity: 'UNKNOWN',
            proximityLabel: '❌ ERRO NA CONSULTA',
            status: '❌ ERRO NA CONSULTA DE WETLANDS',
            statusDetail: `Erro: ${onProperty.error}. Verifique sua conexão com a internet.`,
            source: 'NWI Official MapServer (FWS/USGS)',
            wetlands: [],
            totalAcres: 0,
            disclaimers: [
                'A API NWI pode estar temporariamente indisponível',
                'Tente novamente em alguns minutos'
            ]
        };
    }
    
    if (onProperty.found) {
        onProperty.proximity = 'ON_PROPERTY';
        onProperty.proximityLabel = '🔴 NO TERRENO';
        return onProperty;
    }
    
    // Level 2: Very close (50m buffer)
    const nearby = await getWetlandsFromAPI(lat, lng, 50);
    if (nearby.found) {
        nearby.proximity = 'NEARBY';
        nearby.proximityLabel = '🟡 PRÓXIMO (até 50m)';
        return nearby;
    }
    
    // Level 3: In the area (100m buffer)
    const area = await getWetlandsFromAPI(lat, lng, 100);
    if (area.found) {
        area.proximity = 'IN_AREA';
        area.proximityLabel = '🟠 NA ÁREA (até 100m)';
        return area;
    }
    
    // No wetlands found within 100m
    return {
        found: false,
        method: 'nwi_official_mapserver',
        proximity: 'NONE',
        proximityLabel: '✅ SEM WETLANDS (100m)',
        status: '✅ SEM WETLANDS',
        statusDetail: 'Nenhum wetland encontrado num raio de 100m',
        source: 'NWI Official MapServer (FWS/USGS)',
        wetlands: [],
        totalAcres: 0,
        disclaimers: [
            'NWI é screening biológico, NÃO define limites regulatórios legais',
            'Para compliance, consultar US Army Corps of Engineers (USACE)'
        ]
    };
}
