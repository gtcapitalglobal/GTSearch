# GTSearch — TODO (v4.1-basic)

> Atualizado: 2026-02-21 | v5.0 — Full Audit Fix (84 findings)

---

## ✅ TELA 1 — Search & Import (100%)

- [x] Upload CSV com parsing automático de colunas
- [x] Upload KML com extração de coordenadas
- [x] Mapa interativo com marcadores por propriedade
- [x] Filtro por condado
- [x] Filtro por faixa de acres
- [x] Filtro por Amount Due
- [x] Seleção individual e em massa de propriedades
- [x] Navegação para Tela 2 com propriedades selecionadas
- [x] Exibição de dados básicos (parcel, address, acres, owner)
- [x] Filtro avançado multi-critério (combinar condado + acres + amount due + total value + grade) — IMPLEMENTADO v4.7
- [x] Classificação automática A/B/C por scoring — IMPLEMENTADO v4.7 (5 critérios ponderados, pesos configuráveis)
- [x] Ordenação por coluna (acres, amount due, assessed value) — CORRIGIDO v4.2
- [x] Indicador visual de propriedades já analisadas — IMPLEMENTADO v4.7 (badge ✓ na tabela, tracking via localStorage)
- [x] Filtro por Total Value — IMPLEMENTADO v4.7
- [x] Filtro por Grade (A, B, C, A+B) — IMPLEMENTADO v4.7
- [x] Barra de estatísticas de scoring (contagem A/B/C) — IMPLEMENTADO v4.7
- [x] Modal de configuração de pesos do scoring — IMPLEMENTADO v4.7
- [x] Ordenação por Grade na tabela — IMPLEMENTADO v4.7
- [x] 🐛 BUG: Ordenação por coluna não funciona (clicar nos headers Parcel#, Acres, Type, Name, etc. não ordena) — CORRIGIDO: offset era +1, correto é +3

---

## ✅ TELA 2 — Analysis (71%)

- [x] Análise individual de propriedade
- [x] Análise em batch (todas de uma vez)
- [x] FEMA Flood Zone via API NFHL (zona, subtipo, risco, BFE)
- [x] Wetlands via NWI MapServer (on-property, nearby, sem wetlands)
- [x] Zoning via ArcGIS Registry (17 condados FL, 12 funcionais)
- [x] Land Use via FDOR Statewide Cadastral
- [x] Risk Score automático (semáforo verde/amarelo/vermelho)
- [x] Aprovação/rejeição de propriedades
- [x] Transferência de analysisData para approvedProperties
- [x] Salvamento de riskLevel e riskScore no objeto da propriedade
- [x] Google Street View embed
- [x] Link para County Appraiser
- [x] Adicionar botão Redfin ao lado do Zillow (com endereço da propriedade na URL, igual Zillow) — IMPLEMENTADO v4.2 (Zillow + Redfin + Google Maps)
- [x] Histórico de análises por propriedade
- [ ] Comps (propriedades comparáveis) — vendas recentes na região
- [ ] Checar Liens (link direto para County Clerk Official Records)
- [ ] Checar Code Enforcement
- [ ] Legal Description analysis via IA
- [ ] Imagens Landsat/satélite reais (hoje usa placeholder)
- [x] Expandir zoning para mais condados FL — v4.9 (Volusia funcional, Marion best-effort)

---

## ✅ TELA 3 — Investment (86%)

- [x] Cards com dados completos da propriedade
- [x] Dados de análise detalhados (FEMA zona+subtipo+risco, Wetlands status, Zoning)
- [x] Campo Market Value editável
- [x] Campo Reforma editável
- [x] Cálculo ROI em 3 cenários (30%, 40%, 50%)
- [x] Max Bid com regra >= Amount Due
- [x] Profit por cenário (verde/vermelho)
- [x] Semáforo de viabilidade (Max Bid vs Amount Due)
- [x] $/Acre calculado automaticamente
- [x] Assessed Value exibido
- [x] Recalcular card individual
- [x] Recalcular Todos
- [x] Imagem da propriedade (Google Street View)
- [x] PDF Bid Sheet (GT Lands, imagem quadrada, campo bid, profit, wetlands)
- [x] Export CSV com todos os dados + profit
- [x] Export Google Sheets com todos os dados + profit
- [x] Histórico de cálculos por propriedade
- [x] Exibir Case # (campo CS do CSV) no card e no PDF — IMPLEMENTADO v4.2 (card header mostra Case #)
- [x] PDF ordenado por Case # (mesma ordem do leilão) — IMPLEMENTADO v4.2
- [x] PDF: Case # em destaque no topo de cada página — IMPLEMENTADO v4.2 (banner amarelo CASE #XX)
- [x] PDF: campo Bid separado por cenário ROI (30%, 40%, 50%) — IMPLEMENTADO v4.2 (campo amarelo por ROI)
- [x] PDF: campo Notas em cada página — IMPLEMENTADO v4.2 (notas salvas + linhas para escrever)
- [x] Botão deletar/desaprovar card na Tela 3 (remover propriedade da lista de aprovadas) — IMPLEMENTADO v4.2 (botão ✕ no header do card)
- [x] Botão "Novo Leilão" — limpa todas as propriedades aprovadas e reseta a Tela 3 — IMPLEMENTADO v4.2 (auto-salva histórico antes de limpar)
- [x] Histórico de Leilões — salva cada batch como um leilão com data, condado e lista de propriedades — JÁ EXISTIA (saveCurrentBatch + showHistoryModal + loadBatch)
- [x] Export automático no batch save (gera CSV ou envia pro Google Sheets automaticamente) — IMPLEMENTADO v4.2 (auto-export CSV + Google Sheets no Salvar Batch)
- [ ] Comps como referência para Market Value
- [x] Gráfico comparativo de propriedades — IMPLEMENTADO v4.8
- [x] Ranking automático por ROI — IMPLEMENTADO v4.8

---

## ✅ BACKEND & SETTINGS (100%)

- [x] 18 endpoints REST (GET/POST)
- [x] Rate limiting (100 req/15min)
- [x] Helmet security headers
- [x] CORS configurado
- [x] Proxy para APIs externas (FEMA, NWI, ArcGIS, FDOR)
- [x] Settings page com API keys + testes
- [x] Google Sheets integration config
- [x] Zoning Registry com 17 condados FL (12 funcionais, 5 sem API pública)

---

## ✅ INFRAESTRUTURA

- [x] Servidor Node.js/Express
- [x] Script de atualização automática (Windows .bat)
- [x] Git tags versionadas (v1.0 → v4.1)
- [x] Limpeza de arquivos órfãos (16 removidos em v4.1)
- [ ] Migrar de localStorage para banco de dados (SQLite ou similar)
- [ ] Testes automatizados (unit tests)
- [ ] CI/CD pipeline

---

## 🔜 PRÓXIMAS FEATURES (por prioridade)

### Prioridade Alta
- [x] Classificação A/B/C automática na Tela 1 — IMPLEMENTADO v4.7
- [ ] Comps via Realty Mole (RapidAPI) ou Regrid
- [ ] Link direto para County Clerk (liens)

### Prioridade Média
- [ ] Integração Regrid API (token expirado — renovar)
- [x] Expandir zoning para mais condados FL — v4.9 (pesquisados 7 condados, 2 novos adicionados)
- [ ] Legal Description analysis via IA
- [ ] Code Enforcement check

### Prioridade Baixa
- [ ] Imagens Landsat reais
- [ ] Dashboard centralizado (gt-lands-dashboard)
- [ ] Migração localStorage → banco de dados
- [ ] Testes automatizados

---

## 📊 COBERTURA DE ZONING (Florida)

| Condado | Zoning | FLU | Status |
|---------|--------|-----|--------|
| Alachua | ✅ | ✅ | Funcional |
| Citrus | ⚠️ | ✅ | FLU via Statewide FGDL 2020 (fallback) |
| Duval | ⚠️ | ✅ | FLU via Statewide FGDL 2020 (fallback) |
| Hernando | ✅ | ✅ | Funcional |
| Highlands | ✅ | ✅ | Funcional |
| Hillsborough | ✅ | ✅ | NOVO v4.1 |
| Lake | ⚠️ | ✅ | FLU via Statewide FGDL 2020 (fallback) |
| Levy | ⚠️ | ✅ | FLU via Statewide FGDL 2020 (fallback) |
| Marion | ⚠️ | ⚠️ | NOVO v4.9 (best-effort, SSL issues de alguns ambientes) |
| Okeechobee | ⚠️ | ✅ | FLU via Statewide FGDL 2020 (fallback) |
| Orange | ✅ | ✅ | NOVO v4.1 |
| Pasco | ✅ | ❌ | NOVO v4.1 (zoning only) |
| Polk | ❌ | ✅ | NOVO v4.1 (FLU only) |
| Putnam | ✅ | ✅ | Funcional |
| Seminole | ✅ | ✅ | Funcional |
| St. Johns | ✅ | ✅ | Funcional |
| Volusia | ✅ | ✅ | NOVO v4.9 (funcional, self-signed SSL) |

---

## RENTCAST COMPS MVP (v4.3)

- [x] RENTCAST_API_KEY configurada no .env
- [x] Provider: providers/rentcastProvider.js (getValueEstimate by address + lat/lon)
- [x] Cache 7 dias (keyed by address/latlon)
- [x] Retry 1x + timeout 15s
- [x] OFFLINE_MODE guard (mock response)
- [x] Endpoint: GET /api/comps/value-estimate?address=...
- [x] Endpoint: GET /api/comps/value-estimate?lat=..&lon=..
- [x] SSOT mapping: estimated_fmv, comps[], confidence, source=RENTCAST
- [x] Audit log entry per request
- [x] Rate-limit: 10 req/min per IP
- [x] Security: never log/return API key
- [x] Teste com endereço FL real — 3456 SW 34th St, Ocala FL: FMV=$111k, 10 comps, HIGH confidence
- [x] Contador mensal de uso RentCast (soft-limit 50 calls/mês, avisa mas NÃO bloqueia)
- [x] Endpoint GET /api/comps/usage para consultar uso atual

## RENTCAST COMPS PANEL — Tela 3 (v4.4)

- [x] Provider: suportar propertyType, maxRadius, daysOld, bedrooms, bathrooms, squareFootage params
- [x] Endpoint: passar novos params via query string
- [x] UI: botão "🔍 Comps RentCast" em cada card
- [x] UI: mini-painel de filtros pré-preenchido com dados da propriedade
- [x] Defaults: 0.5mi raio, 180 dias (6 meses), tipo Land, dados do CSV
- [x] Filtros editáveis antes de buscar
- [x] Exibir resultado: FMV sugerido + comps + confidence
- [x] Botão "Aceitar FMV" para preencher Market Value com 1 clique
- [x] Contador de uso visível (X/50)
- [x] Alterar default de dias dos comps de 90 para 180 (6 meses) — melhor para terrenos
- [x] Adicionar yearBuilt (ano de construção) ao SSOT mapper do provider e exibir no card da Tela 3 e na tabela de comps — IMPLEMENTADO v4.7

## RENTCAST — Melhorias Futuras (anotado, NÃO implementar sem permissão)

### Phase 1: Enriquecer resposta AVM atual (sem crédito extra) — IMPLEMENTADO v4.7
- [x] Extrair yearBuilt dos comps e subjectProperty e exibir no card — IMPLEMENTADO v4.7
- [x] Extrair correlation score (similaridade 0-1) dos comps — IMPLEMENTADO v4.7
- [x] Extrair daysOnMarket dos comps — IMPLEMENTADO v4.7
- [x] Extrair listingType (Standard, Auction, Foreclosure) dos comps — IMPLEMENTADO v4.7
- [x] Extrair squareFootage dos comps — IMPLEMENTADO v4.7 (já existia como sqft)
- [x] Extrair lastSaleDate e lastSalePrice do subjectProperty — IMPLEMENTADO v4.7
- [x] Subject property enrichment panel na Tela 3 (zoning, lot size, tipo, última venda) — IMPLEMENTADO v4.7
- [x] Colunas condicionais na tabela de comps (Sim%, Ano, Status) — IMPLEMENTADO v4.7
- [x] Color coding para correlation (verde ≥70%, amarelo ≥40%, vermelho <40%) — IMPLEMENTADO v4.7
- [x] Status badge colorido (Sold=verde, Pending=amarelo, Active=azul) — IMPLEMENTADO v4.7

### Phase 2: Property Records Integration (1 crédito extra por propriedade)
- [x] Novo provider: getPropertyRecord({ address }) → /v1/properties — IMPLEMENTADO v4.5
- [x] Novo endpoint: GET /api/property/record?address=... — IMPLEMENTADO v4.5
- [x] Zoning fallback: exibido no Property Record panel — IMPLEMENTADO v4.5
- [x] Extrair e exibir: HOA fee — IMPLEMENTADO v4.5
- [x] Extrair e exibir: features (pool, garagem, lareira, telhado, fundação, andares) — IMPLEMENTADO v4.5
- [x] Extrair e exibir: owner name + mailing address — IMPLEMENTADO v4.5
- [x] Extrair e exibir: tax assessments (land vs improvements) — IMPLEMENTADO v4.5
- [x] Extrair e exibir: property tax anual — IMPLEMENTADO v4.5
- [x] Extrair e exibir: histórico de vendas — IMPLEMENTADO v4.5
- [x] Contador de uso compartilhado (mesmo pool 50/mês para todos endpoints) — IMPLEMENTADO v4.5

### Phase 3: Market Intelligence (1 crédito por ZIP)
- [ ] Market Statistics por ZIP code (tendências de preço)
- [ ] Sale Listings ativos na região
- [ ] Rent Estimate para potencial de renda

## TELA 2 — Melhorias de Triagem (ANOTADO, NÃO IMPLEMENTAR SEM PERMISSÃO)

### Auto-análise ao abrir propriedade (APIs gratuitas)
- [x] FEMA Flood Zone — carregar automaticamente ao abrir propriedade (sem clique) — IMPLEMENTADO v4.6
- [x] Wetlands — carregar automaticamente ao abrir propriedade (sem clique) — IMPLEMENTADO v4.6
- [x] Zoning — carregar automaticamente ao abrir propriedade (sem clique) — IMPLEMENTADO v4.6
- [x] Land Use — carregar automaticamente ao abrir propriedade (sem clique) — IMPLEMENTADO v4.6
- [x] Remover necessidade de clicar "Analisar" para dados gratuitos — IMPLEMENTADO v4.6 (auto-dispara + restaura cache)

### Property Intelligence (RentCast) — seção nova na Tela 2
- [x] Seção entre Detalhes Adicionais e Análise Automática — IMPLEMENTADO v4.6
- [x] Botão manual "Coletar" (1 crédito RentCast) — IMPLEMENTADO v4.6
- [x] Contador de uso visível (X/50) — IMPLEMENTADO v4.6
- [x] 6 cards de triagem rápida: HOA, Year Built, Owner Occupied, Last Sale, Tax Assessment, Features — IMPLEMENTADO v4.6
- [x] Semáforos visuais (verde=ok, amarelo=atenção, vermelho=deal killer) — IMPLEMENTADO v4.6
- [x] Barra "DEAL KILLERS" — resume red flags automaticamente — IMPLEMENTADO v4.6
- [x] Tax Assessment breakdown (land vs improvements) — IMPLEMENTADO v4.6
- [x] Property Tax anual — IMPLEMENTADO v4.6
- [x] Botão "Ver dados brutos (JSON)" — IMPLEMENTADO v4.6

## INFRAESTRUTURA — Anotações (NÃO IMPLEMENTAR SEM PERMISSÃO)

### localStorage → IndexedDB (quando encher)
- [ ] Monitorar uso do localStorage — avisar Gustavo quando estiver enchendo (>70% do limite)
- [ ] Migrar para IndexedDB (lib idb, 3KB) — grátis, 50-100MB+, busca por índice
- [ ] Migração transparente — detecta dados antigos no localStorage e migra automaticamente

### Classificação A/B/C automática — Tela 1 — IMPLEMENTADO v4.7
- [x] Scoring por: Acres (25%), Amount Due vs Total Value (30%), Land Use (20%), Total Value (15%), Improvements (10%) — IMPLEMENTADO v4.7
- [x] A (70-100) 🟢, B (40-69) 🟡, C (0-39) 🔴 — IMPLEMENTADO v4.7
- [x] Pesos configuráveis via modal de settings — IMPLEMENTADO v4.7
- [x] Badge colorido em cada linha da tabela + filtro por classificação — IMPLEMENTADO v4.7
- [ ] TESTAR a ferramenta e a sugestão antes de usar em produção

### Cache cleanup automático — IMPLEMENTADO v4.8
- [x] Cleanup no startup do servidor — deletar entradas >7 dias — IMPLEMENTADO v4.8
- [x] Limite máximo de 500 entradas — deletar mais antigos quando exceder — IMPLEMENTADO v4.8
- [x] LEMBRETE: rodar limpeza de cache frequentemente até implementar automático — RESOLVIDO (agora é automático)

## SKILLS A CRIAR (NÃO IMPLEMENTAR SEM PERMISSÃO)

- [ ] Skill `tax-deed-property-analysis` — fluxo completo de análise: FEMA + Wetlands + Zoning + Land Use + Elevação + OSM + RentCast, ordem de chamada, fallbacks, interpretação, red flags
- [ ] Skill `deal-killer-scoring` — lógica A/B/C + Deal Killers: pesos, faixas, semáforos, critérios de eliminação (criar quando implementar o scoring)
- [ ] Skill `google-sheets-export` — padrão de export CSV + Google Sheets: autenticação, formatação, mapeamento de campos, auto-export no batch save

## v4.8 — Cache Cleanup + ROI Ranking + Gráfico Comparativo

- [x] Cache cleanup automático no startup do servidor (deletar entradas >7 dias, limite 500) — IMPLEMENTADO v4.8
- [x] Ranking automático por ROI na Tela 3 (ordenar cards por melhor ROI) — IMPLEMENTADO v4.8 (7 critérios: ROI, Max Bid, Profit, Acres, Amount Due, Case #)
- [x] Gráfico comparativo de propriedades na Tela 3 (Chart.js bar chart, 6 métricas) — IMPLEMENTADO v4.8

## v4.9 — Expandir Zoning para mais condados FL

- [x] Descobrir ArcGIS zoning/FLU para Citrus County — NÃO ENCONTRADO (portal requer login)
- [x] Descobrir ArcGIS zoning/FLU para Duval County (Jacksonville) — NÃO ENCONTRADO (sem API pública)
- [x] Descobrir ArcGIS zoning/FLU para Lake County — BLOQUEADO (Cloudflare protege o servidor)
- [x] Descobrir ArcGIS zoning/FLU para Levy County — NÃO ENCONTRADO (sem API pública)
- [x] Descobrir ArcGIS zoning/FLU para Marion County — ENCONTRADO (Layer 20 Zoning + Layer 6 FLU, best-effort SSL)
- [x] Descobrir ArcGIS zoning/FLU para Okeechobee County — NÃO ENCONTRADO (sem API pública)
- [x] Descobrir ArcGIS zoning/FLU para Volusia County — ENCONTRADO E VALIDADO (Layer 0 Zoning + Layer 1 FLU)
- [x] Atualizar zoning_registry.json com novos serviços encontrados — Volusia + Marion adicionados
- [x] Testar com coordenadas reais de cada condado — Volusia validado (FRA/FR), Marion ECONNRESET do sandbox
- [x] Implementar Statewide FLU Fallback (FGDL FLU_L2_2020_JDX) — v4.9.1
- [x] Citrus: CONS (CONSERVATION) via fallback — VALIDADO v4.9.1
- [x] Duval: COM (COMMERCIAL) via fallback — VALIDADO v4.9.1
- [x] Lake: MUG (MIXED USE - GENERAL) via fallback — VALIDADO v4.9.1
- [x] Levy: AG (AGRICULTURE) via fallback — VALIDADO v4.9.1
- [x] Okeechobee: AG (AGRICULTURE) via fallback — VALIDADO v4.9.1
- [x] Fallback cobre TODOS os 67 condados FL (dataset estadual gratuito)

## v4.9.2 — Audit Bug Fixes

- [x] PERF-1: Cachear getScoringConfig() fora do loop em calculateAllScores() — CORRIGIDO
- [x] PERF-2: analyzedList usar Set em vez de Array.includes() — CORRIGIDO
- [x] RISCO-1: Limitar analyzedProperties no localStorage (max 5000) — CORRIGIDO
- [x] BUG-1: Remover config2 redundante em calculatePropertyScore() — CORRIGIDO
- [x] BUG-6: Remover primeiro loop de cores morto no chart — CORRIGIDO
- [x] BUG-7: Filtrar propriedades sem cálculo do ranking (ROI = -999) — CORRIGIDO
- [x] BUG-10: Proteger correlation contra string no rentcastProvider — CORRIGIDO
- [x] Skill florida-zoning-discovery atualizada para v2.2 (Statewide FLU + Volusia/Marion)
- [x] Skill rentcast-comps atualizada (Phase 1 DONE, enriched SSOT schema, cache cleanup)

## v5.0 — Full Audit Fix (84 findings)

### CRITICAL
- [x] CRIT-1: API keys no localStorage — escapeHTML aplicado, risco aceito (app local)
- [x] CRIT-2: SSL bypass documentado como risco aceito (servidores GIS com self-signed certs)
- [x] CRIT-3: Schema zoning_registry.json padronizado v3.0 (layers-based, Highlands/Polk/5 condados)
- [x] CRIT-4: Import estático do módulo https em api-integrations.js

### HIGH — Security
- [x] SEC-H1: escapeHTML() aplicado em index.html, analysis.html, investment.html, settings.html, widget.js
- [x] SEC-H2: data-property serialização protegida com escapeHTML em index.html
- [x] SEC-H3: Endpoint /api/google-maps-key substituído por /api/google-maps-loader (com OFFLINE check)
- [x] SEC-H5: crypto.timingSafeEqual() implementado em security.js
- [x] Security headers adicionados (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- [ ] SEC-H4: Mover Census API key para backend proxy (analysis.html) — baixa prioridade, app local
- [ ] SEC-H6: Mover API endpoints hardcoded para config (settings.html) — baixa prioridade

### HIGH — Performance
- [x] PERF-H1: Log rotation 5MB max implementado em audit.js
- [ ] PERF-H2: Usar streaming para leitura de logs (audit.js) — baixa prioridade
- [ ] PERF-H3: Remover Promise.allSettled redundante (api-integrations.js) — baixa prioridade

### HIGH — Bugs
- [x] BUG-H1: parseInt com radix 10 e parseFloat safety em rentcastProvider.js
- [ ] BUG-H2: Middleware de auditoria usar res.on('finish') (audit.js) — baixa prioridade

### MEDIUM
- [x] MED-9: Input validation com regex em endpoints proxy (server.js)
- [x] MED-10: Version constant 5.0.0 (server.js)
- [x] MED-11: Cache periodic cleanup a cada 6h (api-integrations.js)
- [x] MED-12: FLU duplicado corrigido (api-integrations.js)
- [x] MED-15: Cache file write error handling (rentcastProvider.js)
- [x] API timeout 15s no callRentCastAPI (rentcastProvider.js)
- [x] Shared utils.js com escapeHTML, sanitizeURL, formatDollar, debounce
- [ ] MED-1: DocumentFragment para populateTable (index.html) — otimização futura
- [ ] MED-2: Debounce na busca global (index.html) — otimização futura
- [ ] MED-3: Remover marcador antigo ao substituir duplicata (index.html) — otimização futura
- [ ] MED-5: Não re-attach event listeners em resetAllMaps (analysis.html) — otimização futura
- [ ] MED-7: DocumentFragment para renderCards (investment.html) — otimização futura
- [ ] MED-8: Validação de campos de cálculo (investment.html) — otimização futura
- [ ] MED-13: Corrigir lógica de extração em getPutnamZoning (api-integrations.js) — otimização futura
- [ ] MED-14: Refatorar usage check duplicado (rentcastProvider.js) — otimização futura
- [ ] MED-16: Async I/O no rentcastProvider.js — otimização futura
- [ ] MED-17: textContent em renderError (property-analysis-widget.js) — otimização futura
- [ ] MED-20: Corrigir middleware de timeout (security.js) — otimização futura
- [ ] MED-21: Refatorar código repetitivo de API keys (settings.html) — otimização futura
- [ ] MED-24: Externalizar limites hardcoded (audit.js) — otimização futura

## v5.1 — Auto-Analyze Batch on Tela 2 Load

- [x] Ao abrir Tela 2 via "Analisar Selecionadas", disparar análise automática de TODAS as propriedades em batch — IMPLEMENTADO v5.1
- [x] Mostrar progresso (ex: "Analisando 3/5...") — IMPLEMENTADO v5.1 (barra de progresso + tempo estimado)
- [x] Manter botão "Re-analisar" para forçar nova consulta manual — IMPLEMENTADO v5.1
- [x] Resultados aparecem prontos para revisar (Aprovar/Rejeitar) — IMPLEMENTADO v5.1
- [x] Persistir resultados do batch analysis por propriedade (em memória/objeto) — IMPLEMENTADO v5.1
- [x] Ao navegar (Anterior/Próxima), restaurar resultados detalhados no widget (FEMA, Wetlands, Zoning, Land Use com semáforos) — IMPLEMENTADO v5.1
- [x] Não chamar API de novo se já tem resultado salvo do batch — IMPLEMENTADO v5.1

## v5.2 — UI Adjustments
- [ ] Mover contador de progresso ("Progresso: X de Y" + barra) para ACIMA da sidebar "Ações Rápidas" (Deletar/Aprovar/Anterior/Próxima) — atualmente está ao lado, mover para cima da segunda imagem (sidebar)
- [x] Fix BUG-1: Race condition — adicionar flag batchRunning para evitar auto-análise duplicada na prop 0 — CORRIGIDO v5-basic

## v5.2 — Research Links
- [x] Criar módulo county-links.js (fetch Google Sheets API pública + cache 24h localStorage) — IMPLEMENTADO v5.2
- [x] Criar módulo research-links.js (URL builders para todos os tipos de link + owner name parser) — IMPLEMENTADO v5.2
- [x] Criar mapeamento de state IDs para Legacy.com (50 estados) — IMPLEMENTADO v5.2
- [x] Implementar seção "Research Links" colapsável na Tela 2 (County Links, Owner Research, Skip Trace, Property Research, Comps) — IMPLEMENTADO v5.2
- [x] Implementar seção "Final Due Diligence" separada na Tela 3 (Clerks Office, Code Enforcement + checklist pré-leilão) — IMPLEMENTADO v5.2
- [x] Testar fluxo end-to-end com CSV Pasco — TESTADO v5.2 (Clerks=pascoclerkofcourt.org, Code=pascofl.gov/code-enforcement)

## v5.3 — UI: Seções colapsáveis (accordion) na Tela 2
- [x] Tornar "Análise Geográfica e Ambiental" colapsável — IMPLEMENTADO v5.3
- [x] Tornar "Análise de Construções (OpenStreetMap)" colapsável — IMPLEMENTADO v5.3
- [x] Tornar "Análise Demográfica (Census Bureau)" colapsável — IMPLEMENTADO v5.3
- [x] Tornar "Histórico de Análises" colapsável — IMPLEMENTADO v5.3
- [x] Batch Analysis Completo já tem botão Fechar (não precisa accordion) — OK v5.3
- [x] Remover seção "Research Comparables" do accordion da Tela 2 — IMPLEMENTADO v5.3
- [x] Adicionar seção "Research Comparables" na Tela 3 como seção própria — IMPLEMENTADO v5.3

## v5.3 — UI: Reorganização e seções colapsáveis na Tela 3
- [x] Renomear "Dados do Investidor" para "Custos da Propriedade" — IMPLEMENTADO v5.3
- [x] Tornar todas as seções da Tela 3 colapsáveis (accordion) — IMPLEMENTADO v5.3
- [x] Reordenar seções: Custos → Max Bid → Comps → Research Comparables → Notas → Due Diligence — IMPLEMENTADO v5.3
- [x] Final Due Diligence é a última seção do card — IMPLEMENTADO v5.3
- [x] "Dados da Propriedade" sempre visível (sem accordion) — IMPLEMENTADO v5.3

## v6-basic — Auditoria Completa (15 arquivos, 21 Feb 2026)

### CRITICAL (3 issues — corrigir antes de produção)
- [ ] CRIT-1: `property-analysis-widget.js` L639 — `calculateRiskAssessment` crash se `data.wetlands` ou `data.fema` forem null — adicionar null checks
- [ ] CRIT-2: `security.js` L213 — `secureEndpoint` default OFFLINE_MODE=true desabilita auth silenciosamente — trocar default para false
- [ ] CRIT-3: `investment.html` L2006 — Senha do Google Sheets salva em localStorage (XSS risk) — mover para sessionStorage ou pedir a cada sessão

### HIGH (12 issues — priorizar)
- [ ] HIGH-1: `property-analysis-widget.js` L431 — `renderWetlandsFound` acessa `wetlands.wetlands.length` mas estrutura correta é `wetlands.features.length`
- [ ] HIGH-2: `property-analysis-widget.js` L586 — `renderZoning` usa `.map()` em objeto (deveria ser `Object.keys().map()`)
- [ ] HIGH-3: `property-analysis-widget.js` L741 — `getLandUseRisk` lógica invertida: CONSERVATION=baixo risco, RESIDENTIAL=alto risco (deveria ser o contrário)
- [ ] HIGH-4: `security.js` L89 — `requestTimeout` chama `next()` antes de configurar timeout — pode crashar ao setar headers em resposta já enviada
- [ ] HIGH-5: `security.js` L183 — `timingSafeEqual` só compara se lengths são iguais — vaza informação do tamanho do token
- [ ] HIGH-6: `server.js` L797 — `/api/comps/cache-clear` protegido apenas por header `x-admin-key` — inseguro
- [ ] HIGH-7: `server.js` L225 — `/api/google-maps-loader` expõe GOOGLE_MAPS_API_KEY ao client — considerar proxy
- [ ] HIGH-8: `api-integrations.js` L841 — `overallStatus` substitui status de risco alto por genérico "AVALIAR" — refatorar lógica de prioridade
- [ ] HIGH-9: `county-links.js` L89 — Title-case falha em nomes hifenizados (MIAMI-DADE → Miami-dade em vez de Miami-Dade)
- [ ] HIGH-10: `index.html` — Múltiplos usos de innerHTML sem sanitização (XSS via CSV/KML malicioso)
- [ ] HIGH-11: `analysis.html` — Lógica inteira em inline script (>3000 linhas) — separar em arquivos .js
- [ ] HIGH-12: `rentcastProvider.js` L92,192 — writeFileSync/renameSync bloqueiam event loop — usar fs.promises

### MEDIUM (20 issues — melhorias incrementais)
- [ ] MED-A1: `api-integrations.js` L72 — `rejectUnauthorized: false` desabilita validação SSL
- [ ] MED-A2: `api-integrations.js` L668 — `getGenericRegistryZoning` usa "primeiro ganha" — pode perder dados de overlay
- [ ] MED-A3: `server.js` L125 — `loadMockData` usa readFileSync — trocar por async
- [ ] MED-A4: `server.js` L164 — `/api/status` retorna OFFLINE_MODE duplicado (upper e lower case)
- [ ] MED-A5: `security.js` L60 — `requestSizeLimit` só checa content-length header — bypass via chunked encoding
- [ ] MED-A6: `security.js` L136 — `rejectUserSuppliedUrls` usa blacklist — trocar por allowlist
- [ ] MED-A7: `validator.js` L59 — `ajv.compile(schema)` recompila a cada chamada — cachear validator
- [ ] MED-A8: `validator.js` L97 — monkey-patch em `res.json` — refatorar
- [ ] MED-A9: `audit.js` L84 — monkey-patch em `res.json` — refatorar
- [ ] MED-A10: `research-links.js` L31 — `parseOwnerName` não lida com partículas (de la, van der)
- [ ] MED-A11: `research-links.js` L51 — Nome de parte única seta first=last (incorreto)
- [ ] MED-A12: `research-links.js` L121,136,183 — Slug agressivo remove apóstrofos — pode gerar URLs inválidas
- [ ] MED-A13: `county-links.js` L172,200,222 — `getByCounty`/`getCountyList` chamam `getAll` toda vez — redundante
- [ ] MED-A14: `county-links.js` L23 — Sheet ID e Tab hardcoded — externalizar config
- [ ] MED-A15: `index.html` — Uso de alert()/confirm() — trocar por modais
- [ ] MED-A16: `index.html` L1086 — Race condition no carregamento de múltiplos KML
- [ ] MED-A17: `analysis.html` — Variáveis globais extensivas (window.properties, window.currentIndex)
- [ ] MED-A18: `investment.html` L2106 — fetch Google Sheets com `mode: 'no-cors'` — impede error handling
- [ ] MED-A19: `rentcastProvider.js` L778 — Lógica de OFFLINE_MODE não convencional (undefined=true)
- [ ] MED-A20: `wetlands-local.js` L150 — parseFloat duplo redundante

### LOW (18 issues — otimização futura)
- [ ] LOW-A1: `utils.js` — Funções no window global — usar namespace GTSearch.utils
- [ ] LOW-A2: `utils.js` L56 — formatDollar usa parseFloat permissivo
- [ ] LOW-A3: `research-links.js` L94 — Estado 'FL' hardcoded
- [ ] LOW-A4: `research-links.js` L156 — Buffer EPA hardcoded (0.01)
- [ ] LOW-A5: `research-links.js` L102,107,149,168 — Funções não utilizadas (dead code)
- [ ] LOW-A6: `florida-counties-api.js` L64-77 — Lógica ST/SAINT frágil
- [ ] LOW-A7: `florida-counties-api.js` L51 — Múltiplos requests concorrentes possíveis
- [ ] LOW-A8: `index.html` — Variáveis globais extensivas — encapsular em objeto
- [ ] LOW-A9: `index.html` L523 — Busca global sem debounce
- [ ] LOW-A10: `analysis.html` — console.log em produção — remover
- [ ] LOW-A11: `analysis.html` L1139 — Uso de alert()
- [ ] LOW-A12: `investment.html` L236 — Script inline >2400 linhas — separar em arquivo .js
- [ ] LOW-A13: `audit.js` L124 — readAuditLog lê arquivo inteiro em memória (até 5MB)
- [ ] LOW-A14: `rentcastProvider.js` L250 — enforceCacheLimit sort inteiro a cada write
- [ ] LOW-A15: `rentcastProvider.js` L96,197 — Silent catch em cleanup de .tmp
- [ ] LOW-A16: `wetlands-local.js` L26 — classifyRisk só usa 3 chars do NWI code
- [ ] LOW-A17: `wetlands-local.js` L248 — Sem retry em falha de API
- [ ] LOW-A18: `wetlands-local.js` L29-43 — Regras de risco hardcoded — externalizar config
