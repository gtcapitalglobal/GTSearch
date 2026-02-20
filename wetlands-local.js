/**
 * Wetlands Local Detection Module
 * Uses NWI Geodatabase (FL_geodatabase_wetlands.gdb) with GDAL/ogr2ogr
 * to detect wetlands via spatial intersection.
 * 
 * The geodatabase uses NAD83 Albers projection (meters), so we must
 * convert WGS84 lat/lng coordinates before querying.
 * 
 * IMPORTANT: The user must place FL_geodatabase_wetlands.gdb in the
 * data/ directory of the project root.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the geodatabase file
const GDB_PATH = path.join(__dirname, 'data', 'FL_geodatabase_wetlands.gdb');
const LAYER_NAME = 'FL_Wetlands';

// NAD83 Albers projection parameters (from geodatabase metadata)
const ALBERS_PROJ = '+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23 +lon_0=-96 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs';

/**
 * Convert WGS84 lat/lng to NAD83 Albers projected coordinates
 * Uses pyproj via Python one-liner for accuracy
 * @param {number} lat - Latitude (WGS84)
 * @param {number} lng - Longitude (WGS84)
 * @returns {{ x: number, y: number }} Projected coordinates in meters
 */
function convertToAlbers(lat, lng) {
    try {
        const cmd = `python3 -c "
from pyproj import Transformer
t = Transformer.from_crs('EPSG:4326', '${ALBERS_PROJ}', always_xy=True)
x, y = t.transform(${lng}, ${lat})
print(f'{x:.2f},{y:.2f}')
"`;
        const result = execSync(cmd, { encoding: 'utf-8', timeout: 10000 }).trim();
        const [x, y] = result.split(',').map(Number);
        return { x, y };
    } catch (error) {
        console.error('Error converting coordinates:', error.message);
        throw new Error('Failed to convert coordinates to NAD83 Albers');
    }
}

/**
 * Classify wetland risk level based on NWI code
 * @param {string} code - NWI ATTRIBUTE code (e.g., PFO1Fd)
 * @returns {{ risk: string, riskLevel: string, riskColor: string, buildability: string }}
 */
function classifyWetlandRisk(code) {
    if (!code) return { risk: 'unknown', riskLevel: 'Unknown', riskColor: '⚠️', buildability: 'Unknown' };
    
    const prefix = code.substring(0, 3).toUpperCase();
    
    // PFO = Palustrine Forested (HIGH RISK)
    if (prefix.startsWith('PFO')) {
        return {
            risk: 'high',
            riskLevel: 'ALTO RISCO',
            riskColor: '🔴',
            buildability: 'Muito restrita - requer permit USACE + mitigação ($20k-$100k+)'
        };
    }
    
    // PSS = Palustrine Scrub-Shrub (MEDIUM-HIGH RISK)
    if (prefix.startsWith('PSS')) {
        return {
            risk: 'medium-high',
            riskLevel: 'MÉDIO-ALTO RISCO',
            riskColor: '🟠',
            buildability: 'Restrita - requer permit USACE + possível mitigação'
        };
    }
    
    // PEM = Palustrine Emergent (MEDIUM RISK)
    if (prefix.startsWith('PEM')) {
        return {
            risk: 'medium',
            riskLevel: 'MÉDIO RISCO',
            riskColor: '🟡',
            buildability: 'Moderadamente restrita - consultar USACE'
        };
    }
    
    // PAB = Palustrine Aquatic Bed (LOW-MEDIUM RISK)
    if (prefix.startsWith('PAB')) {
        return {
            risk: 'low-medium',
            riskLevel: 'BAIXO-MÉDIO RISCO',
            riskColor: '🟡',
            buildability: 'Restrições moderadas'
        };
    }
    
    // PUB = Palustrine Unconsolidated Bottom (LOW RISK)
    if (prefix.startsWith('PUB')) {
        return {
            risk: 'low',
            riskLevel: 'BAIXO RISCO',
            riskColor: '🟢',
            buildability: 'Poucas restrições'
        };
    }
    
    // L = Lacustrine (lake-related)
    if (code.startsWith('L')) {
        return {
            risk: 'medium',
            riskLevel: 'MÉDIO RISCO',
            riskColor: '🟡',
            buildability: 'Restrições de setback/buffer'
        };
    }
    
    // R = Riverine
    if (code.startsWith('R')) {
        return {
            risk: 'medium',
            riskLevel: 'MÉDIO RISCO',
            riskColor: '🟡',
            buildability: 'Restrições de setback/buffer'
        };
    }
    
    // E = Estuarine
    if (code.startsWith('E')) {
        return {
            risk: 'high',
            riskLevel: 'ALTO RISCO',
            riskColor: '🔴',
            buildability: 'Muito restrita - área costeira protegida'
        };
    }
    
    // M = Marine
    if (code.startsWith('M')) {
        return {
            risk: 'high',
            riskLevel: 'ALTO RISCO',
            riskColor: '🔴',
            buildability: 'Muito restrita - área marinha protegida'
        };
    }
    
    return { risk: 'unknown', riskLevel: 'AVALIAR', riskColor: '⚠️', buildability: 'Consultar USACE' };
}

/**
 * Decode NWI ATTRIBUTE code into human-readable description
 * @param {string} code - NWI ATTRIBUTE code (e.g., PFO1Fd)
 * @returns {string} Human-readable description
 */
function decodeNWICode(code) {
    if (!code) return 'Unknown';
    
    const parts = [];
    
    // System
    const system = code.charAt(0);
    const systems = {
        'P': 'Palustrine (freshwater)',
        'L': 'Lacustrine (lake)',
        'R': 'Riverine (river/stream)',
        'E': 'Estuarine (estuary)',
        'M': 'Marine (ocean)'
    };
    parts.push(systems[system] || `System: ${system}`);
    
    // Class (2nd-3rd chars)
    const classCode = code.substring(1, 3);
    const classes = {
        'FO': 'Forested',
        'SS': 'Scrub-Shrub',
        'EM': 'Emergent',
        'AB': 'Aquatic Bed',
        'UB': 'Unconsolidated Bottom',
        'US': 'Unconsolidated Shore',
        'RS': 'Rocky Shore',
        'OW': 'Open Water',
        'RB': 'Rock Bottom',
        'RF': 'Reef',
        'SB': 'Streambed'
    };
    if (classes[classCode]) parts.push(classes[classCode]);
    
    // Water regime (look for specific letters after digits)
    const waterRegimes = {
        'A': 'Temporarily Flooded',
        'B': 'Seasonally Saturated',
        'C': 'Seasonally Flooded',
        'D': 'Continuously Saturated',
        'E': 'Seasonally Flooded/Saturated',
        'F': 'Semi-Permanently Flooded',
        'G': 'Intermittently Exposed',
        'H': 'Permanently Flooded',
        'J': 'Intermittently Flooded',
        'K': 'Artificially Flooded'
    };
    
    // Special modifiers
    const modifiers = {
        'd': 'Partially Drained/Ditched',
        'f': 'Farmed',
        'h': 'Diked/Impounded',
        'r': 'Artificial',
        's': 'Spoil',
        'x': 'Excavated'
    };
    
    // Extract water regime and modifiers from remaining chars
    const remaining = code.substring(3);
    for (const char of remaining) {
        if (waterRegimes[char.toUpperCase()]) {
            parts.push(waterRegimes[char.toUpperCase()]);
        }
        if (modifiers[char.toLowerCase()]) {
            parts.push(modifiers[char.toLowerCase()]);
        }
    }
    
    return parts.join(' | ');
}

/**
 * Check if the geodatabase file exists
 * @returns {{ exists: boolean, path: string, lastModified: string|null }}
 */
export function checkGeoDatabase() {
    const exists = fs.existsSync(GDB_PATH);
    let lastModified = null;
    
    if (exists) {
        const stats = fs.statSync(GDB_PATH);
        lastModified = stats.mtime.toISOString();
    }
    
    return {
        exists,
        path: GDB_PATH,
        lastModified
    };
}

/**
 * Get wetlands data for a property using local geodatabase
 * @param {number} lat - Latitude (WGS84)
 * @param {number} lng - Longitude (WGS84)
 * @param {number} bufferMeters - Buffer radius in meters (default: 50m for ~0.5 acre lot)
 * @returns {Object} Wetlands analysis result
 */
export async function getWetlandsLocal(lat, lng, bufferMeters = 50) {
    // Check if geodatabase exists
    const gdbCheck = checkGeoDatabase();
    if (!gdbCheck.exists) {
        return {
            found: false,
            method: 'local_geodatabase',
            error: 'Geodatabase not found',
            status: '⚠️ GEODATABASE NÃO ENCONTRADO',
            message: `Arquivo não encontrado em: ${GDB_PATH}. Baixe em: https://www.fws.gov/program/national-wetlands-inventory/download-state-wetlands-data`,
            source: 'NWI Geodatabase (local)',
            wetlands: [],
            totalAcres: 0
        };
    }
    
    try {
        // Step 1: Convert WGS84 coordinates to NAD83 Albers
        const projected = convertToAlbers(lat, lng);
        console.log(`Converted coordinates: WGS84(${lat}, ${lng}) -> Albers(${projected.x}, ${projected.y})`);
        
        // Step 2: Create bounding box with buffer
        const bbox = {
            xmin: projected.x - bufferMeters,
            ymin: projected.y - bufferMeters,
            xmax: projected.x + bufferMeters,
            ymax: projected.y + bufferMeters
        };
        
        // Step 3: Query geodatabase using ogr2ogr with spatial filter
        const outputFile = `/tmp/wetlands_query_${Date.now()}.geojson`;
        
        const cmd = `ogr2ogr -f "GeoJSON" "${outputFile}" "${GDB_PATH}" "${LAYER_NAME}" -spat ${bbox.xmin} ${bbox.ymin} ${bbox.xmax} ${bbox.ymax} 2>&1`;
        
        console.log(`Running ogr2ogr query with buffer ${bufferMeters}m...`);
        execSync(cmd, { encoding: 'utf-8', timeout: 60000 });
        
        // Step 4: Read and parse results
        if (!fs.existsSync(outputFile)) {
            return {
                found: false,
                method: 'local_geodatabase',
                status: '✅ SEM WETLANDS',
                source: 'NWI Geodatabase (local)',
                wetlands: [],
                totalAcres: 0,
                bufferMeters,
                gdbLastModified: gdbCheck.lastModified
            };
        }
        
        const geojson = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
        
        // Clean up temp file
        try { fs.unlinkSync(outputFile); } catch (e) {}
        
        const features = geojson.features || [];
        
        if (features.length === 0) {
            return {
                found: false,
                method: 'local_geodatabase',
                status: '✅ SEM WETLANDS',
                statusDetail: `Nenhum wetland encontrado num raio de ${bufferMeters}m`,
                source: 'NWI Geodatabase (local)',
                wetlands: [],
                totalAcres: 0,
                bufferMeters,
                gdbLastModified: gdbCheck.lastModified
            };
        }
        
        // Step 5: Process wetlands found
        const wetlands = features.map(f => {
            const props = f.properties;
            const code = props.ATTRIBUTE || props.attribute || '';
            const type = props.WETLAND_TYPE || props.wetland_type || '';
            const acres = props.ACRES || props.acres || 0;
            const riskInfo = classifyWetlandRisk(code);
            const decoded = decodeNWICode(code);
            
            return {
                code,
                type,
                acres: parseFloat(acres) || 0,
                decoded,
                ...riskInfo
            };
        });
        
        // Sort by risk (highest first)
        const riskOrder = { 'high': 0, 'medium-high': 1, 'medium': 2, 'low-medium': 3, 'low': 4, 'unknown': 5 };
        wetlands.sort((a, b) => (riskOrder[a.risk] || 5) - (riskOrder[b.risk] || 5));
        
        // Calculate totals
        const totalAcres = wetlands.reduce((sum, w) => sum + w.acres, 0);
        const highestRisk = wetlands[0];
        
        // Determine overall status
        let status, statusDetail;
        if (highestRisk.risk === 'high') {
            status = '🔴 WETLAND DETECTADO - ALTO RISCO';
            statusDetail = `${wetlands.length} wetland(s) encontrado(s) - ${highestRisk.type} (${highestRisk.code})`;
        } else if (highestRisk.risk === 'medium-high' || highestRisk.risk === 'medium') {
            status = '🟡 WETLAND DETECTADO - MÉDIO RISCO';
            statusDetail = `${wetlands.length} wetland(s) encontrado(s) - ${highestRisk.type} (${highestRisk.code})`;
        } else {
            status = '⚠️ WETLAND DETECTADO - BAIXO RISCO';
            statusDetail = `${wetlands.length} wetland(s) encontrado(s) - ${highestRisk.type} (${highestRisk.code})`;
        }
        
        return {
            found: true,
            method: 'local_geodatabase',
            status,
            statusDetail,
            wetlands,
            totalAcres: totalAcres.toFixed(2),
            highestRisk: {
                code: highestRisk.code,
                type: highestRisk.type,
                riskLevel: highestRisk.riskLevel,
                riskColor: highestRisk.riskColor,
                buildability: highestRisk.buildability
            },
            count: wetlands.length,
            bufferMeters,
            source: 'NWI Geodatabase (local)',
            gdbLastModified: gdbCheck.lastModified,
            disclaimers: [
                'NWI é screening biológico, NÃO define limites regulatórios legais',
                'Para compliance, consultar US Army Corps of Engineers (USACE)',
                'Dados podem não refletir alterações recentes no terreno'
            ]
        };
        
    } catch (error) {
        console.error('Error querying local wetlands geodatabase:', error.message);
        return {
            found: false,
            method: 'local_geodatabase',
            error: error.message,
            status: '⚠️ ERRO NA CONSULTA LOCAL',
            source: 'NWI Geodatabase (local)',
            wetlands: [],
            totalAcres: 0
        };
    }
}

/**
 * Get wetlands with progressive search (starts small, expands if needed)
 * First checks directly on property (50m), then nearby (200m), then area (500m)
 * @param {number} lat - Latitude (WGS84)
 * @param {number} lng - Longitude (WGS84)
 * @returns {Object} Wetlands analysis with proximity info
 */
export async function getWetlandsProgressive(lat, lng) {
    // Level 1: Directly on property (50m buffer)
    const onProperty = await getWetlandsLocal(lat, lng, 50);
    
    // CRITICAL: If geodatabase is missing, propagate the error immediately
    // Do NOT silently return "SEM WETLANDS" - that gives false confidence
    if (onProperty.error === 'Geodatabase not found') {
        console.error('❌ GEODATABASE NÃO ENCONTRADO - Wetlands NÃO pode ser verificado!');
        return {
            found: false,
            method: 'local_geodatabase',
            error: 'Geodatabase not found',
            proximity: 'UNKNOWN',
            proximityLabel: '❌ DADOS INDISPONÍVEIS',
            status: '❌ GEODATABASE NÃO ENCONTRADO',
            statusDetail: onProperty.message || 'Arquivo FL_geodatabase_wetlands.gdb não encontrado na pasta data/',
            source: 'NWI Geodatabase (local)',
            wetlands: [],
            totalAcres: 0,
            gdbMissing: true,
            disclaimers: [
                'O arquivo FL_geodatabase_wetlands.gdb precisa estar na pasta data/ do projeto',
                'Baixe em: https://www.fws.gov/program/national-wetlands-inventory/download-state-wetlands-data',
                'SEM ESTE ARQUIVO, WETLANDS NÃO PODE SER VERIFICADO'
            ]
        };
    }
    
    // If geodatabase error (GDAL/pyproj not installed, etc), propagate
    if (onProperty.error) {
        console.error('❌ Erro na consulta de wetlands:', onProperty.error);
        return {
            found: false,
            method: 'local_geodatabase',
            error: onProperty.error,
            proximity: 'UNKNOWN',
            proximityLabel: '❌ ERRO NA CONSULTA',
            status: '❌ ERRO NA CONSULTA DE WETLANDS',
            statusDetail: `Erro: ${onProperty.error}. Verifique se GDAL (ogr2ogr) e pyproj estão instalados.`,
            source: 'NWI Geodatabase (local)',
            wetlands: [],
            totalAcres: 0,
            disclaimers: [
                'Requisitos: GDAL/ogr2ogr e pyproj instalados no sistema',
                'Instalar: sudo apt install gdal-bin && pip install pyproj'
            ]
        };
    }
    
    if (onProperty.found) {
        onProperty.proximity = 'ON_PROPERTY';
        onProperty.proximityLabel = '🔴 NO TERRENO';
        return onProperty;
    }
    
    // Level 2: Very close (200m buffer)
    const nearby = await getWetlandsLocal(lat, lng, 200);
    if (nearby.found) {
        nearby.proximity = 'NEARBY';
        nearby.proximityLabel = '🟡 PRÓXIMO (até 200m)';
        return nearby;
    }
    
    // Level 3: In the area (500m buffer)
    const area = await getWetlandsLocal(lat, lng, 500);
    if (area.found) {
        area.proximity = 'IN_AREA';
        area.proximityLabel = '🟢 NA ÁREA (até 500m)';
        return area;
    }
    
    // No wetlands found within 500m
    return {
        found: false,
        method: 'local_geodatabase',
        proximity: 'NONE',
        proximityLabel: '✅ SEM WETLANDS (500m)',
        status: '✅ SEM WETLANDS',
        statusDetail: 'Nenhum wetland encontrado num raio de 500m',
        source: 'NWI Geodatabase (local)',
        wetlands: [],
        totalAcres: 0,
        gdbLastModified: onProperty.gdbLastModified,
        disclaimers: [
            'NWI é screening biológico, NÃO define limites regulatórios legais',
            'Para compliance, consultar US Army Corps of Engineers (USACE)'
        ]
    };
}
