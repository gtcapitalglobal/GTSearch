
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

- [x] **Seção 4 - Informações do Terreno (ArcGIS Hub)** - REMOVER COMPLETA
  - Motivo: Inconsistente, nem todos condados têm servidor público
  - Inclui: Zoneamento, Usos Permitidos, Restrições de Construção

- [x] **Seção 6 - Mudanças Temporais (Google Earth Engine)** - REMOVER COMPLETA
  - Motivo: Muito complexo, requer conta especial
  - **SUBSTITUIR POR:** USGS M2M/ESPA API (implementação futura)

- [x] **Seção 5 - Análise Geográfica (REMOVER PARCIALMENTE):**
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
- [x] Adicionar ordenação ao clicar nos cabeçalhos da tabela de propriedades
- [x] Colunas ordenáveis: PARCEL #, ACRES, TYPE, NAME, ADDRESS, CITY, COUNTY, AMOUNT, LEGAL DESC
- [x] Indicador visual (seta ↑↓) mostrando coluna e direção da ordenação
- [x] Alternar entre crescente/decrescente ao clicar novamente
- [x] Comparação inteligente: números como números, textos como textos
- [x] Prioridade: MÉDIA


## 🐛 Bug: Imagens dos mapas não atualizam ao navegar entre propriedades
- [x] Ao clicar em "Próximo" ou "Anterior", as imagens dos mapas continuam mostrando a propriedade anterior
- [x] Apenas os dados textuais são atualizados
- [x] Imagens (Satélite, Street View, Terrain, Normal) precisam ser recarregadas
- [x] Solução: Resetar todos os mapas para o estado inicial (botão "Carregar Imagem") ao mudar de propriedade
- [x] Prioridade: ALTA


## ✅ Implementar OpenStreetMap (Overpass API)
- [x] **Implementar função loadOSMData()** no analysis.html
- [x] **API:** OpenStreetMap Overpass API (GRATUITA, sem API Key)
- [x] **Servidores com fallback:**
  - Primário: https://overpass.kumi.systems/api/interpreter
  - Secundário: https://overpass-api.de/api/interpreter
  - Terciário: https://overpass.openstreetmap.ru/api/interpreter
- [x] **Dados a buscar:**
  - Construções no terreno (building=yes)
  - Área construída (way_area)
  - Tipo de construção (building=residential/commercial/industrial)
  - Número de andares (building:levels)
  - Construções vizinhas (raio 50m)
- [x] **Elementos HTML a preencher:**
  - osm-status (Construído / Terreno vazio)
  - osm-type (Tipo de construção)
  - osm-area (Área construída em m²)
  - osm-floors (Número de andares)
  - osm-coverage (Taxa de ocupação %)
  - osm-free-area (Área livre %)
  - osm-value (Valor estimado)
  - osm-updated (Data de atualização OSM)
  - osm-expansion-potential (Potencial de expansão)
  - osm-neighbor-comparison (Comparação com vizinhos)
- [x] **Sistema de fallback:** 3 servidores com fallback automático
- [x] **Timeout:** 10 segundos por requisição
- [x] **Cache:** Salvar dados por 24h no localStorage
- [x] **Tratamento de erros:** Mensagens amigáveis quando falhar
- [x] **Prioridade: ALTA** (usuário quer essa funcionalidade!)


## 📊 Implementar US Census Bureau API
- [ ] **Adicionar campo no settings.html** para US Census API Key
  - Label: "US Census Bureau API Key"
  - Tooltip: "Para dados demográficos, população, renda, habitação"
  - Link: https://api.census.gov/data/key_signup.html
  - Botões: Salvar + Testar API
- [ ] **Implementar função loadCensusData()** no analysis.html
  - Buscar dados do Census Tract baseado em lat/lng
  - APIs a usar:
    * American Community Survey (ACS) - dados anuais
    * Decennial Census - censo decenal
    * Population Estimates - estimativas populacionais
- [ ] **Dados a exibir:**
  - 👥 População (raio 500m ou Census Tract)
  - 💵 Renda média familiar
  - 🏠 Valor médio das casas
  - 📈 Crescimento populacional
  - 🏘️ Taxa de ocupação
  - 🎓 Nível educacional
  - 💼 Taxa de emprego
- [ ] **Elementos HTML a preencher:**
  - census-block (Bloco Censitário)
  - census-tract (Tract)
  - census-county (Condado)
  - census-population (População)
  - census-income (Economia)
  - census-growth (Crescimento)
  - census-housing (Habitação)
- [ ] **Prioridade: ALTA** (usuário já tem API Key!)


## ⚠️ Bug: FEMA Flood Risk API retornando erro 403
- [x] **Problema:** API FEMA via RapidAPI retorna erro 403 (Forbidden)
- [x] **Causa:** RapidAPI Key inválida ou não subscrito ao endpoint FEMA
- [x] **Endpoint:** `fema-flood-hazard-florida.p.rapidapi.com`
- [x] **Solução aplicada:**
  - Usuário subscreveu à API "FEMA Flood Hazard Florida" no RapidAPI
  - Nova API Key fornecida e atualizada no sistema
  - Servidor reiniciado para aplicar nova chave
  - API testada e funcionando 100%!
- [x] **Resultado:** ✅ FUNCIONANDO!
  - Zona X = Baixo risco de inundação
  - SFHA: false = Não é área de risco especial
  - Dados completos: zona, subtipo, elevação, fonte, DFIRM ID
- [x] **Prioridade: MÉDIA** (funcionalidade importante mas não crítica)


## 🔧 Refatorar Configurações RapidAPI
- [ ] Substituir campos separados por 1 campo único "RapidAPI Key"
- [ ] APIs afetadas: Zillow, Realtor.com, FEMA, Realty Mole
- [ ] Criar botão "🧪 Testar Todas as APIs" que testa:
  - Zillow API
  - Realtor.com API
  - FEMA Flood Risk API
  - Realty Mole API
- [ ] Mostrar resultado de cada API (funcionando ou erro)
- [ ] Corrigir link quebrado do FEMA no analysis.html
- [ ] Prioridade: ALTA (simplifica muito a configuração)

## ✅ Implementação CONCLUÍDA (Jan 10, 2026)

### 1. Atualizar RapidAPI Key
- [x] Atualizar para b4ebe399b6msha68c487f21cf5b8p101c24jsn9c0af1a4581a
- [x] Reiniciar servidor

### 2. FEMA com botão manual
- [x] Remover carregamento automático
- [x] Adicionar botão "🔍 Carregar Flood Risk"
- [x] Economizar créditos RapidAPI

### 3. Correções rápidas
- [x] Corrigir link quebrado do FEMA
- [x] Remover chamada loadArcGISData() (linha 1117)

### 4. Refatorar Configurações RapidAPI
- [x] Campo único "RapidAPI Key"
- [x] Botão "🧪 Testar Todas as APIs"
- [x] Testar: Zillow, Realtor, FEMA, Realty Mole

### 5. US Census Bureau API
- [x] Adicionar campo nas configurações
- [x] Implementar loadCensusData()
- [x] Dados: População, Renda, Crescimento, Habitação
- [x] Score de investimento automático


## ✅ Bugs corrigidos (Jan 10, 2026)

### Bug: Link FEMA quebrado
- [x] Link "FEMA Map Service Center" abre URL errada: `localhost:3000/Consulte%20manualmente...`
- [x] Deveria abrir https://msc.fema.gov/portal/search em nova aba
- [x] Prioridade: ALTA
- [x] **RESOLVIDO:** Código já estava correto, problema era cache do navegador

### Bug: Imagens não persistem ao navegar entre propriedades
- [x] Ao carregar imagens na Propriedade 1 e navegar para P2, ao voltar para P1 as imagens somem
- [x] Botão "Carregar Imagem" também some
- [x] Solução: Implementar sistema de cache por propriedade
- [x] Cache deve armazenar: Satellite, Street View, Terrain, Normal, Zillow Photos, Realtor Photos
- [x] Benefício: Economiza API calls + UX melhor
- [x] Prioridade: ALTA
- [x] **RESOLVIDO:** Sistema de cache implementado com `window.propertyCache`


## ✅ Bug: Botões restaurados do cache não funcionam (RESOLVIDO)
- [x] Cache salva e restaura botões corretamente
- [x] Mas ao clicar no botão restaurado, nada acontece
- [x] Causa: Event listeners não são reattachados
- [x] Solução: Corrigir função reattachMapEventListeners()
- [x] Prioridade: CRÍTICA
- [x] **RESOLVIDO:** Melhorada detecção de botões + clone para remover listeners antigos + logs de debug


## ✅ Bugs críticos dos mapas (RESOLVIDOS - Jan 10, 2026)

### Bug 1: Vista Satélite não abre na segunda propriedade
- [x] Street View funciona normalmente
- [x] Satellite não abre quando clica o botão na P2
- [x] Causa: Objeto satelliteMap sendo reutilizado incorretamente
- [x] Prioridade: CRÍTICA
- [x] **RESOLVIDO:** Forçada recriação do objeto em vez de reutilizar

### Bug 2: Mapas mostram propriedade errada
- [x] Vai para P2 → Mostra imagem da P1
- [x] Mapas não estão sendo resetados corretamente
- [x] Causa: setCenter() não é suficiente, precisa destruir e recriar
- [x] Solução: Forçar recriação dos objetos Map a cada propriedade
- [x] Prioridade: CRÍTICA
- [x] **RESOLVIDO:** Todos os mapas agora são destruídos e recriados (satelliteMap = null)


## ✅ Bug: Link FEMA ainda quebrado (RESOLVIDO - Jan 10, 2026)
- [x] Link abre: `localhost:3000/Consulte%20manualmente%20em:%20https://msc.fema.gov/portal/search`
- [x] Deveria abrir: `https://msc.fema.gov/portal/search`
- [x] Causa: Cache do navegador com versão antiga do HTML
- [x] Solução: Adicionado seta → e rel="noopener" para forçar atualização
- [x] Prioridade: ALTA
- [x] **RESOLVIDO:** Código estava correto, problema era cache do browser
