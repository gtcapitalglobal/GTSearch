/**
 * API Integrations Module
 * Integrates with FEMA, Wetlands (NWI), and County GIS services
 * for property analysis in Florida
 */

import axios from 'axios';

// ============================================================================
// FEMA FLOOD ZONE (Statewide - Florida)
// ============================================================================

/**
 * Get FEMA Flood Zone for a property
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Flood zone data
 */
export async function getFEMAFloodZone(lat, lng) {
    try {
        const url = 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query';
        
        const params = {
            geometry: `${lng},${lat}`,
            geometryType: 'esriGeometryPoint',
            spatialRel: 'esriSpatialRelIntersects',
            outFields: 'FLD_ZONE,ZONE_SUBTY,STATIC_BFE',
            returnGeometry: false,
            f: 'json'
        };

        const response = await axios.get(url, { params, timeout: 10000 });
        
        if (response.data.features && response.data.features.length > 0) {
            const attrs = response.data.features[0].attributes;
            const zone = attrs.FLD_ZONE || 'Unknown';
            
            // Determine risk level
            let risk = 'unknown';
            let status = '⚠️ AVALIAR';
            
            if (zone === 'X' || zone === 'C') {
                risk = 'minimal';
                status = '✅ APROVADO';
            } else if (zone === 'V' || zone === 'VE') {
                risk = 'high';
                status = '🔴 REJEITAR';
            } else if (zone.startsWith('A')) {
                risk = 'moderate';
                status = '⚠️ AVALIAR';
            }
            
            return {
                found: true,
                zone: zone,
                subtype: attrs.ZONE_SUBTY || null,
                bfe: attrs.STATIC_BFE || null,
                risk: risk,
                status: status,
                source: 'FEMA NFHL (official)'
            };
        }
        
        return {
            found: false,
            zone: null,
            risk: 'unknown',
            status: '⚠️ DADOS NÃO DISPONÍVEIS',
            source: 'FEMA NFHL'
        };
        
    } catch (error) {
        console.error('Error fetching FEMA data:', error.message);
        return {
            found: false,
            error: error.message,
            status: '⚠️ ERRO NA CONSULTA',
            source: 'FEMA NFHL'
        };
    }
}

// ============================================================================
// WETLANDS (Statewide - Florida)
// ============================================================================

/**
 * Get Wetlands data for a property
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Object} parcelGeometry - Optional parcel polygon geometry
 * @returns {Promise<Object>} Wetlands data
 */
export async function getWetlands(lat, lng, parcelGeometry = null) {
    try {
        const url = 'https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0/query';
        
        let params;
        
        if (parcelGeometry && parcelGeometry.rings) {
            // Use polygon if available (more accurate)
            params = {
                geometry: JSON.stringify(parcelGeometry),
                geometryType: 'esriGeometryPolygon',
                spatialRel: 'esriSpatialRelIntersects',
                outFields: 'ATTRIBUTE,WETLAND_TYPE,ACRES',
                returnGeometry: false,
                f: 'json'
            };
        } else {
            // Use point with buffer as fallback
            params = {
                geometry: `${lng},${lat}`,
                geometryType: 'esriGeometryPoint',
                spatialRel: 'esriSpatialRelIntersects',
                distance: 50, // 50 meters buffer
                units: 'esriSRUnit_Meter',
                outFields: 'ATTRIBUTE,WETLAND_TYPE,ACRES',
                returnGeometry: false,
                f: 'json'
            };
        }

        const response = await axios.get(url, { params, timeout: 10000 });
        
        if (response.data.features && response.data.features.length > 0) {
            const wetlands = response.data.features.map(f => ({
                code: f.attributes.ATTRIBUTE,
                type: f.attributes.WETLAND_TYPE,
                acres: f.attributes.ACRES
            }));
            
            const totalAcres = wetlands.reduce((sum, w) => sum + (w.acres || 0), 0);
            
            return {
                found: true,
                wetlands: wetlands,
                totalAcres: totalAcres.toFixed(2),
                status: '⚠️ POSSÍVEL WETLAND',
                warning: 'Consultar USACE para confirmação regulatória',
                source: 'NWI (screening biológico)'
            };
        }
        
        return {
            found: false,
            wetlands: [],
            totalAcres: 0,
            status: '✅ SEM WETLANDS',
            source: 'NWI (screening biológico)'
        };
        
    } catch (error) {
        console.error('Error fetching Wetlands data:', error.message);
        return {
            found: false,
            error: error.message,
            status: '⚠️ ERRO NA CONSULTA',
            source: 'NWI'
        };
    }
}

// ============================================================================
// PUTNAM COUNTY, FL
// ============================================================================

/**
 * Get Land Use (Assessor) for Putnam County
 * @param {string} parcelId - Parcel ID
 * @param {number} lat - Latitude (fallback)
 * @param {number} lng - Longitude (fallback)
 * @returns {Promise<Object>} Land use data
 */
export async function getPutnamLandUse(parcelId, lat, lng) {
    try {
        const url = 'https://pamap.putnam-fl.gov/server/rest/services/CadastralData/FeatureServer/2/query';
        
        let params;
        
        if (parcelId) {
            params = {
                where: `PARCELNO='${parcelId}'`,
                outFields: 'PARCELNO,SITEADDR,USECD,USEDSCRP,OWNER,ACRES',
                returnGeometry: false,
                f: 'json'
            };
        } else {
            params = {
                geometry: `${lng},${lat}`,
                geometryType: 'esriGeometryPoint',
                spatialRel: 'esriSpatialRelIntersects',
                outFields: 'PARCELNO,SITEADDR,USECD,USEDSCRP,OWNER,ACRES',
                returnGeometry: false,
                f: 'json'
            };
        }

        const response = await axios.get(url, { params, timeout: 10000 });
        
        if (response.data.features && response.data.features.length > 0) {
            const attrs = response.data.features[0].attributes;
            
            return {
                found: true,
                parcelId: attrs.PARCELNO,
                address: attrs.SITEADDR,
                code: attrs.USECD,
                description: attrs.USEDSCRP,
                owner: attrs.OWNER,
                acres: attrs.ACRES,
                status: '✅ DISPONÍVEL',
                source: 'Property Appraiser (fiscal classification)',
                note: 'NÃO é zoning legal'
            };
        }
        
        return {
            found: false,
            status: '⚠️ DADOS NÃO DISPONÍVEIS',
            source: 'Putnam County Property Appraiser'
        };
        
    } catch (error) {
        console.error('Error fetching Putnam Land Use:', error.message);
        return {
            found: false,
            error: error.message,
            status: '⚠️ ERRO NA CONSULTA',
            source: 'Putnam County Property Appraiser'
        };
    }
}

/**
 * Detect if property is in municipal or unincorporated area (Putnam County)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Jurisdiction data
 */
export async function getPutnamJurisdiction(lat, lng) {
    try {
        // Note: Actual endpoint needs to be confirmed from Putnam County GIS Hub
        // This is a placeholder structure
        const url = 'https://services.arcgis.com/putnam/MunicipalBoundaries/FeatureServer/0/query';
        
        const params = {
            geometry: `${lng},${lat}`,
            geometryType: 'esriGeometryPoint',
            spatialRel: 'esriSpatialRelWithin',
            outFields: 'CITY_NAME,MUNI_TYPE',
            returnGeometry: false,
            f: 'json'
        };

        const response = await axios.get(url, { params, timeout: 10000 });
        
        if (response.data.features && response.data.features.length > 0) {
            const attrs = response.data.features[0].attributes;
            return {
                isMunicipal: true,
                cityName: attrs.CITY_NAME,
                type: attrs.MUNI_TYPE
            };
        }
        
        return {
            isMunicipal: false,
            cityName: null,
            type: 'Unincorporated'
        };
        
    } catch (error) {
        console.error('Error detecting Putnam jurisdiction:', error.message);
        // Default to unincorporated if error
        return {
            isMunicipal: false,
            cityName: null,
            type: 'Unincorporated',
            error: error.message
        };
    }
}

/**
 * Get Zoning (Planning) for Putnam County
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Zoning data
 */
export async function getPutnamZoning(lat, lng) {
    try {
        // First detect jurisdiction
        const jurisdiction = await getPutnamJurisdiction(lat, lng);
        
        // Note: Actual endpoint needs to be confirmed from Putnam County GIS Hub
        // This is a placeholder structure
        let url;
        if (jurisdiction.isMunicipal) {
            // Municipal zoning (if available)
            url = `https://services.arcgis.com/putnam/Zoning_${jurisdiction.cityName}/FeatureServer/0/query`;
        } else {
            // Unincorporated zoning
            url = 'https://services.arcgis.com/putnam/Zoning_Unincorporated/FeatureServer/0/query';
        }
        
        const params = {
            geometry: `${lng},${lat}`,
            geometryType: 'esriGeometryPoint',
            spatialRel: 'esriSpatialRelIntersects',
            outFields: 'ZONE_CODE,ZONE_DESC',
            returnGeometry: false,
            f: 'json'
        };

        const response = await axios.get(url, { params, timeout: 10000 });
        
        if (response.data.features && response.data.features.length > 0) {
            const attrs = response.data.features[0].attributes;
            
            return {
                found: true,
                code: attrs.ZONE_CODE,
                description: attrs.ZONE_DESC,
                jurisdiction: jurisdiction.isMunicipal ? `Municipal (${jurisdiction.cityName})` : 'Unincorporated Putnam County',
                status: '✅ DISPONÍVEL',
                source: 'Planning & Zoning (legal)',
                note: 'Confirmar com Planning Dept para decisões finais'
            };
        }
        
        return {
            found: false,
            jurisdiction: jurisdiction.isMunicipal ? `Municipal (${jurisdiction.cityName})` : 'Unincorporated',
            status: jurisdiction.isMunicipal ? '⚠️ Not available (municipal)' : '⚠️ DADOS NÃO DISPONÍVEIS',
            source: 'Putnam County Planning & Zoning',
            note: 'Consultar Planning Department'
        };
        
    } catch (error) {
        console.error('Error fetching Putnam Zoning:', error.message);
        return {
            found: false,
            error: error.message,
            status: '⚠️ ERRO NA CONSULTA',
            source: 'Putnam County Planning & Zoning'
        };
    }
}

// ============================================================================
// HIGHLANDS COUNTY, FL
// ============================================================================

/**
 * Get Land Use (Assessor) for Highlands County
 * @param {string} parcelId - Parcel ID
 * @param {number} lat - Latitude (fallback)
 * @param {number} lng - Longitude (fallback)
 * @returns {Promise<Object>} Land use data
 */
export async function getHighlandsLandUse(parcelId, lat, lng) {
    try {
        const url = 'https://gis.highlandsfl.gov/server/rest/services/Layers/Tax_Parcels__HCPAO_/FeatureServer/0/query';
        
        let params;
        
        if (parcelId) {
            params = {
                where: `PARCEL_ID='${parcelId}'`,
                outFields: 'PARCEL_ID,SITE_ADDR,DOR_UC,LANDUSE_DESC,OWNER_NAME,ACREAGE',
                returnGeometry: false,
                f: 'json'
            };
        } else {
            params = {
                geometry: `${lng},${lat}`,
                geometryType: 'esriGeometryPoint',
                spatialRel: 'esriSpatialRelIntersects',
                outFields: 'PARCEL_ID,SITE_ADDR,DOR_UC,LANDUSE_DESC,OWNER_NAME,ACREAGE',
                returnGeometry: false,
                f: 'json'
            };
        }

        const response = await axios.get(url, { params, timeout: 10000 });
        
        if (response.data.features && response.data.features.length > 0) {
            const attrs = response.data.features[0].attributes;
            
            return {
                found: true,
                parcelId: attrs.PARCEL_ID,
                address: attrs.SITE_ADDR,
                code: attrs.DOR_UC,
                description: attrs.LANDUSE_DESC,
                owner: attrs.OWNER_NAME,
                acres: attrs.ACREAGE,
                status: '✅ DISPONÍVEL',
                source: 'Property Appraiser (fiscal classification)',
                note: 'NÃO é zoning legal'
            };
        }
        
        return {
            found: false,
            status: '⚠️ DADOS NÃO DISPONÍVEIS',
            source: 'Highlands County Property Appraiser'
        };
        
    } catch (error) {
        console.error('Error fetching Highlands Land Use:', error.message);
        return {
            found: false,
            error: error.message,
            status: '⚠️ ERRO NA CONSULTA',
            source: 'Highlands County Property Appraiser'
        };
    }
}

/**
 * Detect if property is in municipal or unincorporated area (Highlands County)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Jurisdiction data
 */
export async function getHighlandsJurisdiction(lat, lng) {
    try {
        const url = 'https://gis.highlandsfl.gov/server/rest/services/Layers/Municipal_Boundary/FeatureServer/0/query';
        
        const params = {
            geometry: `${lng},${lat}`,
            geometryType: 'esriGeometryPoint',
            spatialRel: 'esriSpatialRelWithin',
            outFields: 'MUNI_NAME,MUNI_TYPE',
            returnGeometry: false,
            f: 'json'
        };

        const response = await axios.get(url, { params, timeout: 10000 });
        
        if (response.data.features && response.data.features.length > 0) {
            const attrs = response.data.features[0].attributes;
            return {
                isMunicipal: true,
                cityName: attrs.MUNI_NAME,
                type: attrs.MUNI_TYPE
            };
        }
        
        return {
            isMunicipal: false,
            cityName: null,
            type: 'Unincorporated'
        };
        
    } catch (error) {
        console.error('Error detecting Highlands jurisdiction:', error.message);
        return {
            isMunicipal: false,
            cityName: null,
            type: 'Unincorporated',
            error: error.message
        };
    }
}

/**
 * Get Zoning (Planning) for Highlands County
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Zoning data
 */
export async function getHighlandsZoning(lat, lng) {
    try {
        // First detect jurisdiction
        const jurisdiction = await getHighlandsJurisdiction(lat, lng);
        
        const url = 'https://gis.highlandsfl.gov/server/rest/services/Layers/Zoning/FeatureServer/0/query';
        
        const params = {
            geometry: `${lng},${lat}`,
            geometryType: 'esriGeometryPoint',
            spatialRel: 'esriSpatialRelIntersects',
            outFields: 'ZONE_CODE,ZONE_NAME,JURISDICTION',
            returnGeometry: false,
            f: 'json'
        };

        const response = await axios.get(url, { params, timeout: 10000 });
        
        if (response.data.features && response.data.features.length > 0) {
            const attrs = response.data.features[0].attributes;
            
            return {
                found: true,
                code: attrs.ZONE_CODE,
                description: attrs.ZONE_NAME,
                jurisdiction: jurisdiction.isMunicipal ? `Municipal (${jurisdiction.cityName})` : 'Unincorporated Highlands County',
                status: '✅ DISPONÍVEL',
                source: 'Planning & Zoning (legal)',
                note: 'Confirmar com Planning Dept para decisões finais'
            };
        }
        
        return {
            found: false,
            jurisdiction: jurisdiction.isMunicipal ? `Municipal (${jurisdiction.cityName})` : 'Unincorporated',
            status: jurisdiction.isMunicipal ? '⚠️ Not available (municipal)' : '⚠️ DADOS NÃO DISPONÍVEIS',
            source: 'Highlands County Planning & Zoning',
            note: 'Consultar Planning Department'
        };
        
    } catch (error) {
        console.error('Error fetching Highlands Zoning:', error.message);
        return {
            found: false,
            error: error.message,
            status: '⚠️ ERRO NA CONSULTA',
            source: 'Highlands County Planning & Zoning'
        };
    }
}

// ============================================================================
// MAIN PROPERTY DETAILS FUNCTION
// ============================================================================

/**
 * Get complete property details for a given location
 * @param {Object} params - Property parameters
 * @param {number} params.lat - Latitude
 * @param {number} params.lng - Longitude
 * @param {string} params.county - County name (Putnam or Highlands)
 * @param {string} params.parcelId - Optional parcel ID
 * @param {Object} params.parcelGeometry - Optional parcel polygon geometry
 * @returns {Promise<Object>} Complete property analysis
 */
export async function getPropertyDetails({ lat, lng, county, parcelId = null, parcelGeometry = null }) {
    console.log(`Analyzing property: ${county} County, FL (${lat}, ${lng})`);
    
    try {
        // Run all queries in parallel for speed
        const [fema, wetlands, landUse, zoning] = await Promise.all([
            getFEMAFloodZone(lat, lng),
            getWetlands(lat, lng, parcelGeometry),
            county === 'Putnam' 
                ? getPutnamLandUse(parcelId, lat, lng)
                : getHighlandsLandUse(parcelId, lat, lng),
            county === 'Putnam'
                ? getPutnamZoning(lat, lng)
                : getHighlandsZoning(lat, lng)
        ]);
        
        // Determine overall status
        let overallStatus = '✅ APROVADO';
        
        if (fema.status === '🔴 REJEITAR') {
            overallStatus = '🔴 REJEITAR';
        } else if (wetlands.found || fema.risk === 'moderate') {
            overallStatus = '⚠️ AVALIAR';
        }
        
        return {
            success: true,
            county: county,
            coordinates: { lat, lng },
            fema: fema,
            wetlands: wetlands,
            landUse: landUse,
            zoning: zoning,
            overallStatus: overallStatus,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Error in getPropertyDetails:', error);
        return {
            success: false,
            error: error.message,
            county: county,
            coordinates: { lat, lng }
        };
    }
}
