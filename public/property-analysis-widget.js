/**
 * Property Analysis Widget
 * Automatic integration with FEMA, Wetlands (NWI Geodatabase), Land Use and Zoning APIs
 * For Putnam and Highlands County, FL
 * 
 * WETLANDS: Uses local NWI Geodatabase with GDAL/ogr2ogr for accurate detection
 * - Converts WGS84 → NAD83 Albers for spatial queries
 * - Progressive search: 50m → 200m → 500m buffer
 * - Risk classification: PFO=HIGH, PSS=MEDIUM-HIGH, PEM=MEDIUM, etc.
 */

class PropertyAnalysisWidget {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.data = null;
        this.loading = false;
        
        if (!this.container) {
            console.error(`Container #${containerId} not found`);
            return;
        }
        
        this.render();
    }
    
    /**
     * Reset widget to initial empty state (used when navigating between properties)
     */
    reset() {
        this.data = null;
        this.loading = false;
        this.render();
    }
    
    /**
     * Analyze property by calling backend API
     */
    async analyzeProperty(lat, lng, county, parcelId = null) {
        this.loading = true;
        this.render();
        
        try {
            const response = await fetch('http://localhost:3000/api/property-details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lat,
                    lng,
                    county,
                    parcelId
                })
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            this.data = await response.json();
            this.loading = false;
            this.render();
            
            return this.data;
            
        } catch (error) {
            console.error('Error analyzing property:', error);
            this.loading = false;
            this.data = { error: error.message };
            this.render();
            throw error;
        }
    }
    
    /**
     * Render widget HTML
     */
    render() {
        if (!this.container) return;
        
        if (this.loading) {
            this.container.innerHTML = this.renderLoading();
            return;
        }
        
        if (!this.data) {
            this.container.innerHTML = this.renderEmpty();
            return;
        }
        
        if (this.data.error) {
            this.container.innerHTML = this.renderError(this.data.error);
            return;
        }
        
        this.container.innerHTML = this.renderData(this.data);
    }
    
    /**
     * Render loading state
     */
    renderLoading() {
        return `
            <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="flex items-center justify-center space-x-3">
                    <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="text-lg font-semibold text-gray-700">Analisando propriedade...</span>
                </div>
                <p class="text-center text-sm text-gray-500 mt-2">Consultando FEMA, Wetlands (NWI Local), Land Use e Zoning</p>
                <div class="mt-4 space-y-2">
                    <div class="flex items-center text-sm text-gray-500">
                        <div class="w-4 h-4 mr-2 rounded-full bg-blue-200 animate-pulse"></div>
                        <span>Convertendo coordenadas WGS84 → NAD83 Albers...</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-500">
                        <div class="w-4 h-4 mr-2 rounded-full bg-green-200 animate-pulse" style="animation-delay: 0.5s"></div>
                        <span>Consultando NWI Geodatabase (1M+ wetlands)...</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-500">
                        <div class="w-4 h-4 mr-2 rounded-full bg-yellow-200 animate-pulse" style="animation-delay: 1s"></div>
                        <span>Verificando FEMA Flood Zones...</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render empty state
     */
    renderEmpty() {
        return `
            <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="text-center text-gray-500">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p class="mt-2 text-sm">Clique em "Analisar Propriedade" para começar</p>
                </div>
            </div>
        `;
    }
    
    /**
     * Render error state
     */
    renderError(errorMessage) {
        return `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex items-start">
                    <svg class="h-6 w-6 text-red-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h3 class="text-sm font-medium text-red-800">Erro na análise</h3>
                        <p class="mt-1 text-sm text-red-700">${errorMessage}</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render property data
     */
    renderData(data) {
        const statusColor = this.getStatusColor(data.overallStatus);
        
        return `
            <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                <!-- Header with Overall Status -->
                <div class="bg-gradient-to-r ${statusColor} p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-bold text-white">Análise Automática</h3>
                            <p class="text-sm text-white opacity-90">${data.county} County, FL</p>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold text-white">${data.overallStatus}</div>
                            <p class="text-xs text-white opacity-75">Status Geral</p>
                        </div>
                    </div>
                </div>
                
                <!-- Data Grid -->
                <div class="p-6 space-y-6">
                    ${this.renderFEMA(data.fema)}
                    ${this.renderWetlands(data.wetlands)}
                    ${this.renderLandUse(data.landUse)}
                    ${this.renderZoning(data.zoning)}
                </div>
                
                <!-- Footer -->
                <div class="bg-gray-50 px-6 py-3 text-xs text-gray-500 border-t">
                    <p>Última atualização: ${new Date(data.timestamp).toLocaleString('pt-BR')}</p>
                </div>
            </div>
        `;
    }
    
    /**
     * Render FEMA section
     */
    renderFEMA(fema) {
        const icon = fema.status.includes('✅') ? '✅' : fema.status.includes('🔴') ? '🔴' : '⚠️';
        
        return `
            <div class="border-l-4 ${this.getBorderColor(fema.status)} pl-4">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-gray-800 flex items-center">
                        <span class="text-xl mr-2">🌊</span>
                        FEMA Flood Zone
                    </h4>
                    <span class="text-2xl">${icon}</span>
                </div>
                
                ${fema.found ? `
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span class="text-gray-600">Zona:</span>
                            <span class="font-semibold ml-2">${fema.zone}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Risco:</span>
                            <span class="font-semibold ml-2">${this.translateRisk(fema.risk)}</span>
                        </div>
                        ${fema.subtype ? `
                            <div class="col-span-2">
                                <span class="text-gray-600">Subtipo:</span>
                                <span class="font-semibold ml-2">${fema.subtype}</span>
                            </div>
                        ` : ''}
                        ${fema.bfe ? `
                            <div>
                                <span class="text-gray-600">BFE:</span>
                                <span class="font-semibold ml-2">${fema.bfe} ft</span>
                            </div>
                        ` : ''}
                    </div>
                ` : `
                    <p class="text-sm text-gray-600">${fema.status}</p>
                `}
                
                <p class="text-xs text-gray-500 mt-2">
                    Fonte: ${fema.source}
                    <br>Para decisões críticas, consultar FEMA Map Service Center
                </p>
            </div>
        `;
    }
    
    /**
     * Render Wetlands section - ENHANCED with local geodatabase data
     */
    renderWetlands(wetlands) {
        // Determine the main icon based on risk
        let mainIcon = '✅';
        let headerBg = 'bg-green-50';
        let headerBorder = 'border-green-500';
        let headerText = 'text-green-800';
        
        if (wetlands.error) {
            mainIcon = '❌';
            headerBg = 'bg-red-50';
            headerBorder = 'border-red-500';
            headerText = 'text-red-800';
        } else if (wetlands.found) {
            if (wetlands.highestRisk) {
                const risk = wetlands.highestRisk.risk || '';
                if (risk === 'high') {
                    mainIcon = '🔴';
                    headerBg = 'bg-red-50';
                    headerBorder = 'border-red-500';
                    headerText = 'text-red-800';
                } else if (risk === 'medium-high' || risk === 'medium') {
                    mainIcon = '🟡';
                    headerBg = 'bg-yellow-50';
                    headerBorder = 'border-yellow-500';
                    headerText = 'text-yellow-800';
                } else {
                    mainIcon = '⚠️';
                    headerBg = 'bg-yellow-50';
                    headerBorder = 'border-yellow-500';
                    headerText = 'text-yellow-800';
                }
            } else {
                mainIcon = '⚠️';
                headerBg = 'bg-yellow-50';
                headerBorder = 'border-yellow-500';
                headerText = 'text-yellow-800';
            }
        }
        
        return `
            <div class="border-l-4 ${headerBorder} pl-4">
                <!-- Header -->
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-gray-800 flex items-center">
                        <span class="text-xl mr-2">🌿</span>
                        Wetlands (NWI Geodatabase Local)
                    </h4>
                    <span class="text-2xl">${mainIcon}</span>
                </div>
                
                ${wetlands.error ? this.renderWetlandsError(wetlands) : wetlands.found ? this.renderWetlandsFound(wetlands, headerBg, headerText) : this.renderWetlandsNotFound(wetlands)}
                
                <!-- Source & Disclaimers -->
                <div class="mt-3 pt-2 border-t border-gray-200">
                    <p class="text-xs text-gray-500">
                        Fonte: ${wetlands.source || 'NWI Geodatabase (local)'}
                        ${wetlands.method === 'local_geodatabase' ? ' | Método: GDAL/ogr2ogr + NAD83 Albers' : ''}
                    </p>
                    ${wetlands.disclaimers ? `
                        <div class="mt-1 space-y-0.5">
                            ${wetlands.disclaimers.map(d => `
                                <p class="text-xs text-gray-400">* ${d}</p>
                            `).join('')}
                        </div>
                    ` : `
                        <p class="text-xs text-gray-400">* NWI é screening biológico, NÃO define limites regulatórios</p>
                        <p class="text-xs text-gray-400">* Para compliance, consultar USACE</p>
                    `}
                </div>
            </div>
        `;
    }
    
    /**
     * Render wetlands error state (geodatabase missing, GDAL not installed, etc)
     */
    renderWetlandsError(wetlands) {
        const isGdbMissing = wetlands.gdbMissing || (wetlands.error === 'Geodatabase not found');
        
        return `
            <!-- Error Banner -->
            <div class="bg-red-50 border border-red-300 rounded-lg p-4 mb-3">
                <div class="flex items-start">
                    <span class="text-2xl mr-3">${isGdbMissing ? '📂' : '⚠️'}</span>
                    <div class="flex-1">
                        <p class="font-bold text-red-800 text-sm">${wetlands.status || '❌ ERRO'}</p>
                        <p class="text-xs text-red-700 mt-1">${wetlands.statusDetail || wetlands.error}</p>
                    </div>
                </div>
            </div>
            
            ${isGdbMissing ? `
                <!-- Setup Instructions -->
                <div class="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                    <p class="text-xs font-bold text-yellow-800 mb-2">COMO CONFIGURAR:</p>
                    <ol class="text-xs text-yellow-700 space-y-1.5 list-decimal ml-4">
                        <li>Baixe o geodatabase de Florida em:<br>
                            <a href="https://www.fws.gov/program/national-wetlands-inventory/download-state-wetlands-data" 
                               target="_blank" class="text-blue-600 hover:underline font-semibold">FWS.gov - NWI Download</a>
                        </li>
                        <li>Extraia o arquivo <code class="bg-white px-1 rounded">FL_geodatabase_wetlands.zip</code></li>
                        <li>Copie a pasta <code class="bg-white px-1 rounded">FL_geodatabase_wetlands.gdb</code> para:<br>
                            <code class="bg-white px-1 rounded font-mono">[GTSearch]/data/FL_geodatabase_wetlands.gdb</code>
                        </li>
                        <li>Instale GDAL: <code class="bg-white px-1 rounded font-mono">sudo apt install gdal-bin</code></li>
                        <li>Instale pyproj: <code class="bg-white px-1 rounded font-mono">pip install pyproj</code></li>
                        <li>Reinicie o servidor GTSearch</li>
                    </ol>
                </div>
                
                <div class="mt-2 bg-red-100 border border-red-300 rounded-lg p-2">
                    <p class="text-xs font-bold text-red-800">
                        ⚠️ ATENÇÃO: Sem o geodatabase, wetlands NÃO está sendo verificado!
                        <br>Isso pode resultar em compra de propriedade com wetlands não detectados.
                    </p>
                </div>
            ` : `
                <div class="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                    <p class="text-xs font-bold text-yellow-800 mb-1">REQUISITOS:</p>
                    <ul class="text-xs text-yellow-700 space-y-1">
                        <li>* GDAL/ogr2ogr instalado no sistema</li>
                        <li>* pyproj instalado (Python)</li>
                        <li>* FL_geodatabase_wetlands.gdb na pasta data/</li>
                    </ul>
                </div>
            `}
        `;
    }
    
    /**
     * Render wetlands found (detailed view)
     */
    renderWetlandsFound(wetlands, headerBg, headerText) {
        const proximity = wetlands.proximity || 'UNKNOWN';
        const proximityLabel = wetlands.proximityLabel || '';
        const highestRisk = wetlands.highestRisk || {};
        
        return `
            <!-- Status Banner -->
            <div class="${headerBg} rounded-lg p-3 mb-3">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="font-bold ${headerText} text-sm">${wetlands.status}</p>
                        <p class="text-xs ${headerText} opacity-80 mt-0.5">${wetlands.statusDetail || ''}</p>
                    </div>
                    ${proximityLabel ? `
                        <div class="text-right">
                            <span class="inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                proximity === 'ON_PROPERTY' ? 'bg-red-200 text-red-800' :
                                proximity === 'NEARBY' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-green-200 text-green-800'
                            }">
                                ${proximityLabel}
                            </span>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Summary Stats -->
            <div class="grid grid-cols-3 gap-3 mb-3">
                <div class="bg-gray-50 rounded-lg p-2 text-center">
                    <p class="text-xs text-gray-500">Wetlands</p>
                    <p class="text-lg font-bold text-gray-800">${wetlands.count || wetlands.wetlands.length}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-2 text-center">
                    <p class="text-xs text-gray-500">Total Acres</p>
                    <p class="text-lg font-bold text-gray-800">${wetlands.totalAcres}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-2 text-center">
                    <p class="text-xs text-gray-500">Buffer</p>
                    <p class="text-lg font-bold text-gray-800">${wetlands.bufferMeters || '?'}m</p>
                </div>
            </div>
            
            <!-- Highest Risk Alert -->
            ${highestRisk.code ? `
                <div class="${
                    highestRisk.risk === 'high' ? 'bg-red-50 border-red-300' :
                    highestRisk.risk === 'medium-high' ? 'bg-orange-50 border-orange-300' :
                    'bg-yellow-50 border-yellow-300'
                } border rounded-lg p-3 mb-3">
                    <div class="flex items-start">
                        <span class="text-2xl mr-2">${highestRisk.riskColor || '⚠️'}</span>
                        <div class="flex-1">
                            <p class="font-bold text-sm ${
                                highestRisk.risk === 'high' ? 'text-red-800' :
                                highestRisk.risk === 'medium-high' ? 'text-orange-800' :
                                'text-yellow-800'
                            }">
                                ${highestRisk.riskLevel || 'AVALIAR'}
                            </p>
                            <p class="text-xs mt-1 text-gray-700">
                                <strong>Tipo:</strong> ${highestRisk.type || 'N/A'}
                            </p>
                            <p class="text-xs text-gray-700">
                                <strong>Código NWI:</strong> <span class="font-mono bg-white px-1.5 py-0.5 rounded border">${highestRisk.code}</span>
                            </p>
                            <p class="text-xs mt-1 text-gray-600">
                                <strong>Buildability:</strong> ${highestRisk.buildability || 'Consultar USACE'}
                            </p>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <!-- Wetlands List -->
            <div class="space-y-2">
                <p class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Wetlands Detectados:</p>
                ${wetlands.wetlands.map((w, i) => `
                    <div class="bg-white border rounded-lg p-2.5 hover:shadow-sm transition-shadow">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="text-sm">${w.riskColor || '⚠️'}</span>
                                    <span class="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded font-bold">${w.code}</span>
                                    <span class="text-xs px-2 py-0.5 rounded-full font-semibold ${
                                        w.risk === 'high' ? 'bg-red-100 text-red-700' :
                                        w.risk === 'medium-high' ? 'bg-orange-100 text-orange-700' :
                                        w.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                    }">${w.riskLevel || w.risk}</span>
                                </div>
                                <p class="text-xs text-gray-700">${w.type}</p>
                                ${w.decoded ? `<p class="text-xs text-gray-500 mt-0.5">${w.decoded}</p>` : ''}
                            </div>
                            <div class="text-right ml-3">
                                <p class="text-sm font-bold text-gray-800">${typeof w.acres === 'number' ? w.acres.toFixed(2) : w.acres}</p>
                                <p class="text-xs text-gray-500">acres</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Investment Impact -->
            <div class="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p class="text-xs font-bold text-blue-800 mb-1">IMPACTO NO INVESTIMENTO:</p>
                <ul class="text-xs text-blue-700 space-y-1">
                    ${highestRisk.risk === 'high' ? `
                        <li>* Custo de mitigação estimado: $20,000 - $100,000+</li>
                        <li>* Permit USACE obrigatório (Section 404 Clean Water Act)</li>
                        <li>* Tempo de aprovação: 6-18 meses</li>
                        <li>* RECOMENDAÇÃO: Considerar REJEITAR ou reduzir BID significativamente</li>
                    ` : highestRisk.risk === 'medium-high' || highestRisk.risk === 'medium' ? `
                        <li>* Possível necessidade de permit USACE</li>
                        <li>* Consultar engenheiro ambiental antes de prosseguir</li>
                        <li>* RECOMENDAÇÃO: Avaliar custo-benefício e ajustar BID</li>
                    ` : `
                        <li>* Risco ambiental baixo, mas verificar setbacks</li>
                        <li>* RECOMENDAÇÃO: Prosseguir com cautela normal</li>
                    `}
                </ul>
            </div>
        `;
    }
    
    /**
     * Render wetlands not found
     */
    renderWetlandsNotFound(wetlands) {
        return `
            <div class="bg-green-50 rounded-lg p-3">
                <div class="flex items-center">
                    <span class="text-2xl mr-2">✅</span>
                    <div>
                        <p class="font-bold text-green-800 text-sm">${wetlands.status || 'SEM WETLANDS'}</p>
                        <p class="text-xs text-green-700 mt-0.5">${wetlands.statusDetail || 'Nenhum wetland encontrado num raio de 500m'}</p>
                        ${wetlands.proximityLabel ? `
                            <p class="text-xs text-green-600 mt-1 font-semibold">${wetlands.proximityLabel}</p>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="mt-2 bg-green-50 border border-green-200 rounded-lg p-2">
                <p class="text-xs text-green-700">
                    <strong>IMPACTO NO INVESTIMENTO:</strong> Sem restrições ambientais de wetlands detectadas.
                    Propriedade aprovada neste critério.
                </p>
            </div>
        `;
    }
    
    /**
     * Render Land Use section
     */
    renderLandUse(landUse) {
        const icon = landUse.found ? '✅' : '⚠️';
        
        return `
            <div class="border-l-4 ${this.getBorderColor(landUse.status)} pl-4">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-gray-800 flex items-center">
                        <span class="text-xl mr-2">📋</span>
                        LAND USE (Assessor)
                    </h4>
                    <span class="text-2xl">${icon}</span>
                </div>
                
                ${landUse.found ? `
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span class="text-gray-600">Código:</span>
                            <span class="font-semibold ml-2">${landUse.code}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Descrição:</span>
                            <span class="font-semibold ml-2">${landUse.description}</span>
                        </div>
                        ${landUse.parcelId ? `
                            <div class="col-span-2">
                                <span class="text-gray-600">Parcel ID:</span>
                                <span class="font-mono text-xs ml-2">${landUse.parcelId}</span>
                            </div>
                        ` : ''}
                        ${landUse.acres ? `
                            <div>
                                <span class="text-gray-600">Acres:</span>
                                <span class="font-semibold ml-2">${landUse.acres}</span>
                            </div>
                        ` : ''}
                    </div>
                ` : `
                    <p class="text-sm text-gray-600">${landUse.status}</p>
                `}
                
                <p class="text-xs text-gray-500 mt-2">
                    Fonte: ${landUse.source}
                    <br>${landUse.note || 'NÃO é zoning legal'}
                </p>
            </div>
        `;
    }
    
    /**
     * Render Zoning section
     */
    renderZoning(zoning) {
        const icon = zoning.found ? '✅' : '⚠️';
        
        return `
            <div class="border-l-4 ${this.getBorderColor(zoning.status)} pl-4">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-gray-800 flex items-center">
                        <span class="text-xl mr-2">🏗️</span>
                        ZONING (Planning)
                    </h4>
                    <span class="text-2xl">${icon}</span>
                </div>
                
                ${zoning.found ? `
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span class="text-gray-600">Código:</span>
                            <span class="font-semibold ml-2">${zoning.code}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Descrição:</span>
                            <span class="font-semibold ml-2">${zoning.description}</span>
                        </div>
                        ${zoning.jurisdiction ? `
                            <div class="col-span-2">
                                <span class="text-gray-600">Jurisdição:</span>
                                <span class="font-semibold ml-2">${zoning.jurisdiction}</span>
                            </div>
                        ` : ''}
                    </div>
                ` : `
                    <p class="text-sm text-gray-600">${zoning.status}</p>
                    ${zoning.jurisdiction ? `
                        <p class="text-xs text-gray-500 mt-1">Jurisdição: ${zoning.jurisdiction}</p>
                    ` : ''}
                `}
                
                <p class="text-xs text-gray-500 mt-2">
                    Fonte: ${zoning.source}
                    <br>${zoning.note || 'Confirmar com Planning Dept para decisões finais'}
                </p>
            </div>
        `;
    }
    
    /**
     * Get status color classes
     */
    getStatusColor(status) {
        if (status.includes('✅')) return 'from-green-500 to-green-600';
        if (status.includes('🔴')) return 'from-red-500 to-red-600';
        return 'from-yellow-500 to-yellow-600';
    }
    
    /**
     * Get border color classes
     */
    getBorderColor(status) {
        if (status.includes('✅')) return 'border-green-500';
        if (status.includes('🔴')) return 'border-red-500';
        return 'border-yellow-500';
    }
    
    /**
     * Translate risk level
     */
    translateRisk(risk) {
        const translations = {
            'minimal': 'Mínimo',
            'moderate': 'Moderado',
            'high': 'Alto',
            'unknown': 'Desconhecido'
        };
        return translations[risk] || risk;
    }
}

// Make it globally available
window.PropertyAnalysisWidget = PropertyAnalysisWidget;
