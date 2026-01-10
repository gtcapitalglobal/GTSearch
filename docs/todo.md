
## 🔧 Melhorias na Tela de Configurações

- [ ] Adicionar links "Como obter?" para cada API Key
  - OpenAI: https://platform.openai.com/api-keys
  - Google Gemini: https://aistudio.google.com/app/apikey
  - Google Maps: https://console.cloud.google.com/google/maps-apis/
  - RapidAPI (FEMA): https://rapidapi.com/hub
  - **USGS M2M Token: https://ers.cr.usgs.gov/register** (criar conta gratuita)
- [ ] Adicionar tooltips explicando para que serve cada API
- [ ] Melhorar layout visual dos campos de API Keys
- [ ] **Adicionar campo para USGS M2M Token**
  - Label: "USGS M2M Token (Landsat/Satellite Imagery)"
  - Tooltip: "Token para acessar imagens de satélite Landsat (1984-2024) e análise temporal"
  - Link: https://m2m.cr.usgs.gov/

## 🗺️ Melhorias OpenStreetMap Overpass API

- [ ] Trocar servidor de `overpass-api.de` para `overpass.kumi.systems` (mais rápido e confiável)
- [ ] Implementar fallback para múltiplos servidores:
  - Primário: https://overpass.kumi.systems/api/interpreter
  - Secundário: https://overpass-api.de/api/interpreter
  - Terciário: https://maps.mail.ru/osm/tools/overpass/api/interpreter
- [ ] Adicionar sistema de retry automático (3 tentativas com delay de 2s)
- [ ] Mostrar mensagem "Dados temporariamente indisponíveis" quando falhar

## ❌ REMOÇÃO DE SEÇÕES (Confirmado após testes)

### Seções a REMOVER do analysis.html:

- [ ] **Seção 4 - Informações do Terreno (ArcGIS Hub)** - REMOVER COMPLETA
  - Motivo: Inconsistente, nem todos condados têm servidor público
  - Inclui: Zoneamento, Usos Permitidos, Restrições de Construção

- [ ] **Seção 6 - Mudanças Temporais (Google Earth Engine)** - REMOVER COMPLETA
  - Motivo: Muito complexo, requer conta especial
  - **SUBSTITUIR POR:** USGS M2M/ESPA API (implementação futura)

- [ ] **Seção 5 - Análise Geográfica (REMOVER PARCIALMENTE):**
  - ❌ Remover: Corpos d'Agua Próximos (USGS - erro 400)
  - ❌ Remover: Uso do Solo (não implementado)
  - ❌ Remover: NDVI Vegetação (não implementado)
  - ❌ Remover: Proximidade de Agua (não implementado)
  - ✅ MANTER: Elevação do Terreno (Google Elevation API ou USGS)
  - ✅ MANTER: Locais Próximos (Google Places API)
  - ✅ MANTER: FEMA Flood Risk (já implementado)

## ✅ MANTER (Decisão do usuário)

- [x] **Google Maps - MANTER TUDO**
  - Vista Satélite
  - Street View
  - Terrain Map
  - Normal Map
  - Botões "Carregar Imagem"
  - Google Places API (Locais Próximos)
  - Google Elevation API (Elevação)

- [x] **Seção 7 - Análise de Construções (OpenStreetMap)**
  - API: Overpass (100% gratuita)
  - Status: Funcionando (após trocar servidor)

- [x] **Seção 8 - Análise Demográfica (Census Bureau)**
  - API: US Census (100% gratuita, ilimitada)
  - Status: Funcionando perfeitamente

## 🎯 APIs do Google Maps que precisam ser ativadas:

- [ ] Maps JavaScript API (para mapas interativos)
- [ ] Maps Static API (para imagens estáticas)
- [ ] Street View Static API (para street view)
- [ ] Geocoding API (para geocodificação)
- [ ] Elevation API (para elevação do terreno)
- [ ] Places API (para locais próximos)

## 🛰️ USGS M2M / ESPA API - Implementação Futura

### **Funcionalidade: Análise Temporal com Landsat**

- [ ] **Fase 1: Adicionar campo de configuração** (PRIORITÁRIO)
  - Adicionar input para USGS M2M Token
  - Link para registro: https://ers.cr.usgs.gov/register
  - Salvar token no localStorage

- [ ] **Fase 2: Busca de Cenas Disponíveis** (Versão Simplificada)
  - Buscar cenas Landsat disponíveis para a propriedade
  - Exibir timeline de imagens (1984-2024)
  - Mostrar data, % de nuvens, qualidade
  - Link para download direto
  - Preview/thumbnail das imagens

- [ ] **Fase 3: Processamento Automático** (Versão Completa - Futuro)
  - Backend Python para gerenciar pedidos ESPA
  - Sistema de fila para processamento
  - Notificação quando processamento completar
  - Download e armazenamento automático

- [ ] **Fase 4: Comparação Temporal** (Versão Completa - Futuro)
  - Slider de anos para comparar
  - Visualização lado a lado
  - Detecção automática de mudanças:
    - Novas construções
    - Mudança na vegetação (NDVI)
    - Alterações em corpos d'água
    - Desenvolvimento urbano
  - Relatório de mudanças ao longo do tempo

### **Benefícios:**
- ✅ 100% gratuito
- ✅ 37+ anos de histórico (1984-2024)
- ✅ Análise temporal poderosa
- ✅ Dados oficiais do governo dos EUA

### **Documentação:**
- API Docs: https://m2m.cr.usgs.gov/api/docs/json/
- ESPA Docs: https://espa.cr.usgs.gov/static/docs/api-readme.html
- Análise completa: `/docs/usgs-m2m-espa-api-analise.md`

## 📝 Outras Implementações Futuras

- [ ] Adicionar análise de risco de inundação baseado em elevação
- [ ] Criar sistema de cache para OpenStreetMap
- [ ] Adicionar loading states para todas as APIs
- [ ] Sistema de favoritos para propriedades
- [ ] Comparador de propriedades (lado a lado)
- [ ] Calculadora de ROI
- [ ] Exportar relatório PDF


## 🐛 Bug: Deduplicação não remove propriedades com ícones diferentes
- [ ] Sistema de deduplicação atual só funciona dentro do mesmo arquivo KML
- [ ] Propriedades duplicadas em arquivos diferentes não são removidas
- [ ] Exemplo: P19 (ícone preto) e Property 19 (ícone laranja) aparecem ambos
- [ ] Solução: Fazer deduplicação global entre TODOS os arquivos KML
- [ ] Prioridade: ALTA


## 🐛 Bug: Contador de propriedades incorreto
- [x] Contador mostra 16 propriedades quando deveria mostrar 13
- [x] Problema: contador incrementa ANTES da verificação de duplicatas
- [x] Solução: incrementar contador APENAS após adicionar propriedade ao mapa
- [x] Prioridade: ALTA

## 🐛 Bug: P01 aparece como Available quando deveria ser Sold
- [x] P01 está APENAS em SoldLands.kml mas aparece verde (Available)
- [x] Problema: ordem de processamento dos KML (Available é processado primeiro)
- [x] Solução: processar SoldLands.kml ANTES de AvailableLands.kml
- [x] Prioridade: CRÍTICA


## 🐛 Bug: Sistema remove propriedades vizinhas como duplicatas
- [x] Problema: tolerância de 50m remove P19 e P21 (propriedades diferentes mas vizinhas)
- [x] Solução: comparar NÚMEROS das propriedades em vez de distância
- [x] Lógica: "P19" e "Property 19" = duplicata | "P19" e "P21" = diferentes
- [x] Priorizar Points (marcadores) sobre Polygons (polígonos)
- [x] Prioridade: CRÍTICA


## 🔄 Feature: Ordenação clicável nas colunas da tabela
- [ ] Adicionar ordenação ao clicar nos cabeçalhos da tabela de propriedades
- [ ] Colunas ordenáveis: PARCEL #, ACRES, TYPE, NAME, ADDRESS, CITY, COUNTY, AMOUNT, LEGAL DESC
- [ ] Indicador visual (seta ↑↓) mostrando coluna e direção da ordenação
- [ ] Alternar entre crescente/decrescente ao clicar novamente
- [ ] Prioridade: MÉDIA


## 🐛 Bug: Imagens dos mapas não atualizam ao navegar entre propriedades
- [x] Ao clicar em "Próximo" ou "Anterior", as imagens dos mapas continuam mostrando a propriedade anterior
- [x] Apenas os dados textuais são atualizados
- [x] Imagens (Satélite, Street View, Terrain, Normal) precisam ser recarregadas
- [x] Solução: Resetar todos os mapas para o estado inicial (botão "Carregar Imagem") ao mudar de propriedade
- [x] Prioridade: ALTA
