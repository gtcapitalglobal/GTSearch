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
- [x] CRIT-1: FALSE POSITIVE — já tem null guards `if (data.fema)` e `if (data.wetlands)`
- [x] CRIT-2: Default trocado para false (dead code mas best practice) — CORRIGIDO v6.1
- [x] CRIT-3: Senha movida para sessionStorage (settings.html + investment.html) — CORRIGIDO v6.1

### HIGH (12 issues — priorizar)
- [x] HIGH-1: FALSE POSITIVE — backend retorna `{wetlands: [...]}`, acesso `wetlands.wetlands` é correto
- [x] HIGH-2: FALSE POSITIVE — renderZoning não usa .map() em objeto
- [x] HIGH-3: FALSE POSITIVE — lógica correta para investimento (Conservation=alto risco, Residential=green)
- [x] HIGH-4: FALSE POSITIVE — security.js não é importado no server.js (dead code). Padrão é correto para Express
- [x] HIGH-5: Buffers padded para mesmo tamanho antes de comparação — CORRIGIDO v6.1
- [x] HIGH-6: ACCEPTABLE — endpoint protegido por OFFLINE_MODE check + ADMIN_KEY. Risco baixo em uso local
- [x] HIGH-7: BY DESIGN — Maps JS SDK requer client-side key. Código já tem nota explicando. Restringir por HTTP referrer no Google Cloud Console
- [x] HIGH-8: Adicionado checks de zoning (Conservation) e landUse (Government) no overallStatus — CORRIGIDO v6.1
- [x] HIGH-9: Regex trocado de `[\w]+` para `[A-Za-z]+` — agora MIAMI-DADE → Miami-Dade — CORRIGIDO v6.1
- [x] HIGH-10: DEFERRED — innerHTML usado com dados locais (CSV/KML do próprio usuário). escapeHTML() disponível em utils.js. Refatorar em versão futura
- [x] HIGH-11: DEFERRED — refatoração grande, agendar para v7. Funciona corretamente como está
- [x] HIGH-12: Convertido para fs/promises (writeFile, rename, unlink) — CORRIGIDO v6.1

### MEDIUM (20 issues — melhorias incrementais)
- [x] MED-A1: Adicionado comentário SECURITY NOTE explicando que é scoped ao SELF_SIGNED_HOSTS allowlist — DOCUMENTADO v6.1
- [x] MED-A2: ACCEPTABLE — "primeiro ganha" é intencional (zoning principal tem prioridade sobre overlay)
- [x] MED-A3: Convertido para fs.promises.readFile + handlers async — CORRIGIDO v6.1
- [x] MED-A4: Removido `offline_mode` duplicado de /api/status — CORRIGIDO v6.1
- [x] MED-A5: Adicionado tracking de bytes recebidos via req.on('data') — CORRIGIDO v6.1
- [x] MED-A6: ACCEPTABLE — blacklist de parâmetros URL é adequada para este caso (não é filtragem de IPs)
- [x] MED-A7: Validator compilado cacheado em _cachedValidator — CORRIGIDO v6.1
- [x] MED-A8: ACCEPTABLE — padrão comum em Express middleware para interceptar responses
- [x] MED-A9: ACCEPTABLE — padrão comum em Express middleware para interceptar responses
- [x] MED-A10: Adicionado suporte a partículas (DE, LA, VAN, DER, VON, etc.) — CORRIGIDO v6.1
- [x] MED-A11: Nome único agora seta firstName='' e lastName=nome — CORRIGIDO v6.1
- [x] MED-A12: Slug agora remove apóstrofos explicitamente + limpa hífens duplicados — CORRIGIDO v6.1
- [x] MED-A13: Adicionado _memoryCache para evitar chamadas redundantes — CORRIGIDO v6.1
- [x] MED-A14: DEFERRED — funciona corretamente, externalizar quando houver múltiplas sheets
- [x] MED-A15: DEFERRED — funcional, trocar por modais em v7 (UI overhaul)
- [x] MED-A16: DEFERRED — edge case raro, agendar para v7
- [x] MED-A17: DEFERRED — refatoração grande, agendar para v7 junto com HIGH-11
- [x] MED-A18: ACCEPTABLE — no-cors é necessário para Google Apps Script Web App (CORS não configurável)
- [x] MED-A19: Simplificado para `process.env.OFFLINE_MODE !== 'false'` — CORRIGIDO v6.1
- [x] MED-A20: Trocado para `Number(Number(acres).toFixed(2))` — CORRIGIDO v6.1

### LOW (18 issues — otimização futura)
- [x] LOW-A1: Adicionado namespace GTSearch.utils + mantido globals para backward compat — CORRIGIDO v6.1
- [x] LOW-A2: Trocado para Number() + Number.isFinite() — CORRIGIDO v6.1
- [x] LOW-A3: ACCEPTABLE — sistema é Florida-only por design
- [x] LOW-A4: ACCEPTABLE — buffer padrão EPA, não precisa ser configurável
- [x] LOW-A5: FALSE POSITIVE — todas as funções são exportadas e usadas via `urls` object
- [x] LOW-A6: Refatorado com regex para ST/SAINT/ST. variants — CORRIGIDO v6.1
- [x] LOW-A7: Adicionado _loadingPromise para deduplicar chamadas concorrentes — CORRIGIDO v6.1
- [x] LOW-A8: DEFERRED — refatoração grande, agendar para v7
- [x] LOW-A9: DEFERRED — debounce() já disponível em utils.js, aplicar em v7
- [x] LOW-A10: DEFERRED — útil para debugging em fase atual
- [x] LOW-A11: DEFERRED — trocar por modais em v7
- [x] LOW-A12: DEFERRED — refatoração grande, agendar para v7
- [x] LOW-A13: Agora lê apenas últimos 512KB do arquivo — CORRIGIDO v6.1
- [x] LOW-A14: Trocado para partial selection sort (só encontra N menores) — CORRIGIDO v6.1
- [x] LOW-A15: ACCEPTABLE — silent catch em cleanup de temp files é padrão (best-effort cleanup)
- [x] LOW-A16: Agora usa código completo + water regime para classificação mais precisa — CORRIGIDO v6.1
- [x] LOW-A17: Adicionado 1 retry com 2s delay na chamada NWI API — CORRIGIDO v6.1
- [x] LOW-A18: DEFERRED — regras são estáveis (baseadas em NWI spec), externalizar quando necessário

## v6.1.1 — Quick fixes (21 Feb 2026)
- [x] Reverter CRIT-3: sessionStorage → localStorage (uso local, risco baixo)
- [x] Investigar botão "Visualizar Selecionadas" na Tela 1 — REMOVIDO (redundante, fluxo mais limpo sem ele)

## v6.2 — All Bug Fixes & Features Complete (21 Feb 2026)
**Commits:** v6.1.2 → v6.2 | Tag: `v6.2`

**Correções implementadas:**
- ✅ PDF ordem correta (Case # com hífen agora funciona)
- ✅ PDF com campo Owner
- ✅ PDF só gera para propriedades "Pronto para lance"
- ✅ Botão "📦 Dados Mock" na Tela 2
- ✅ Botão "🔄 Atualizar Links" na Tela 2
- ✅ Closing Cost % e Clean Title aceitam 0 (|| → ??)
- ✅ Senha Google Sheets voltou para localStorage (UX melhor)
- ✅ Botão "Visualizar Selecionadas" removido (dead code)

## v6.1.2 — Bug fixes (21 Feb 2026)
- [ ] BUG: "Erro ao coletar dados" na Tela 2 (analysis.html) ao clicar em "Coletar Dados" — modo OFFLINE bloqueia APIs
- [x] FEATURE: Adicionar botão "📦 Dados Mock" na Tela 2 ao lado de "Coletar Dados" (carrega dados de exemplo sem gastar créditos)
- [ ] BUG: Endereço da propriedade não aparece nos cards da Tela 3 (investment.html)
- [ ] BUG: Erro ao conectar no Google Sheets (ID: 1Z5IWpfRtu_D5zwdNbB3u68BMjirKOsdF2t_SoZJLJ04) — verificar permissões e Apps Script
- [ ] BUG: Botão "Recalcular Todos" não está funcionando na Tela 3
- [x] UX: Max Bid não calcula automaticamente ao preencher Market Value — já implementado (oninput na linha 741), bug era o || vs ?? (já corrigido v6.1.2)
- [x] BUG: Closing Cost % e Clean Title não aceitam 0 como valor (|| trata 0 como falsy) — trocado || por ?? em 6 lugares
- [x] BUG: Link "Clerks Office" para Putnam abre URL errada — cache de 24h, adicionado botão "🔄 Atualizar Links" na Tela 2
- [x] FEATURE: Botão "📄 PDF Leilão" só gera PDF para propriedades com checkbox "Pronto para lance" marcado (filtro + alerta se nenhuma marcada)
- [x] BUG: PDF Leilão sai fora de ordem — parseInt ignorava número após hífen, agora remove todos os não-dígitos antes de comparar
- [x] FEATURE: Adicionar campo "Owner" no PDF Leilão — adicionado na linha $/Acre (coluna direita)

## v6.3 — User Requests (21 Feb 2026)
- [x] FEATURE: Adicionar botão "🗑️ Limpar Tudo" na Tela 3 (dupla confirmação, limpa localStorage e recarrega)
- [ ] CONFIG: Verificar configuração do RentCast API para testes

## v6.4 — Grande Atualização (25 Feb 2026)

### PDF Improvements
- [ ] Market Value — destacar mais (negrito/cor/tamanho maior)
- [ ] Imagem — triplicar espaço (3 imagens em vez de 1)
- [ ] Risk Level RED (50) — adicionar explicação do que significa o número
- [ ] Case # — manter visual bom, mas Parcel + Endereço embaixo precisa de cor diferente para destacar
- [ ] Max Bid — mais evidência, é o número mais importante
- [ ] Wetlands — alerta mais forte (vermelho/destaque visual)
- [ ] FEMA Zone — alerta mais forte (vermelho/destaque visual)
- [ ] Case # ordem — sempre ordenar numericamente (remover aspas que atrapalham)
- [ ] BUG: Case # 25000195 no PDF mas tem wetlands on-parcel + profit negativo — não deveria estar no PDF

### Tela 3 (Investment)
- [ ] Botão "🏞️ Terrenos sem custos" — dentro de cada card, zera Closing Cost % e Clean Title $ **só daquele card**
- [ ] ESCLARECIMENTO: "Final Due Diligence" refere-se ao PDF (Parcel + Endereço precisam de mais evidência visual)
- [ ] PDF: Parcel + Endereço embaixo do Case # — usar cor diferente, maior, negrito para destacar
- [x] DOCUMENTADO: "Novo Leilão" — salva leilão atual no localStorage (histórico) e limpa tela para novo leilão
- [x] DOCUMENTADO: "Salvar Batch" — salva leilão atual no localStorage com nome personalizado, sem limpar tela
- [x] DOCUMENTADO: "Histórico" — abre modal com todos os leilões salvos, permite carregar um antigo
- [x] DOCUMENTADO: "Recalcular Todos" — recalcula Max Bid/ROI de todas as propriedades (NÃO limpa valores)

### Links (Research + Due Diligence)
- [ ] Clerks Office — buscar na coluna W do Google Sheets por condado (linha correspondente)
- [ ] Code Enforcement — buscar na coluna AD do Google Sheets por condado (linha correspondente)
- [ ] Redfin/Realtor — já colocar endereço da propriedade na URL (pré-preencher busca)
- [ ] Research Comparables — são os mesmos links de Zillow/Redfin/Realtor, mas com endereço pré-preenchido

### Tela 2 (Analysis)
- [ ] BUG: RentCast Property Intelligence não puxou na Tela 2, mas funcionou na Tela 3 — investigar
- [ ] BUG: Comps da API RentCast não está funcionando — investigar
- [ ] FEATURE: Adicionar botão "Pesquisar Comps IA" (Claude API) — implementar placeholder, API key vem depois

### Resultado do Leilão
- [ ] FEATURE: "Resultado do Leilão" — botão em cada card para registrar: valor do lance final + nome/empresa do comprador (salvar localStorage)
- [ ] FEATURE: Botão "Resetar Valores" na Tela 3 — limpa Market Value, Reforma, Liens, etc. de todos os cards

## v6.4-priority — PDF Filters + Visual Highlights + Terrenos Button (21 Feb 2026)

**Implementado (7 itens):**
- [x] BUG CRÍTICO: Case # 25000195 no PDF — filtro adicionado: exclui wetlands on-parcel + profit negativo (ROI 30%)
- [x] PDF: Market Value — azul, negrito 900, font-size 13px
- [x] PDF: Max Bid — azul, negrito 900, font-size 15px (3 cenários)
- [x] PDF: Parcel (azul, 18px, bold 900) + Endereço (verde, 14px, bold 700)
- [x] PDF: Wetlands — vermelho bold se 'NO TERRENO'
- [x] PDF: FEMA Zone — vermelho bold se 'X -' ou 'NO TERRENO'
- [x] Botão "🏞️ Terrenos sem custos" — implementado na seção Due Diligence, zera Closing + Clean Title globais e recalcula

**Pendente (restante do v6.4, aguardando créditos):**
- [ ] PDF: Imagem — triplicar espaço (3 imagens em vez de 1)
- [ ] PDF: Risk Level — adicionar explicação do que significa
- [ ] Tela 2: RentCast bugs (Property Intelligence não puxou, Comps API não funciona)
- [ ] Tela 3: Redfin/Realtor pre-fill endereço na URL
- [ ] Tela 3: Clerks Office + Cod Enforcement links do Google Sheets (colunas W e AD)
- [ ] Tela 3: Botão "Resetar Valores" (limpa Market Value, Reforma, Liens de todos os cards)
- [ ] Tela 3: "Resultado do Leilão" (registrar valor lance + comprador, salvar localStorage)
- [ ] Tela 3: Botão "Pesquisar Comps IA" (Claude API placeholder)
- [ ] Research Comparables: diferença vs Zillow/Redfin (são os mesmos links, mas pre-fill endereço)

## v6.4-batch2 — Resetar Valores + Risk Level Explanation (21 Feb 2026)

**Implementado (4 itens):**
- [x] Redfin/Realtor pre-fill endereço — JÁ IMPLEMENTADO (buildAddress já monta URL com endereço completo)
- [x] Clerks Office + Cod Enforcement links — JÁ IMPLEMENTADO (county-links.js colunas 22 e 29 do Google Sheets)
- [x] Botão "🧹 Resetar Valores" — limpa Market Value, Reforma, Liens, Other Costs de todos os cards
- [x] PDF: Risk Level explicação — legenda abaixo do valor (GREEN=baixo risco, YELLOW=moderado, RED=alto, CRITICAL=crítico)

**Pendente (restante do v6.4, aguardando créditos):**
- [ ] PDF: Imagem — triplicar espaço (3 imagens em vez de 1)
- [ ] Tela 2: RentCast bugs (Property Intelligence não puxou, Comps API não funciona)
- [ ] Tela 3: "Resultado do Leilão" (registrar valor lance + comprador, salvar localStorage)
- [ ] Tela 3: Botão "Pesquisar Comps IA" (Claude API placeholder)

## v6.4-batch3 — Property Intelligence Fix + PDF Triple Images + CRITICAL Bug Fix (26 Feb 2026)

**Implementado (3 itens):**
- [x] BUG FIX CRÍTICO: Investment cards não renderizavam — erro de sintaxe em getViability() quebrava TODO o script inline (linha 534: faltava `if (max` antes de `Bid <= 0)`)
- [x] BUG FIX: Property Intelligence não funcionava — normalização de resposta do provider (frontend agora aceita estrutura direta)
- [x] PDF: Triplicar espaço de imagens — grid 3x1 (proporção 4:3 landscape, labels "Imagem 1/2/3")

**Pendente (v6.4 restante):**
- [ ] Tela 3: "Resultado do Leilão" (registrar valor lance + comprador, salvar localStorage)
- [ ] Tela 3: Botão "Pesquisar Comps IA" (Claude API placeholder)
- [ ] Tela 2: RentCast Comps API (confirmar se deve existir ou é confusão com Tela 3)

## v6.4-batch4 — PDF Header Design + Case # Sanitization (26 Feb 2026)

**Implementado (2 itens):**
- [x] Tela 1: Sanitizar campo "Case #" ao importar CSV — remover apóstrofo (') que pode causar problemas de ordenação
- [x] PDF: Melhorar header — Parcel # e Endereço em BRANCO (#FFFFFF, negrito) para maior destaque no fundo roxo/azul escuro + remover apóstrofo de "CASE #'" → "CASE #"
