/**
 * Property Analysis Widget
 * Automatic integration with FEMA, Wetlands, Land Use and Zoning APIs
 * For Putnam and Highlands County, FL
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
                <p class="text-center text-sm text-gray-500 mt-2">Consultando FEMA, Wetlands, Land Use e Zoning</p>
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
                    <p class="mt-2 text-sm">Clique em "🔍 Analisar Propriedade" para começar</p>
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
                    📍 Fonte: ${fema.source}
                    <br>⚠️ Para decisões críticas, consultar FEMA Map Service Center
                </p>
            </div>
        `;
    }
    
    /**
     * Render Wetlands section
     */
    renderWetlands(wetlands) {
        const icon = wetlands.found ? '⚠️' : '✅';
        
        return `
            <div class="border-l-4 ${this.getBorderColor(wetlands.status)} pl-4">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-gray-800 flex items-center">
                        <span class="text-xl mr-2">🌿</span>
                        Wetlands (Áreas Úmidas)
                    </h4>
                    <span class="text-2xl">${icon}</span>
                </div>
                
                ${wetlands.found ? `
                    <div class="space-y-2 text-sm">
                        <div>
                            <span class="text-gray-600">Total de Acres:</span>
                            <span class="font-semibold ml-2">${wetlands.totalAcres} acres</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Wetlands Encontrados:</span>
                            <ul class="mt-1 ml-4 space-y-1">
                                ${wetlands.wetlands.map(w => `
                                    <li class="text-xs">
                                        <span class="font-mono bg-gray-100 px-2 py-1 rounded">${w.code}</span>
                                        ${w.type} (${w.acres} acres)
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                    ${wetlands.warning ? `
                        <div class="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                            <p class="text-xs text-yellow-800">⚠️ ${wetlands.warning}</p>
                        </div>
                    ` : ''}
                ` : `
                    <p class="text-sm text-gray-600">${wetlands.status}</p>
                `}
                
                <p class="text-xs text-gray-500 mt-2">
                    📍 Fonte: ${wetlands.source}
                    <br>⚠️ NWI é screening biológico, NÃO define limites regulatórios
                    <br>⚠️ Para compliance, consultar US Army Corps of Engineers (USACE)
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
                    📍 Fonte: ${landUse.source}
                    <br>⚠️ ${landUse.note || 'NÃO é zoning legal'}
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
                    📍 Fonte: ${zoning.source}
                    <br>⚠️ ${zoning.note || 'Confirmar com Planning Dept para decisões finais'}
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
