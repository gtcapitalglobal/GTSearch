# 🤖 Guia de Integração OpenAI API no GTSearch

## 📋 Visão Geral

Este documento explica como integrar a API do OpenAI no GTSearch para limpeza automática de CSV, classificação de propriedades e análise inteligente.

---

## 🏗️ Arquitetura da Solução

```
┌─────────────────┐
│  Frontend       │
│  (index.html)   │
└────────┬────────┘
         │ 1. Upload CSV
         ▼
┌─────────────────┐
│  Backend        │
│  (server.js)    │
│                 │
│  Endpoint:      │
│  /api/clean-csv │
└────────┬────────┘
         │ 2. Envia para OpenAI
         ▼
┌─────────────────┐
│  OpenAI API     │
│  GPT-4o         │
│                 │
│  - Limpa dados  │
│  - Padroniza    │
│  - Valida       │
│  - Classifica   │
└────────┬────────┘
         │ 3. Retorna JSON limpo
         ▼
┌─────────────────┐
│  Frontend       │
│  Exibe no mapa  │
└─────────────────┘
```

---

## 🔧 Implementação Técnica

### 1️⃣ Backend (Node.js + Express)

#### **Arquivo: `server.js`**

```javascript
import express from 'express';
import OpenAI from 'openai';
import multer from 'multer';
import Papa from 'papaparse';

const app = express();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configurar upload de arquivos
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Endpoint para limpar CSV com IA
app.post('/api/clean-csv', upload.single('file'), async (req, res) => {
  try {
    // 1. Ler arquivo CSV
    const csvText = req.file.buffer.toString('utf-8');
    
    // 2. Parse inicial
    const parsed = Papa.parse(csvText, { header: true });
    const rawData = parsed.data;
    
    console.log(`📊 Recebido CSV com ${rawData.length} linhas`);
    
    // 3. Enviar para OpenAI para limpeza
    const cleanedData = await cleanCSVWithAI(rawData);
    
    // 4. Retornar dados limpos
    res.json({
      success: true,
      originalCount: rawData.length,
      cleanedCount: cleanedData.length,
      data: cleanedData
    });
    
  } catch (error) {
    console.error('❌ Erro ao limpar CSV:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 🤖 Função que usa OpenAI para limpar dados
async function cleanCSVWithAI(rawData) {
  // Pegar amostra (primeiras 5 linhas para análise)
  const sample = rawData.slice(0, 5);
  
  const prompt = `
Você é um especialista em limpeza de dados de propriedades para leilões de tax liens na Flórida.

**DADOS RECEBIDOS (amostra):**
${JSON.stringify(sample, null, 2)}

**SUA TAREFA:**
1. Identificar os nomes das colunas (podem variar: "Parcel Number", "ParcelID", "parcel_id", etc.)
2. Padronizar nomes de colunas para:
   - parcel_number
   - address
   - city
   - state
   - zip
   - coordinates (formato: "lat,lng")
   - acres
   - amount_due
   - county
   - parcel_type

3. Limpar dados:
   - Remover linhas sem coordenadas válidas
   - Remover linhas com acres = 0
   - Converter valores monetários para números (remover $, vírgulas)
   - Padronizar endereços (Title Case)
   - Validar coordenadas (devem estar na Flórida: lat 24-31, lng -87 a -80)

4. Retornar APENAS um JSON com:
   - "columnMapping": objeto mostrando mapeamento de colunas originais → padronizadas
   - "cleaningRules": array de regras aplicadas

**FORMATO DE RESPOSTA:**
\`\`\`json
{
  "columnMapping": {
    "Parcel Number": "parcel_number",
    "Coordinates": "coordinates",
    ...
  },
  "cleaningRules": [
    "Remove rows with invalid coordinates",
    "Convert acres to decimal",
    ...
  ]
}
\`\`\`
`;

  // Chamar OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "Você é um especialista em limpeza de dados imobiliários. Sempre retorne JSON válido." 
      },
      { 
        role: "user", 
        content: prompt 
      }
    ],
    temperature: 0.1, // Baixa temperatura = mais determinístico
    response_format: { type: "json_object" }
  });
  
  const aiResponse = JSON.parse(response.choices[0].message.content);
  console.log('🤖 OpenAI retornou:', aiResponse);
  
  // Aplicar mapeamento e limpeza
  const cleanedData = rawData
    .map(row => {
      const cleaned = {};
      
      // Mapear colunas
      for (const [originalCol, standardCol] of Object.entries(aiResponse.columnMapping)) {
        cleaned[standardCol] = row[originalCol];
      }
      
      return cleaned;
    })
    .filter(row => {
      // Validar coordenadas
      if (!row.coordinates) return false;
      
      const [lat, lng] = row.coordinates.split(',').map(parseFloat);
      if (isNaN(lat) || isNaN(lng)) return false;
      if (lat < 24 || lat > 31 || lng < -87 || lng > -80) return false;
      
      // Validar acres
      const acres = parseFloat(row.acres);
      if (isNaN(acres) || acres <= 0) return false;
      
      return true;
    });
  
  console.log(`✅ Limpeza concluída: ${rawData.length} → ${cleanedData.length} linhas`);
  
  return cleanedData;
}

app.listen(3000, () => {
  console.log('🚀 Servidor rodando na porta 3000');
});
```

---

### 2️⃣ Frontend (JavaScript)

#### **Arquivo: `public/index.html`**

```javascript
// ✅ Função para fazer upload e limpar CSV com IA
async function uploadAndCleanCSV(file) {
  // Mostrar loading
  showNotification('🤖 Limpando CSV com IA...', 'info');
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/clean-csv', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      showNotification(
        `✅ CSV limpo! ${result.originalCount} → ${result.cleanedCount} propriedades válidas`,
        'success'
      );
      
      // Processar dados limpos
      processCleanedData(result.data);
    } else {
      showNotification(`❌ Erro: ${result.error}`, 'error');
    }
    
  } catch (error) {
    console.error('❌ Erro ao limpar CSV:', error);
    showNotification('❌ Erro ao processar CSV', 'error');
  }
}

// ✅ Processar dados já limpos pela IA
function processCleanedData(data) {
  data.forEach(row => {
    const [lat, lng] = row.coordinates.split(',').map(parseFloat);
    
    const marker = L.marker([lat, lng], { icon: icons.new })
      .bindPopup(`
        <strong>${row.address}</strong><br>
        ${row.city}, ${row.state} ${row.zip}<br>
        <strong>Parcel ID:</strong> ${row.parcel_number}<br>
        <strong>Acres:</strong> ${row.acres}<br>
        <strong>Amount Due:</strong> $${row.amount_due}
      `)
      .addTo(newPropertiesLayer);
    
    allNewProperties.push(row);
  });
  
  map.fitBounds(newPropertiesLayer.getBounds());
}

// ✅ Modificar função de upload existente
function handleFiles(files) {
  for (let file of files) {
    if (file.name.endsWith('.csv')) {
      // ✅ NOVO: Usar IA para limpar
      uploadAndCleanCSV(file);
      
      // ❌ ANTIGO: Processar diretamente
      // processCSV(file);
    }
  }
}
```

---

## 💰 Custos Estimados

### Modelo: **GPT-4o** (recomendado)

| Operação | Tokens | Custo |
|----------|--------|-------|
| **Análise de CSV (100 linhas)** | ~2.000 tokens | $0.01 |
| **Limpeza completa** | ~5.000 tokens | $0.025 |
| **Classificação A/B/C** | ~3.000 tokens | $0.015 |

**Custo por CSV:** ~$0.05 (5 centavos de dólar)

**Se processar 100 CSVs/mês:** ~$5.00/mês

---

## 🎯 Funcionalidades Possíveis

### 1️⃣ **Limpeza Automática de CSV**
- ✅ Detecta nomes de colunas automaticamente
- ✅ Padroniza formatos
- ✅ Remove dados inválidos
- ✅ Valida coordenadas

### 2️⃣ **Classificação A/B/C de Propriedades**

```javascript
async function classifyProperty(property) {
  const prompt = `
Classifique esta propriedade para leilão de tax lien:

**DADOS:**
- Acres: ${property.acres}
- Amount Due: $${property.amount_due}
- Flood Zone: ${property.flood_zone}
- Zoning: ${property.zoning}
- County: ${property.county}

**CRITÉRIOS:**
- A: Excelente oportunidade (baixo risco, alto potencial)
- B: Boa oportunidade (risco moderado)
- C: Evitar (alto risco ou problemas)

Retorne JSON:
{
  "classification": "A" | "B" | "C",
  "score": 0-100,
  "reasons": ["motivo 1", "motivo 2"],
  "risks": ["risco 1", "risco 2"]
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

### 3️⃣ **Explicação Inteligente de Flood Zones**

```javascript
async function explainFloodZone(floodZone) {
  const prompt = `
Explique em português simples o que significa a flood zone "${floodZone}" para um investidor de tax liens na Flórida.

Inclua:
- Nível de risco
- Necessidade de seguro
- Impacto no valor da propriedade
- Recomendação (comprar ou evitar)
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300
  });
  
  return response.choices[0].message.content;
}
```

---

## 📦 Dependências Necessárias

```bash
npm install openai multer papaparse
```

---

## 🔐 Configuração da API Key

**Arquivo: `.env`**
```
OPENAI_API_KEY=sk-proj-...
```

**No código:**
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

---

## ⚡ Vantagens

✅ **Flexibilidade:** Funciona com qualquer formato de CSV  
✅ **Inteligência:** Detecta e corrige erros automaticamente  
✅ **Escalabilidade:** Processa centenas de linhas rapidamente  
✅ **Manutenção:** Não precisa atualizar código quando formato muda  

---

## ⚠️ Desvantagens

❌ **Custo:** ~$0.05 por CSV (barato, mas não é grátis)  
❌ **Latência:** ~2-5 segundos por requisição  
❌ **Dependência:** Precisa de internet e API key  

---

## 🚀 Próximos Passos

Se quiser implementar, posso:

1. ✅ Adicionar endpoint `/api/clean-csv` no `server.js`
2. ✅ Modificar frontend para usar IA
3. ✅ Adicionar sistema de classificação A/B/C
4. ✅ Implementar explicações inteligentes de flood zones
5. ✅ Criar cache para evitar processar o mesmo CSV duas vezes

**Quer que eu implemente?** 🤔
