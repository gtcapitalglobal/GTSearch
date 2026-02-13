// 🌊 Dicionário de Flood Zones da FEMA
// Baseado em dados oficiais da FEMA (Federal Emergency Management Agency)

const FLOOD_ZONES = {
  // ✅ ZONAS DE BAIXO RISCO (Seguras)
  'X': {
    risk: 'Baixo Risco',
    icon: '✅',
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    badgeColor: 'bg-green-100 text-green-800',
    insurance: 'Não obrigatório',
    insuranceCost: 'Opcional (~$400-600/ano)',
    description: 'Área fora da zona de inundação de 100 anos. Baixo risco de enchentes.',
    recommendation: '✅ SEGURO PARA INVESTIR',
    recommendationType: 'buy',
    details: 'Propriedades nesta zona raramente inundam e não exigem seguro obrigatório. Ideal para investimento.',
    impact: 'Impacto positivo no valor da propriedade',
    impactPercent: '+5% a +10%'
  },
  
  'X (SHADED)': {
    risk: 'Risco Moderado',
    icon: '⚠️',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    insurance: 'Recomendado',
    insuranceCost: '~$500-800/ano',
    description: 'Área de inundação de 500 anos (0.2% chance anual).',
    recommendation: '⚠️ AVALIAR COM CUIDADO',
    recommendationType: 'caution',
    details: 'Risco menor que zonas A/V, mas ainda existe possibilidade de enchentes. Seguro recomendado.',
    impact: 'Impacto neutro no valor',
    impactPercent: '0% a -5%'
  },
  
  'C': {
    risk: 'Risco Mínimo',
    icon: '✅',
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    badgeColor: 'bg-green-100 text-green-800',
    insurance: 'Não obrigatório',
    insuranceCost: 'Opcional (~$400-600/ano)',
    description: 'Área de risco mínimo de inundação.',
    recommendation: '✅ SEGURO PARA INVESTIR',
    recommendationType: 'buy',
    details: 'Similar à zona X. Área segura com risco mínimo de enchentes.',
    impact: 'Impacto positivo no valor',
    impactPercent: '+5% a +10%'
  },
  
  // ⚠️ ZONAS DE ALTO RISCO (Cuidado)
  'A': {
    risk: 'Alto Risco',
    icon: '🚨',
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    badgeColor: 'bg-red-100 text-red-800',
    insurance: 'OBRIGATÓRIO',
    insuranceCost: '$700-2000/ano',
    description: 'Zona de inundação de 100 anos (1% chance anual). Alto risco!',
    recommendation: '🚨 EVITAR OU NEGOCIAR DESCONTO',
    recommendationType: 'avoid',
    details: 'Seguro contra enchentes é OBRIGATÓRIO se houver hipoteca. Custo médio: $700-2000/ano.',
    impact: 'Reduz valor da propriedade',
    impactPercent: '-10% a -25%'
  },
  
  'AE': {
    risk: 'Alto Risco',
    icon: '🚨',
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    badgeColor: 'bg-red-100 text-red-800',
    insurance: 'OBRIGATÓRIO',
    insuranceCost: '$700-2000/ano',
    description: 'Zona A com elevação base determinada. Alto risco de inundação.',
    recommendation: '🚨 EVITAR OU NEGOCIAR DESCONTO',
    recommendationType: 'avoid',
    details: 'Similar à zona A, mas com dados de elevação. Seguro obrigatório se houver hipoteca.',
    impact: 'Reduz valor da propriedade',
    impactPercent: '-15% a -30%'
  },
  
  'AH': {
    risk: 'Alto Risco',
    icon: '🚨',
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    badgeColor: 'bg-red-100 text-red-800',
    insurance: 'OBRIGATÓRIO',
    insuranceCost: '$1000-2500/ano',
    description: 'Área de inundação rasa (1-3 pés). Alto risco.',
    recommendation: '🚨 ALTO RISCO - EVITAR',
    recommendationType: 'avoid',
    details: 'Inundações rasas mas frequentes. Difícil de construir. Seguro obrigatório.',
    impact: 'Reduz valor significativamente',
    impactPercent: '-20% a -35%'
  },
  
  'AO': {
    risk: 'Alto Risco',
    icon: '🚨',
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    badgeColor: 'bg-red-100 text-red-800',
    insurance: 'OBRIGATÓRIO',
    insuranceCost: '$1000-2500/ano',
    description: 'Área de inundação por escoamento (sheet flow). Alto risco.',
    recommendation: '🚨 ALTO RISCO - EVITAR',
    recommendationType: 'avoid',
    details: 'Água flui rapidamente pela superfície. Muito perigoso. Seguro obrigatório.',
    impact: 'Reduz valor significativamente',
    impactPercent: '-25% a -40%'
  },
  
  // 🔴 ZONAS DE ALTÍSSIMO RISCO (Evitar!)
  'V': {
    risk: 'Altíssimo Risco',
    icon: '🔴',
    color: 'darkred',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-400',
    textColor: 'text-red-900',
    badgeColor: 'bg-red-200 text-red-900',
    insurance: 'OBRIGATÓRIO + MUITO CARO',
    insuranceCost: '$3000-8000/ano ou mais',
    description: 'Zona costeira com ondas. ALTÍSSIMO RISCO!',
    recommendation: '🔴 NÃO INVESTIR - ZONA PERIGOSA',
    recommendationType: 'avoid',
    details: 'Área costeira sujeita a ondas de 3+ pés. Construção extremamente cara. Risco de destruição total.',
    impact: 'Reduz valor drasticamente',
    impactPercent: '-40% a -60%'
  },
  
  'VE': {
    risk: 'Altíssimo Risco',
    icon: '🔴',
    color: 'darkred',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-400',
    textColor: 'text-red-900',
    badgeColor: 'bg-red-200 text-red-900',
    insurance: 'OBRIGATÓRIO + MUITO CARO',
    insuranceCost: '$5000-10000/ano ou mais',
    description: 'Zona V com elevação base. EXTREMAMENTE PERIGOSO!',
    recommendation: '🔴 NÃO INVESTIR - EVITAR TOTALMENTE',
    recommendationType: 'avoid',
    details: 'Zona costeira mais perigosa. Seguro pode custar $5000+/ano. Construção deve ser elevada. Alto risco de perda total.',
    impact: 'Reduz valor drasticamente',
    impactPercent: '-50% a -70%'
  },
  
  // 🏖️ ZONAS ESPECIAIS
  'D': {
    risk: 'Risco Indeterminado',
    icon: '❓',
    color: 'gray',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-800',
    badgeColor: 'bg-gray-100 text-gray-800',
    insurance: 'Consultar FEMA',
    insuranceCost: 'A determinar',
    description: 'Área com risco possível mas não determinado.',
    recommendation: '❓ PESQUISAR MAIS ANTES DE INVESTIR',
    recommendationType: 'caution',
    details: 'Falta de dados oficiais. Pode ser reclassificada no futuro. Recomenda-se pesquisa adicional.',
    impact: 'Impacto incerto',
    impactPercent: 'Desconhecido'
  }
};

// 🔍 Função para obter explicação de flood zone
function getFloodZoneExplanation(zone) {
  if (!zone || zone.trim() === '') {
    return {
      risk: 'Desconhecido',
      icon: '❓',
      color: 'gray',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-800',
      badgeColor: 'bg-gray-100 text-gray-800',
      insurance: 'Não disponível',
      insuranceCost: 'N/A',
      description: 'Informação de flood zone não disponível.',
      recommendation: '❓ CONSULTAR FEMA MANUALMENTE',
      recommendationType: 'caution',
      details: 'Não foi possível obter dados de flood zone para esta propriedade.',
      impact: 'Impacto desconhecido',
      impactPercent: 'N/A'
    };
  }
  
  const normalized = zone.toUpperCase().trim();
  
  // Buscar explicação exata
  if (FLOOD_ZONES[normalized]) {
    return FLOOD_ZONES[normalized];
  }
  
  // Buscar por prefixo (ex: "AE-EL12" → "AE")
  for (const [key, value] of Object.entries(FLOOD_ZONES)) {
    if (normalized.startsWith(key)) {
      return value;
    }
  }
  
  // Fallback para zonas não reconhecidas
  return {
    risk: 'Desconhecido',
    icon: '❓',
    color: 'gray',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-800',
    badgeColor: 'bg-gray-100 text-gray-800',
    insurance: 'Consultar FEMA',
    insuranceCost: 'A determinar',
    description: `Zona "${zone}" não reconhecida no banco de dados.`,
    recommendation: '❓ PESQUISAR MANUALMENTE NO SITE DA FEMA',
    recommendationType: 'caution',
    details: 'Código de flood zone não encontrado. Recomenda-se consultar o mapa oficial da FEMA.',
    impact: 'Impacto desconhecido',
    impactPercent: 'N/A'
  };
}
