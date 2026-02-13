// ArcGIS Hub API Integration
// Busca dados oficiais de parcelas dos condados da Flórida

// Mapeamento de condados da Flórida para endpoints ArcGIS
const FLORIDA_COUNTIES_ARCGIS = {
    'Orange': 'https://services.arcgis.com/LBbVDC0hKPAnLRpO/arcgis/rest/services/Parcels/FeatureServer/0/query',
    'Polk': 'https://gis.polk-county.net/arcgis/rest/services/Parcels/MapServer/0/query',
    'Hillsborough': 'https://maps.hcpafl.org/arcgis/rest/services/Parcels/MapServer/0/query',
    'Pinellas': 'https://egis.pinellas.gov/arcgis/rest/services/Parcels/MapServer/0/query',
    'Miami-Dade': 'https://gisweb.miamidade.gov/arcgis/rest/services/Parcels/MapServer/0/query',
    'Broward': 'https://gis.broward.org/arcgis/rest/services/Parcels/MapServer/0/query',
    'Palm Beach': 'https://maps.pbcgov.org/arcgis/rest/services/Parcels/MapServer/0/query',
    'Duval': 'https://maps.coj.net/arcgis/rest/services/Parcels/MapServer/0/query',
    'Lee': 'https://gis.leegov.com/arcgis/rest/services/Parcels/MapServer/0/query',
    'Brevard': 'https://maps.brevardfl.gov/arcgis/rest/services/Parcels/MapServer/0/query',
    'Volusia': 'https://maps.vcgov.org/arcgis/rest/services/Parcels/MapServer/0/query',
    'Seminole': 'https://maps.seminolecountyfl.gov/arcgis/rest/services/Parcels/MapServer/0/query',
    'Pasco': 'https://maps.pascocountyfl.net/arcgis/rest/services/Parcels/MapServer/0/query',
    'Sarasota': 'https://maps.scgov.net/arcgis/rest/services/Parcels/MapServer/0/query',
    'Manatee': 'https://maps.mymanatee.org/arcgis/rest/services/Parcels/MapServer/0/query',
    'Osceola': 'https://maps.osceola.org/arcgis/rest/services/Parcels/MapServer/0/query',
    'Marion': 'https://maps.marioncountyfl.org/arcgis/rest/services/Parcels/MapServer/0/query',
    'Collier': 'https://gis.colliergov.net/arcgis/rest/services/Parcels/MapServer/0/query',
    'Lake': 'https://maps.lakecountyfl.gov/arcgis/rest/services/Parcels/MapServer/0/query',
    'St. Lucie': 'https://maps.stlucieco.gov/arcgis/rest/services/Parcels/MapServer/0/query'
};

// Função para buscar dados da parcela no ArcGIS Hub
async function fetchArcGISParcelData(lat, lng, county) {
    try {
        // Verificar se temos endpoint para este condado
        const endpoint = FLORIDA_COUNTIES_ARCGIS[county];
        if (!endpoint) {
            console.warn(`ArcGIS endpoint não disponível para condado: ${county}`);
            return null;
        }

        // Construir query para buscar parcela por coordenadas
        const params = new URLSearchParams({
            geometry: `${lng},${lat}`,
            geometryType: 'esriGeometryPoint',
            spatialRel: 'esriSpatialRelIntersects',
            outFields: '*',
            returnGeometry: 'true',
            f: 'json'
        });

        const url = `${endpoint}?${params.toString()}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`ArcGIS API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            return data.features[0];
        }
        
        return null;
    } catch (error) {
        console.error('Erro ao buscar dados do ArcGIS:', error);
        return null;
    }
}

// Função para calcular área de polígono em acres
function calculatePolygonArea(rings) {
    if (!rings || rings.length === 0) return 0;
    
    // Usar fórmula de Shoelace para calcular área
    const ring = rings[0];
    let area = 0;
    
    for (let i = 0; i < ring.length - 1; i++) {
        area += ring[i][0] * ring[i + 1][1];
        area -= ring[i + 1][0] * ring[i][1];
    }
    
    area = Math.abs(area / 2);
    
    // Converter de graus² para acres (aproximação)
    // 1 grau² ≈ 3089 acres (na latitude da Flórida ~28°)
    const acresPerDegreeSquared = 3089;
    return area * acresPerDegreeSquared;
}

// Função para calcular perímetro de polígono em pés
function calculatePolygonPerimeter(rings) {
    if (!rings || rings.length === 0) return 0;
    
    const ring = rings[0];
    let perimeter = 0;
    
    for (let i = 0; i < ring.length - 1; i++) {
        const dx = ring[i + 1][0] - ring[i][0];
        const dy = ring[i + 1][1] - ring[i][1];
        perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    
    // Converter de graus para pés (aproximação)
    // 1 grau ≈ 364,000 pés (na latitude da Flórida)
    const feetPerDegree = 364000;
    return perimeter * feetPerDegree;
}

// Função para determinar forma do polígono
function determinePolygonShape(rings) {
    if (!rings || rings.length === 0) return 'Desconhecida';
    
    const ring = rings[0];
    const vertices = ring.length - 1; // Último ponto é igual ao primeiro
    
    if (vertices === 4) {
        // Verificar se é retangular
        const angles = [];
        for (let i = 0; i < 4; i++) {
            const p1 = ring[i];
            const p2 = ring[(i + 1) % 4];
            const p3 = ring[(i + 2) % 4];
            
            const angle = Math.atan2(p3[1] - p2[1], p3[0] - p2[0]) - 
                         Math.atan2(p1[1] - p2[1], p1[0] - p2[0]);
            angles.push(Math.abs(angle));
        }
        
        const isRectangular = angles.every(a => Math.abs(a - Math.PI/2) < 0.1);
        return isRectangular ? 'Retangular' : 'Quadrilátero Irregular';
    } else if (vertices < 4) {
        return 'Triangular';
    } else if (vertices > 10) {
        return 'Irregular (muitos lados)';
    } else {
        return `Polígono (${vertices} lados)`;
    }
}

// Função para obter informações de zoneamento
function getZoningInfo(zoningCode) {
    // Mapeamento comum de códigos de zoneamento da Flórida
    const zoningMap = {
        'R-1': { name: 'Residencial Unifamiliar', allowed: ['Casa unifamiliar', 'Garagem', 'Piscina'], notAllowed: ['Multifamiliar', 'Comercial'] },
        'R-2': { name: 'Residencial Duplex', allowed: ['Casa unifamiliar', 'Duplex', 'Garagem'], notAllowed: ['Comercial', 'Industrial'] },
        'R-3': { name: 'Residencial Multifamiliar', allowed: ['Apartamentos', 'Condomínios'], notAllowed: ['Comercial', 'Industrial'] },
        'C-1': { name: 'Comercial Local', allowed: ['Lojas', 'Escritórios', 'Restaurantes'], notAllowed: ['Industrial pesado'] },
        'C-2': { name: 'Comercial Geral', allowed: ['Varejo', 'Serviços', 'Escritórios'], notAllowed: ['Residencial'] },
        'I-1': { name: 'Industrial Leve', allowed: ['Armazéns', 'Manufatura leve'], notAllowed: ['Residencial'] },
        'A': { name: 'Agrícola', allowed: ['Agricultura', 'Pecuária', 'Casa unifamiliar'], notAllowed: ['Comercial denso'] }
    };
    
    return zoningMap[zoningCode] || { 
        name: zoningCode || 'Não especificado', 
        allowed: ['Verificar com condado'], 
        notAllowed: ['Verificar com condado'] 
    };
}

// Função principal para carregar dados do ArcGIS Hub
async function loadArcGISData(lat, lng, county) {
    try {
        const parcelData = await fetchArcGISParcelData(lat, lng, county);
        
        if (!parcelData) {
            // Mostrar mensagem de não disponível
            document.getElementById('arcgis-shape').textContent = 'Não disponível';
            document.getElementById('arcgis-area').textContent = 'Não disponível';
            document.getElementById('arcgis-perimeter').textContent = 'Não disponível';
            document.getElementById('arcgis-dimensions').textContent = 'Não disponível';
            document.getElementById('arcgis-zoning').textContent = 'Não disponível';
            document.getElementById('arcgis-flood-zone').textContent = 'Não disponível';
            document.getElementById('arcgis-allowed-uses').innerHTML = '<li>Dados não disponíveis para este condado</li>';
            document.getElementById('arcgis-not-allowed-uses').innerHTML = '<li>Dados não disponíveis para este condado</li>';
            document.getElementById('arcgis-max-coverage').textContent = 'Não disponível';
            document.getElementById('arcgis-current-coverage').textContent = 'Não disponível';
            document.getElementById('arcgis-available-expansion').textContent = 'Não disponível';
            document.getElementById('arcgis-setbacks').innerHTML = '<li>Não disponível</li>';
            document.getElementById('arcgis-max-height').textContent = 'Não disponível';
            return;
        }

        const attributes = parcelData.attributes;
        const geometry = parcelData.geometry;
        
        // Calcular forma
        const shape = determinePolygonShape(geometry.rings);
        document.getElementById('arcgis-shape').textContent = shape;
        
        // Calcular área
        const area = calculatePolygonArea(geometry.rings);
        const sqft = area * 43560; // 1 acre = 43,560 sq ft
        document.getElementById('arcgis-area').textContent = `${area.toFixed(2)} acres (${sqft.toFixed(0)} sq ft)`;
        
        // Calcular perímetro
        const perimeter = calculatePolygonPerimeter(geometry.rings);
        const perimeterMeters = perimeter * 0.3048;
        document.getElementById('arcgis-perimeter').textContent = `${perimeter.toFixed(0)} pés (${perimeterMeters.toFixed(0)} metros)`;
        
        // Dimensões (simplificado para retângulo)
        if (shape === 'Retangular') {
            const width = Math.sqrt(sqft / 2);
            const length = sqft / width;
            document.getElementById('arcgis-dimensions').textContent = `${width.toFixed(0)} ft × ${length.toFixed(0)} ft`;
        } else {
            document.getElementById('arcgis-dimensions').textContent = 'Forma irregular';
        }
        
        // Zoneamento
        const zoningCode = attributes.ZONING || attributes.ZONE || attributes.ZONECODE || 'R-1';
        const zoningInfo = getZoningInfo(zoningCode);
        document.getElementById('arcgis-zoning').textContent = `${zoningCode} (${zoningInfo.name})`;
        
        // FEMA Flood Zone
        const floodZone = attributes.FLOODZONE || attributes.FEMA_ZONE || 'X';
        const floodRisk = floodZone === 'X' ? '✅ Área de risco mínimo' : '⚠️ Verificar seguro obrigatório';
        document.getElementById('arcgis-flood-zone').textContent = `${floodZone} (${floodRisk})`;
        
        // Usos permitidos
        const allowedHtml = zoningInfo.allowed.map(use => `<li>${use}</li>`).join('');
        document.getElementById('arcgis-allowed-uses').innerHTML = allowedHtml;
        
        // Usos não permitidos
        const notAllowedHtml = zoningInfo.notAllowed.map(use => `<li>${use}</li>`).join('');
        document.getElementById('arcgis-not-allowed-uses').innerHTML = notAllowedHtml;
        
        // Restrições de construção (valores típicos para R-1)
        const maxCoverage = sqft * 0.6; // 60% típico
        const currentCoverage = 0; // Será calculado pelo OSM
        document.getElementById('arcgis-max-coverage').textContent = `60% (${maxCoverage.toFixed(0)} sq ft)`;
        document.getElementById('arcgis-current-coverage').textContent = '⏳ Calculando com OSM...';
        document.getElementById('arcgis-available-expansion').textContent = '⏳ Calculando com OSM...';
        
        // Recuos obrigatórios (valores típicos para R-1)
        const setbacksHtml = `
            <li>Frontal: 25 ft</li>
            <li>Lateral: 7.5 ft (cada lado)</li>
            <li>Fundos: 20 ft</li>
        `;
        document.getElementById('arcgis-setbacks').innerHTML = setbacksHtml;
        
        // Altura máxima
        document.getElementById('arcgis-max-height').textContent = '35 ft (2 andares)';
        
        // Atualizar fonte
        document.getElementById('arcgis-source').textContent = `ArcGIS Hub - ${county} County GIS`;
        
        // Desenhar polígono no mapa (se Google Maps estiver carregado)
        if (window.google && window.satelliteMap) {
            drawParcelBoundary(geometry.rings, window.satelliteMap);
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados do ArcGIS:', error);
        document.getElementById('arcgis-shape').textContent = 'Erro ao carregar';
    }
}

// Função para desenhar limites da parcela no mapa
function drawParcelBoundary(rings, map) {
    if (!rings || rings.length === 0 || !map) return;
    
    const coordinates = rings[0].map(coord => ({
        lat: coord[1],
        lng: coord[0]
    }));
    
    const parcelPolygon = new google.maps.Polygon({
        paths: coordinates,
        strokeColor: '#2563eb',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.15
    });
    
    parcelPolygon.setMap(map);
    
    // Armazenar para limpar depois
    if (!window.mapOverlays) window.mapOverlays = [];
    window.mapOverlays.push(parcelPolygon);
}

