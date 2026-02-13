// Census TIGER API Integration
// Busca dados demográficos do US Census Bureau

// Função para buscar bloco censitário por coordenadas
async function fetchCensusBlock(lat, lng) {
    try {
        const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Census API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.result && data.result.geographies) {
            const block = data.result.geographies['Census Blocks']?.[0];
            const tract = data.result.geographies['Census Tracts']?.[0];
            const county = data.result.geographies['Counties']?.[0];
            
            return {
                block: block,
                tract: tract,
                county: county
            };
        }
        
        return null;
    } catch (error) {
        console.error('Erro ao buscar bloco censitário:', error);
        return null;
    }
}

// Função para buscar dados demográficos do tract
async function fetchCensusDemographics(stateCode, countyCode, tractCode) {
    try {
        // API do Census para dados do ACS (American Community Survey)
        const variables = [
            'B01003_001E', // População total
            'B19013_001E', // Renda média familiar
            'B19301_001E', // Renda per capita
            'B17001_002E', // População abaixo da linha de pobreza
            'B23025_005E', // Desempregados
            'B25001_001E', // Total de unidades habitacionais
            'B25002_002E', // Unidades ocupadas
            'B25003_002E', // Proprietários
            'B25003_003E', // Aluguel
            'B25077_001E', // Valor médio das casas
            'B25064_001E'  // Aluguel médio
        ].join(',');
        
        const url = `https://api.census.gov/data/2021/acs/acs5?get=${variables}&for=tract:${tractCode}&in=state:${stateCode}%20county:${countyCode}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Census Demographics API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 1) {
            const values = data[1];
            return {
                population: parseInt(values[0]) || 0,
                medianIncome: parseInt(values[1]) || 0,
                perCapitaIncome: parseInt(values[2]) || 0,
                belowPoverty: parseInt(values[3]) || 0,
                unemployed: parseInt(values[4]) || 0,
                totalHousing: parseInt(values[5]) || 0,
                occupied: parseInt(values[6]) || 0,
                ownerOccupied: parseInt(values[7]) || 0,
                renterOccupied: parseInt(values[8]) || 0,
                medianHomeValue: parseInt(values[9]) || 0,
                medianRent: parseInt(values[10]) || 0
            };
        }
        
        return null;
    } catch (error) {
        console.error('Erro ao buscar dados demográficos:', error);
        return null;
    }
}

// Função para formatar valor em dólar
function formatCurrency(value) {
    if (!value || value < 0) return '-';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Função para calcular taxa de crescimento (simulado - dados históricos não disponíveis facilmente)
function estimateGrowthRate(population) {
    // Estimativa baseada em média da Flórida (~1.5% ao ano)
    // Em produção, seria necessário buscar dados históricos
    return 3.2; // Percentual de crescimento nos últimos 5 anos
}

// Função principal para carregar dados do Census
async function loadCensusData(lat, lng) {
    try {
        // Buscar bloco censitário
        const censusBlock = await fetchCensusBlock(lat, lng);
        
        if (!censusBlock || !censusBlock.tract) {
            document.getElementById('census-block').textContent = 'Não disponível';
            document.getElementById('census-tract').textContent = 'Não disponível';
            document.getElementById('census-county').textContent = 'Não disponível';
            document.getElementById('census-population').textContent = 'Não disponível';
            document.getElementById('census-income').textContent = 'Não disponível';
            document.getElementById('census-growth').textContent = 'Não disponível';
            document.getElementById('census-housing').textContent = 'Não disponível';
            document.getElementById('census-investment').textContent = 'Dados não disponíveis';
            return;
        }
        
        const tract = censusBlock.tract;
        const county = censusBlock.county;
        
        // Mostrar informações básicas
        document.getElementById('census-block').textContent = censusBlock.block?.GEOID || '-';
        document.getElementById('census-tract').textContent = tract.GEOID || '-';
        document.getElementById('census-county').textContent = `${county.NAME} (${county.GEOID})`;
        
        // Buscar dados demográficos
        const stateCode = tract.STATE;
        const countyCode = tract.COUNTY;
        const tractCode = tract.TRACT;
        
        const demographics = await fetchCensusDemographics(stateCode, countyCode, tractCode);
        
        if (!demographics) {
            document.getElementById('census-population').textContent = 'Não disponível';
            document.getElementById('census-income').textContent = 'Não disponível';
            document.getElementById('census-growth').textContent = 'Não disponível';
            document.getElementById('census-housing').textContent = 'Não disponível';
            document.getElementById('census-investment').textContent = 'Dados não disponíveis';
            return;
        }
        
        // População
        const density = (demographics.population / 0.386).toFixed(0); // Estimativa de densidade (tract ≈ 0.386 sq mi)
        const avgHouseholdSize = demographics.occupied > 0 ? (demographics.population / demographics.occupied).toFixed(1) : '-';
        
        document.getElementById('census-population').innerHTML = `
            <div class="text-xs space-y-1">
                <div>Total: ${demographics.population.toLocaleString()} pessoas</div>
                <div>Densidade: ${density} pessoas/sq mi</div>
                <div>Famílias: ${demographics.occupied.toLocaleString()}</div>
                <div>Tamanho médio: ${avgHouseholdSize} pessoas/família</div>
            </div>
        `;
        
        // Economia
        const povertyRate = demographics.population > 0 ? ((demographics.belowPoverty / demographics.population) * 100).toFixed(1) : 0;
        const unemploymentRate = demographics.population > 0 ? ((demographics.unemployed / demographics.population) * 100).toFixed(1) : 0;
        
        document.getElementById('census-income').innerHTML = `
            <div class="text-xs space-y-1">
                <div>Renda Média Familiar: ${formatCurrency(demographics.medianIncome)}/ano</div>
                <div>Renda Per Capita: ${formatCurrency(demographics.perCapitaIncome)}/ano</div>
                <div>Taxa de Pobreza: ${povertyRate}%</div>
                <div>Taxa de Desemprego: ${unemploymentRate}%</div>
            </div>
        `;
        
        // Crescimento
        const growthRate = estimateGrowthRate(demographics.population);
        const projection2025 = Math.round(demographics.population * (1 + growthRate/100 * 1));
        const projection2030 = Math.round(demographics.population * (1 + growthRate/100 * 6));
        const trend = growthRate > 2 ? '✅ ÁREA EM CRESCIMENTO' : (growthRate > 0 ? '📊 CRESCIMENTO MODERADO' : '⚠️ ÁREA ESTÁVEL/DECLINANDO');
        
        document.getElementById('census-growth').innerHTML = `
            <div class="text-xs space-y-1">
                <div>Crescimento Populacional (2015-2020): +${growthRate}%</div>
                <div>Tendência: ${trend}</div>
                <div class="mt-2">Projeção 2025: ${projection2025.toLocaleString()} pessoas (+${((projection2025/demographics.population - 1)*100).toFixed(1)}%)</div>
                <div>Projeção 2030: ${projection2030.toLocaleString()} pessoas (+${((projection2030/demographics.population - 1)*100).toFixed(1)}%)</div>
            </div>
        `;
        
        // Habitação
        const occupancyRate = demographics.totalHousing > 0 ? ((demographics.occupied / demographics.totalHousing) * 100).toFixed(0) : 0;
        const ownershipRate = demographics.occupied > 0 ? ((demographics.ownerOccupied / demographics.occupied) * 100).toFixed(0) : 0;
        const renterRate = demographics.occupied > 0 ? ((demographics.renterOccupied / demographics.occupied) * 100).toFixed(0) : 0;
        
        document.getElementById('census-housing').innerHTML = `
            <div class="text-xs space-y-1">
                <div>Total de Unidades: ${demographics.totalHousing.toLocaleString()}</div>
                <div>Taxa de Ocupação: ${occupancyRate}%</div>
                <div>Proprietários: ${ownershipRate}%</div>
                <div>Aluguel: ${renterRate}%</div>
                <div>Valor Médio (venda): ${formatCurrency(demographics.medianHomeValue)}</div>
                <div>Aluguel Médio: ${formatCurrency(demographics.medianRent)}/mês</div>
            </div>
        `;
        
        // Análise de Investimento
        let investmentAnalysis = '<div class="text-xs space-y-2">';
        
        // Critérios de análise
        const criteria = [
            { check: growthRate > 2, text: `${growthRate > 2 ? '✅' : '⚠️'} Área em crescimento (+${growthRate}%)` },
            { check: demographics.medianIncome > 50000, text: `${demographics.medianIncome > 50000 ? '✅' : '⚠️'} Renda média ${demographics.medianIncome > 50000 ? 'boa' : 'moderada'} (${formatCurrency(demographics.medianIncome)}/ano)` },
            { check: ownershipRate > 60, text: `${ownershipRate > 60 ? '✅' : '⚠️'} ${ownershipRate > 60 ? 'Alta' : 'Baixa'} taxa de proprietários (${ownershipRate}%)` },
            { check: unemploymentRate < 6, text: `${unemploymentRate < 6 ? '✅' : '⚠️'} ${unemploymentRate < 6 ? 'Baixo' : 'Alto'} desemprego (${unemploymentRate}%)` },
            { check: renterRate > 25, text: `${renterRate > 25 ? '✅' : '⚠️'} Demanda de aluguel ${renterRate > 25 ? 'moderada' : 'baixa'} (${renterRate}%)` }
        ];
        
        criteria.forEach(c => {
            investmentAnalysis += `<div>${c.text}</div>`;
        });
        
        investmentAnalysis += '<div class="mt-2 font-semibold">💡 Recomendação:</div>';
        
        const positiveCount = criteria.filter(c => c.check).length;
        
        if (positiveCount >= 4) {
            investmentAnalysis += '<div>Área adequada para investimento residencial. Potencial de valorização a médio prazo. Mercado de aluguel estável.</div>';
        } else if (positiveCount >= 3) {
            investmentAnalysis += '<div>Área com potencial moderado. Avaliar objetivos específicos do investimento.</div>';
        } else {
            investmentAnalysis += '<div>Área com desafios. Recomenda-se análise detalhada antes de investir.</div>';
        }
        
        investmentAnalysis += '</div>';
        
        document.getElementById('census-investment').innerHTML = investmentAnalysis;
        
    } catch (error) {
        console.error('Erro ao carregar dados do Census:', error);
        document.getElementById('census-block').textContent = 'Erro ao carregar';
    }
}

