/**
 * Wetlands Detection Module - NWI API (ArcGIS Online)
 * 
 * Uses the FREE U.S. Fish & Wildlife Service NWI dataset hosted on ArcGIS Online
 * No GDAL, no pyproj, no local geodatabase needed - just internet access
 * 
 * API: https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Wetlands/FeatureServer/0
 * Source: National Wetlands Inventory (NWI) - U.S. Fish & Wildlife Service
 * Cost: FREE (public ArcGIS Online feature service)
 * Coverage: All 50 US states
 */

const NWI_API_URL = 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Wetlands/FeatureServer/0/query';

/**
 * Risk classification based on NWI wetland codes
 */
function classifyRisk(code, wetlandType) {
    const prefix = (code || '').substring(0, 3).toUpperCase();
    
    // Palustrine (freshwater) wetlands - most common on land
    if (prefix.startsWith('PFO')) return { risk: 'high', level: 'ALTO RISCO', color: '🔴', buildability: 'Muito restrita - requer permit USACE + mitigação ($20k-$100k+)' };
    if (prefix.startsWith('PSS')) return { risk: 'medium-high', level: 'RISCO MÉDIO-ALTO', color: '🟠', buildability: 'Restrita - provável necessidade de permit USACE + mitigação' };
    if (prefix.startsWith('PEM')) return { risk: 'medium', level: 'RISCO MÉDIO', color: '🟡', buildability: 'Moderada - pode requerer permit dependendo da extensão' };
    if (prefix.startsWith('PAB') || prefix.startsWith('PUB')) return { risk: 'medium', level: 'RISCO MÉDIO', color: '🟡', buildability: 'Moderada - área aquática, requer avaliação' };
    
    // Lacustrine (lake) and Riverine (river) - typically not buildable
    if (code.startsWith('L')) return { risk: 'high', level: 'ALTO RISCO', color: '🔴', buildability: 'Corpo d\'água - não construível' };
    if (code.startsWith('R')) return { risk: 'high', level: 'ALTO RISCO', color: '🔴', buildability: 'Curso d\'água - não construível' };
    
    // Estuarine and Marine
    if (code.startsWith('E')) return { risk: 'high', level: 'ALTO RISCO', color: '🔴', buildability: 'Estuário - altamente restrita' };
    if (code.startsWith('M')) return { risk: 'high', level: 'ALTO RISCO', color: '🔴', buildability: 'Marinho - não construível' };
    
    // Default
    return { risk: 'medium', level: 'RISCO MÉDIO', color: '🟡', buildability: 'Requer avaliação específica' };
}

/**
 * Build decoded description from API attributes
 */
function buildDecodedDescription(attrs) {
    const parts = [];
    
    if (attrs.SYSTEM_NAME) parts.push(`${attrs.SYSTEM_NAME} (${attrs.SYSTEM || ''})`);
    if (attrs.CLASS_NAME) parts.push(attrs.CLASS_NAME);
    if (attrs.SUBCLASS_NAME) parts.push(attrs.SUBCLASS_NAME);
    if (attrs.WATER_REGIME_NAME) parts.push(attrs.WATER_REGIME_NAME);
    if (attrs.MODIFIER1_NAME) parts.push(attrs.MODIFIER1_NAME);
    if (attrs.MODIFIER2_NAME) parts.push(attrs.MODIFIER2_NAME);
    
    return parts.join(' | ');
}

/**
 * Query NWI API for wetlands at a specific location with buffer
 * 
 * @param {number} lat - Latitude (WGS84)
 * @param {number} lng - Longitude (WGS84)
 * @param {number} bufferMeters - Search radius in meters
 * @returns {Object} Wetlands data
 */
async function getWetlandsFromAPI(lat, lng, bufferMeters = 50) {
    try {
        const params = new URLSearchParams({
            where: '1=1',
            geometry: `${lng},${lat}`,
            geometryType: 'esriGeometryPoint',
            inSR: '4326',
            spatialRel: 'esriSpatialRelIntersects',
            distance: bufferMeters.toString(),
            units: 'esriSRUnit_Meter',
            outFields: '*',
            returnGeometry: 'false',
            f: 'json'
        });
        
        const url = `${NWI_API_URL}?${params.toString()}`;
        console.log(`Querying NWI API with buffer ${bufferMeters}m...`);
        
        const response = await fetch(url, {
            headers: { 'User-Agent': 'GTSearch/2.0' },
            signal: AbortSignal.timeout(30000) // 30s timeout
        });
        
        if (!response.ok) {
            throw new Error(`NWI API HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`NWI API error: ${data.error.message || JSON.stringify(data.error)}`);
        }
        
        const features = data.features || [];
        
        if (features.length === 0) {
            return {
                found: false,
                method: 'nwi_api',
                status: '✅ SEM WETLANDS',
                statusDetail: `Nenhum wetland encontrado num raio de ${bufferMeters}m`,
                source: 'NWI / U.S. Fish & Wildlife Service (ArcGIS Online)',
                wetlands: [],
                totalAcres: 0,
                bufferMeters
            };
        }
        
        // Process wetlands found
        const wetlands = features.map(f => {
            const attrs = f.attributes;
            const code = attrs.ATTRIBUTE || '';
            const wetlandType = attrs.WETLAND_TYPE || '';
            const areaM2 = attrs.Shape__Area || 0;
            const acres = areaM2 / 4046.86; // Convert m² to acres
            const riskInfo = classifyRisk(code, wetlandType);
            const decoded = buildDecodedDescription(attrs);
            
            return {
                code,
                type: wetlandType,
                acres: parseFloat(acres.toFixed(2)),
                decoded,
                risk: riskInfo.risk,
                riskLevel: riskInfo.level,
                riskColor: riskInfo.color,
                buildability: riskInfo.buildability,
                // Extra details from API
                system: attrs.SYSTEM_NAME || '',
                class: attrs.CLASS_NAME || '',
                subclass: attrs.SUBCLASS_NAME || '',
                waterRegime: attrs.WATER_REGIME_NAME || '',
                modifier1: attrs.MODIFIER1_NAME || '',
                modifier2: attrs.MODIFIER2_NAME || ''
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
            method: 'nwi_api',
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
            source: 'NWI / U.S. Fish & Wildlife Service (ArcGIS Online)',
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
            method: 'nwi_api',
            error: error.message,
            status: '❌ ERRO NA CONSULTA DE WETLANDS',
            statusDetail: `Erro ao consultar NWI API: ${error.message}`,
            source: 'NWI / U.S. Fish & Wildlife Service (ArcGIS Online)',
            wetlands: [],
            totalAcres: 0,
            bufferMeters
        };
    }
}

/**
 * Progressive wetlands search - checks 50m, 200m, then 500m
 * Returns as soon as wetlands are found at any level
 * 
 * @param {number} lat - Latitude (WGS84)
 * @param {number} lng - Longitude (WGS84)
 * @returns {Object} Wetlands analysis with proximity info
 */
export async function getWetlandsProgressive(lat, lng) {
    // Level 1: Directly on property (50m buffer)
    const onProperty = await getWetlandsFromAPI(lat, lng, 50);
    
    // If API error, propagate immediately
    if (onProperty.error) {
        console.error('❌ Erro na consulta de wetlands:', onProperty.error);
        return {
            found: false,
            method: 'nwi_api',
            error: onProperty.error,
            proximity: 'UNKNOWN',
            proximityLabel: '❌ ERRO NA CONSULTA',
            status: '❌ ERRO NA CONSULTA DE WETLANDS',
            statusDetail: `Erro: ${onProperty.error}. Verifique sua conexão com a internet.`,
            source: 'NWI / U.S. Fish & Wildlife Service (ArcGIS Online)',
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
    
    // Level 2: Very close (200m buffer)
    const nearby = await getWetlandsFromAPI(lat, lng, 200);
    if (nearby.found) {
        nearby.proximity = 'NEARBY';
        nearby.proximityLabel = '🟡 PRÓXIMO (até 200m)';
        return nearby;
    }
    
    // Level 3: In the area (500m buffer)
    const area = await getWetlandsFromAPI(lat, lng, 500);
    if (area.found) {
        area.proximity = 'IN_AREA';
        area.proximityLabel = '🟢 NA ÁREA (até 500m)';
        return area;
    }
    
    // No wetlands found within 500m
    return {
        found: false,
        method: 'nwi_api',
        proximity: 'NONE',
        proximityLabel: '✅ SEM WETLANDS (500m)',
        status: '✅ SEM WETLANDS',
        statusDetail: 'Nenhum wetland encontrado num raio de 500m',
        source: 'NWI / U.S. Fish & Wildlife Service (ArcGIS Online)',
        wetlands: [],
        totalAcres: 0,
        disclaimers: [
            'NWI é screening biológico, NÃO define limites regulatórios legais',
            'Para compliance, consultar US Army Corps of Engineers (USACE)'
        ]
    };
}
