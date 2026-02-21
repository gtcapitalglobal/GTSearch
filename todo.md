# GTSearch — TODO (v4.1-basic)

> Atualizado: 2026-02-20 | Baseado na auditoria completa do projeto

---

## ✅ TELA 1 — Search & Import (83%)

- [x] Upload CSV com parsing automático de colunas
- [x] Upload KML com extração de coordenadas
- [x] Mapa interativo com marcadores por propriedade
- [x] Filtro por condado
- [x] Filtro por faixa de acres
- [x] Filtro por Amount Due
- [x] Seleção individual e em massa de propriedades
- [x] Navegação para Tela 2 com propriedades selecionadas
- [x] Exibição de dados básicos (parcel, address, acres, owner)
- [ ] Filtro avançado multi-critério (combinar condado + acres + amount due)
- [ ] Classificação automática A/B/C por scoring
- [x] Ordenação por coluna (acres, amount due, assessed value) — CORRIGIDO v4.2
- [ ] Indicador visual de propriedades já analisadas
- [x] 🐛 BUG: Ordenação por coluna não funciona (clicar nos headers Parcel#, Acres, Type, Name, etc. não ordena) — CORRIGIDO: offset era +1, correto é +3

---

## ✅ TELA 2 — Analysis (71%)

- [x] Análise individual de propriedade
- [x] Análise em batch (todas de uma vez)
- [x] FEMA Flood Zone via API NFHL (zona, subtipo, risco, BFE)
- [x] Wetlands via NWI MapServer (on-property, nearby, sem wetlands)
- [x] Zoning via ArcGIS Registry (13 condados FL, 10 funcionais)
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
- [ ] Expandir zoning para mais condados FL (hoje: 10/67)

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
- [ ] Gráfico comparativo de propriedades
- [ ] Ranking automático por ROI

---

## ✅ BACKEND & SETTINGS (100%)

- [x] 18 endpoints REST (GET/POST)
- [x] Rate limiting (100 req/15min)
- [x] Helmet security headers
- [x] CORS configurado
- [x] Proxy para APIs externas (FEMA, NWI, ArcGIS, FDOR)
- [x] Settings page com API keys + testes
- [x] Google Sheets integration config
- [x] Zoning Registry com 13 condados FL

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
- [ ] Classificação A/B/C automática na Tela 1
- [ ] Comps via Realty Mole (RapidAPI) ou Regrid
- [ ] Link direto para County Clerk (liens)

### Prioridade Média
- [ ] Integração Regrid API (token expirado — renovar)
- [ ] Expandir zoning para mais condados FL
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
| Citrus | ⚠️ | ⚠️ | No registry, sem validação |
| Duval | ⚠️ | ⚠️ | No registry, sem validação |
| Hernando | ✅ | ✅ | Funcional |
| Highlands | ✅ | ✅ | Funcional |
| Hillsborough | ✅ | ✅ | NOVO v4.1 |
| Lake | ⚠️ | ⚠️ | No registry, sem validação |
| Levy | ⚠️ | ⚠️ | No registry, sem validação |
| Marion | ❌ | ❌ | Sem API pública |
| Okeechobee | ⚠️ | ⚠️ | No registry, sem validação |
| Orange | ✅ | ✅ | NOVO v4.1 |
| Pasco | ✅ | ❌ | NOVO v4.1 (zoning only) |
| Polk | ❌ | ✅ | NOVO v4.1 (FLU only) |
| Putnam | ✅ | ✅ | Funcional |
| Seminole | ✅ | ✅ | Funcional |
| St. Johns | ✅ | ✅ | Funcional |
| Volusia | ⚠️ | ⚠️ | No registry, sem validação |

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
- [x] Defaults: 0.5mi raio, 90 dias, tipo Land, dados do CSV
- [x] Filtros editáveis antes de buscar
- [x] Exibir resultado: FMV sugerido + comps + confidence
- [x] Botão "Aceitar FMV" para preencher Market Value com 1 clique
- [x] Contador de uso visível (X/50)
