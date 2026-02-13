// Overpass OSM API Integration
// Detecta construções existentes usando OpenStreetMap

// Função para buscar construções próximas usando Overpass API
async function fetchOSMBuildings(lat, lng, radiusMeters = 50) {
    try {
        // Construir query Overpass para buscar buildings
        const query = `
            [out:json][timeout:10];
            (
                way["building"](around:${radiusMeters},${lat},${lng});
                relation["building"](around:${radiusMeters},${lat},${lng});
            );
            out geom;
        `;
        
        const url = 'https://overpass-api.de/api/interpreter';
        
        const response = await fetch(url, {
            method: 'POST',
            body: query
        });
        
        if (!response.ok) {
            throw new Error(`Overpass API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.elements || [];
        
    } catch (error) {
        console.error('Erro ao buscar dados do OSM:', error);
        return [];
    }
}

// Função para calcular área de building em sq ft
function calculateBuildingArea(geometry) {
    if (!geometry || geometry.length < 3) return 0;
    
    // Usar fórmula de Shoelace
    let area = 0;
    for (let i = 0; i < geometry.length - 1; i++) {
        area += geometry[i].lon * geometry[i + 1].lat;
        area -= geometry[i + 1].lon * geometry[i].lat;
    }
    area = Math.abs(area / 2);
    
    // Converter de graus² para sq ft
    // 1 grau² ≈ 134,000,000 sq ft (na latitude da Flórida)
    const sqftPerDegreeSquared = 134000000;
    return area * sqftPerDegreeSquared;
}

// Função para determinar tipo de construção
function determineBuildingType(tags) {
    if (!tags) return 'Desconhecido';
    
    const building = tags.building;
    
    const typeMap = {
        'house': 'Residencial (Casa)',
        'residential': 'Residencial',
        'apartments': 'Apartamentos',
        'detached': 'Casa Isolada',
        'garage': 'Garagem',
        'shed': 'Galpão/Anexo',
        'commercial': 'Comercial',
        'retail': 'Varejo',
        'industrial': 'Industrial',
        'warehouse': 'Armazém',
        'yes': 'Construção (tipo não especificado)'
    };
    
    return typeMap[building] || `Construção (${building})`;
}

// Função para buscar construções vizinhas (raio 100m)
async function fetchNeighborBuildings(lat, lng) {
    try {
        const buildings = await fetchOSMBuildings(lat, lng, 100);
        
        const buildingSizes = buildings
            .filter(b => b.geometry && b.geometry.length > 0)
            .map(b => calculateBuildingArea(b.geometry))
            .filter(size => size > 100 && size < 10000); // Filtrar valores realistas
        
        if (buildingSizes.length === 0) {
            return { count: 0, average: 0, distribution: {} };
        }
        
        const average = buildingSizes.reduce((a, b) => a + b, 0) / buildingSizes.length;
        
        // Distribuição por faixa
        const distribution = {
            '800-1000': buildingSizes.filter(s => s >= 800 && s < 1000).length,
            '1000-1500': buildingSizes.filter(s => s >= 1000 && s < 1500).length,
            '1500-2000': buildingSizes.filter(s => s >= 1500 && s < 2000).length,
            '2000+': buildingSizes.filter(s => s >= 2000).length
        };
        
        return {
            count: buildingSizes.length,
            average: average,
            distribution: distribution
        };
        
    } catch (error) {
        console.error('Erro ao buscar construções vizinhas:', error);
        return { count: 0, average: 0, distribution: {} };
    }
}

// Função principal para carregar dados do OSM
async function loadOSMData(lat, lng, parcelSqft) {
    try {
        // Buscar construções na propriedade
        const buildings = await fetchOSMBuildings(lat, lng, 50);
        
        if (buildings.length === 0) {
            // Sem construção detectada
            document.getElementById('osm-status').textContent = '❌ SEM CONSTRUÇÃO DETECTADA';
            document.getElementById('osm-type').textContent = 'Terreno vazio';
            document.getElementById('osm-area').textContent = '0 sq ft';
            document.getElementById('osm-floors').textContent = '-';
            document.getElementById('osm-coverage').textContent = '0%';
            document.getElementById('osm-free-area').textContent = `${parcelSqft.toFixed(0)} sq ft (100%)`;
            document.getElementById('osm-value').textContent = '-';
            document.getElementById('osm-updated').textContent = '-';
            
            // Potencial de expansão
            document.getElementById('osm-expansion-potential').innerHTML = `
                <li>✅ Terreno completamente vazio</li>
                <li>✅ Possível construir até ${(parcelSqft * 0.6).toFixed(0)} sq ft (60% do terreno)</li>
                <li>✅ Espaço para casa, garagem, piscina e jardim</li>
            `;
            
            // Comparação com vizinhos
            const neighbors = await fetchNeighborBuildings(lat, lng);
            if (neighbors.count > 0) {
                const distHtml = Object.entries(neighbors.distribution)
                    .map(([range, count]) => `<li>${range} sq ft: ${count} casas (${((count/neighbors.count)*100).toFixed(0)}%)</li>`)
                    .join('');
                    
                document.getElementById('osm-neighbor-comparison').innerHTML = `
                    <div class="text-xs">
                        <div>Propriedades analisadas (raio 100m): ${neighbors.count}</div>
                        <div class="mt-2">Tamanho médio das casas: ${neighbors.average.toFixed(0)} sq ft</div>
                        <div class="mt-2">Distribuição:</div>
                        <ul class="list-disc list-inside ml-4">${distHtml}</ul>
                        <div class="mt-2 font-semibold">📊 Conclusão: Área residencial estabelecida</div>
                    </div>
                `;
            } else {
                document.getElementById('osm-neighbor-comparison').innerHTML = '<div class="text-xs">Dados de vizinhos não disponíveis</div>';
            }
            
            return;
        }
        
        // Construção detectada
        const mainBuilding = buildings[0];
        const buildingArea = calculateBuildingArea(mainBuilding.geometry);
        const buildingType = determineBuildingType(mainBuilding.tags);
        const floors = mainBuilding.tags['building:levels'] || '1';
        const coverage = (buildingArea / parcelSqft) * 100;
        const freeArea = parcelSqft - buildingArea;
        
        document.getElementById('osm-status').textContent = '✅ CONSTRUÇÃO EXISTENTE';
        document.getElementById('osm-type').textContent = buildingType;
        document.getElementById('osm-area').textContent = `${buildingArea.toFixed(0)} sq ft (${(buildingArea * 0.0929).toFixed(0)} m²)`;
        document.getElementById('osm-floors').textContent = `${floors} ${floors === '1' ? '(térreo)' : 'andares'}`;
        document.getElementById('osm-coverage').textContent = `${coverage.toFixed(0)}% do terreno`;
        document.getElementById('osm-free-area').textContent = `${freeArea.toFixed(0)} sq ft (${(100-coverage).toFixed(0)}% do terreno)`;
        document.getElementById('osm-value').textContent = '-'; // Não temos valor estimado
        document.getElementById('osm-updated').textContent = '2024 (OpenStreetMap)';
        
        // Potencial de expansão
        const maxAllowed = parcelSqft * 0.6;
        const available = maxAllowed - buildingArea;
        
        if (available > 0) {
            document.getElementById('osm-expansion-potential').innerHTML = `
                <li>✅ Possível adicionar até ${available.toFixed(0)} sq ft</li>
                <li>✅ Espaço para piscina, garagem, anexo</li>
                <li>✅ Taxa máxima permitida: 60% (${maxAllowed.toFixed(0)} sq ft)</li>
                <li>✅ Disponível: ${available.toFixed(0)} sq ft de expansão</li>
            `;
        } else {
            document.getElementById('osm-expansion-potential').innerHTML = `
                <li>⚠️ Construção já ocupa ${coverage.toFixed(0)}% do terreno</li>
                <li>⚠️ Limite de 60% já atingido ou próximo</li>
                <li>⚠️ Expansão limitada ou não permitida</li>
            `;
        }
        
        // Atualizar ArcGIS com dados de cobertura
        document.getElementById('arcgis-current-coverage').textContent = `${coverage.toFixed(0)}% (${buildingArea.toFixed(0)} sq ft) ✅`;
        document.getElementById('arcgis-available-expansion').textContent = `${available.toFixed(0)} sq ft`;
        
        // Comparação com vizinhos
        const neighbors = await fetchNeighborBuildings(lat, lng);
        if (neighbors.count > 0) {
            const percentDiff = ((buildingArea - neighbors.average) / neighbors.average) * 100;
            const comparison = percentDiff > 0 ? 
                `${percentDiff.toFixed(0)}% maior que a média` : 
                `${Math.abs(percentDiff).toFixed(0)}% menor que a média`;
            
            const distHtml = Object.entries(neighbors.distribution)
                .map(([range, count]) => {
                    const isMyRange = buildingArea >= parseInt(range.split('-')[0]) && 
                                     (range.includes('+') || buildingArea < parseInt(range.split('-')[1]));
                    const arrow = isMyRange ? ' ← SUA CASA' : '';
                    return `<li>${range} sq ft: ${count} casas (${((count/neighbors.count)*100).toFixed(0)}%)${arrow}</li>`;
                })
                .join('');
                
            document.getElementById('osm-neighbor-comparison').innerHTML = `
                <div class="text-xs">
                    <div>Propriedades analisadas (raio 100m): ${neighbors.count}</div>
                    <div class="mt-2">Tamanho médio das casas: ${neighbors.average.toFixed(0)} sq ft</div>
                    <div class="mt-2">Sua casa: ${buildingArea.toFixed(0)} sq ft (${comparison})</div>
                    <div class="mt-2">Distribuição:</div>
                    <ul class="list-disc list-inside ml-4">${distHtml}</ul>
                    <div class="mt-2 font-semibold">📊 Conclusão: Casa de tamanho ${Math.abs(percentDiff) < 15 ? 'padrão' : (percentDiff > 0 ? 'acima da média' : 'abaixo da média')} para a área</div>
                </div>
            `;
        } else {
            document.getElementById('osm-neighbor-comparison').innerHTML = '<div class="text-xs">Dados de vizinhos não disponíveis</div>';
        }
        
        // Desenhar construção no mapa (se Google Maps estiver carregado)
        if (window.google && window.satelliteMap && mainBuilding.geometry) {
            drawBuildingFootprint(mainBuilding.geometry, window.satelliteMap);
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados do OSM:', error);
        document.getElementById('osm-status').textContent = 'Erro ao carregar';
    }
}

// Função para desenhar footprint da construção no mapa
function drawBuildingFootprint(geometry, map) {
    if (!geometry || geometry.length === 0 || !map) return;
    
    const coordinates = geometry.map(coord => ({
        lat: coord.lat,
        lng: coord.lon
    }));
    
    const buildingPolygon = new google.maps.Polygon({
        paths: coordinates,
        strokeColor: '#16a34a',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#22c55e',
        fillOpacity: 0.25
    });
    
    buildingPolygon.setMap(map);
    
    // Armazenar para limpar depois
    if (!window.mapOverlays) window.mapOverlays = [];
    window.mapOverlays.push(buildingPolygon);
}

