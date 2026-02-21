# Auditoria Completa — GTSearch v4.9.2

> Data: 2026-02-21 | 12 arquivos auditados | 17.622 linhas de código

## Resumo Executivo

| Arquivo | Saúde | Critical | High | Medium | Low | Info | Total |
|---------|-------|----------|------|--------|-----|------|-------|
| **settings.html** | CRITICAL | 1 | 1 | 2 | 2 | 2 | 8 |
| **analysis.html** | POOR | 0 | 2 | 2 | 2 | 1 | 7 |
| **api-integrations.js** | POOR | 1 | 2 | 3 | 1 | 1 | 8 |
| **audit.js** | POOR | 0 | 3 | 1 | 1 | 0 | 5 |
| **index.html** | FAIR | 0 | 2 | 4 | 5 | 1 | 13 |
| **investment.html** | FAIR | 0 | 1 | 2 | 2 | 1 | 6 |
| **rentcastProvider.js** | FAIR | 0 | 1 | 3 | 2 | 1 | 7 |
| **property-analysis-widget.js** | FAIR | 0 | 1 | 3 | 2 | 2 | 8 |
| **security.js** | FAIR | 0 | 1 | 1 | 1 | 1 | 4 |
| **server.js** | FAIR | 0 | 1 | 2 | 2 | 2 | 7 |
| **zoning_registry.json** | POOR | 2 | 1 | 1 | 1 | 1 | 6 |
| **logger.js** | GOOD | 0 | 0 | 1 | 1 | 3 | 5 |
| **TOTAL** | — | **4** | **16** | **25** | **22** | **16** | **84** |

---

## Classificação por Categoria

| Categoria | Critical | High | Medium | Low | Total |
|-----------|----------|------|--------|-----|-------|
| **SECURITY** | 3 | 10 | 3 | 2 | 18 |
| **PERFORMANCE** | 0 | 3 | 5 | 4 | 12 |
| **BUG** | 1 | 2 | 4 | 3 | 10 |
| **CODE QUALITY** | 0 | 1 | 10 | 8 | 19 |
| **UX** | 0 | 0 | 3 | 2 | 5 |

---

## CRITICAL (4 itens) — Corrigir Imediatamente

### CRIT-1: API Keys no Frontend (settings.html)
**Severidade:** CRITICAL | **Categoria:** SECURITY
A aplicação armazena API keys (OpenAI, Gemini, Google Maps, etc.) no `localStorage` do browser e faz chamadas diretas do client-side. Qualquer pessoa com acesso ao browser pode roubar as chaves.
**Fix:** Mover todas as chamadas de API para o backend (server.js). O frontend deve chamar endpoints do servidor, que faz as chamadas autenticadas. Keys nunca devem estar no client.

### CRIT-2: SSL/TLS Desabilitado no zoning_registry.json
**Severidade:** CRITICAL | **Categoria:** SECURITY
Vários condados têm `ssl_reject_unauthorized: false` ou `ssl_bypass: true`, desabilitando validação de certificados. Vulnerável a Man-in-the-Middle.
**Fix:** Adicionar certificados específicos ao trust store em vez de desabilitar SSL globalmente. Para servidores com self-signed certs (Volusia, Marion), aceitar apenas o certificado específico.

### CRIT-3: Estrutura Inconsistente no zoning_registry.json
**Severidade:** CRITICAL | **Categoria:** CODE QUALITY
A estrutura de dados varia entre condados (Hillsborough nesta FLU dentro de zoning, Polk tem FLU separado, etc.). Isso força lógica complexa e frágil no código.
**Fix:** Padronizar o schema — todos os condados devem ter `zoning` e `flu` como objetos opcionais de nível superior.

### CRIT-4: Import Dinâmico do módulo https (api-integrations.js)
**Severidade:** CRITICAL | **Categoria:** SECURITY/PERFORMANCE
`new (await import('https')).Agent(...)` é chamado dentro de `safeArcGISQuery` a cada requisição. Import dinâmico em hot path + desabilita SSL.
**Fix:** Import estático no topo do arquivo: `import https from 'https';`

---

## HIGH (16 itens) — Corrigir Antes de Produção

### SEC-H1: XSS via innerHTML (index.html, analysis.html, investment.html, property-analysis-widget.js)
Dados de CSV/API são renderizados via `innerHTML` sem sanitização. Um CSV malicioso pode executar scripts.
**Arquivos afetados:** index.html (6 ocorrências), analysis.html (múltiplas funções), investment.html (linhas 529, 549, 634), property-analysis-widget.js (renderError)
**Fix:** Usar `textContent` para texto puro. Para HTML necessário, usar DOMPurify ou função de escape.

### SEC-H2: Injeção HTML via data-property (index.html)
JSON serializado em atributo `data-property` com escape insuficiente (só apóstrofo). Aspas duplas podem quebrar o atributo.
**Fix:** Usar `encodeURIComponent()` ou `btoa()` para serializar, e decodificar ao ler.

### SEC-H3: Google Maps API Key exposta via endpoint (server.js)
Endpoint `/api/google-maps-key` retorna a key diretamente ao client.
**Fix:** Remover endpoint. Usar apenas o proxy `/api/google-maps` que já existe.

### SEC-H4: Decriptação de API Keys no client-side (analysis.html)
Census API key é decriptada no browser. Lógica de decriptação é reversível.
**Fix:** Mover para backend proxy.

### SEC-H5: Timing attack na comparação de token admin (security.js)
Comparação com `!==` é vulnerável a timing attacks.
**Fix:** Usar `crypto.timingSafeEqual()`.

### PERF-H1: I/O síncrono no audit.js (3 ocorrências)
`fs.appendFileSync`, `fs.readFileSync` bloqueiam o event loop.
**Fix:** Usar versões assíncronas ou biblioteca de logging (Winston/Pino).

### PERF-H2: Leitura de log inteiro em memória (audit.js)
`readAuditLog` carrega todo o arquivo. Se crescer para GB, crash.
**Fix:** Usar `fs.createReadStream` + `readline`.

### BUG-H1: parseInt sem radix (property-analysis-widget.js)
`parseInt(data.landUse.code)` sem radix pode interpretar "08" como octal.
**Fix:** `parseInt(data.landUse.code, 10)`.

### BUG-H2: Middleware de auditoria incompleto (audit.js)
Monkey-patch de `res.json` não captura `res.send`, `res.end`, streaming.
**Fix:** Usar evento `res.on('finish', ...)`.

### PERF-H3: Promise.allSettled redundante (api-integrations.js)
Wrapper desnecessário em chamadas que já tratam erros internamente.
**Fix:** Chamar diretamente `await getGenericRegistryZoning(...)`.

### SEC-H6: Hardcoded API endpoints (settings.html)
URLs de APIs hardcoded no JavaScript do frontend.
**Fix:** Centralizar em configuração no servidor.

---

## MEDIUM (25 itens) — Corrigir no Próximo Sprint

| ID | Arquivo | Descrição |
|----|---------|-----------|
| MED-1 | index.html | DOM manipulation excessiva em loops (populateTable reconstrói tudo) |
| MED-2 | index.html | Falta debounce na busca global (keyup sem delay) |
| MED-3 | index.html | Propriedades duplicadas — marcador antigo não removido do mapa |
| MED-4 | index.html | Lógica de negócio complexa misturada com apresentação |
| MED-5 | analysis.html | Event listeners re-attached em resetAllMaps (duplicação) |
| MED-6 | analysis.html | innerHTML com dados de API sem sanitização |
| MED-7 | investment.html | renderCards reconstrói tudo (usar DocumentFragment) |
| MED-8 | investment.html | Campos de cálculo sem validação (NaN possível) |
| MED-9 | server.js | fs.readFileSync em loadMockData bloqueia event loop |
| MED-10 | server.js | Endpoints de mock redundantes (mesmo padrão repetido) |
| MED-11 | api-integrations.js | Cache sem política de remoção periódica (memory leak) |
| MED-12 | api-integrations.js | getStatewideFLU chamado 2x seguidas (duplicação) |
| MED-13 | api-integrations.js | Lógica de extração quebrada em getPutnamZoning |
| MED-14 | rentcastProvider.js | Lógica de usage check duplicada (DRY violation) |
| MED-15 | rentcastProvider.js | Race condition em I/O síncrono do cache |
| MED-16 | rentcastProvider.js | fs.writeFileSync/readFileSync bloqueiam event loop |
| MED-17 | property-analysis-widget.js | XSS em renderError via innerHTML |
| MED-18 | property-analysis-widget.js | Render logic com múltiplos exit points |
| MED-19 | property-analysis-widget.js | Traduções hardcoded (não escalável) |
| MED-20 | security.js | Headers already sent no middleware de timeout |
| MED-21 | settings.html | Código repetitivo para salvar/testar API keys |
| MED-22 | settings.html | innerHTML com dados dinâmicos |
| MED-23 | zoning_registry.json | Layers ambíguos sem fallback_order |
| MED-24 | audit.js | Limites hardcoded (100, 10000) |
| MED-25 | logger.js | Falta rotação de logs |

---

## Priorização — O Que Corrigir e Quando

### Sprint 1 (Urgente — Segurança)
1. **CRIT-1**: Mover API keys para backend (settings.html → server.js)
2. **SEC-H3**: Remover endpoint `/api/google-maps-key`
3. **CRIT-4**: Import estático do módulo https
4. **SEC-H1**: Adicionar DOMPurify ou escapeHTML() nos 4 arquivos HTML
5. **SEC-H2**: Corrigir serialização de data-property

### Sprint 2 (Performance — Impacto no Uso Diário)
6. **PERF-H1/H2**: Converter audit.js para I/O assíncrono
7. **MED-2**: Adicionar debounce na busca global
8. **MED-1/7**: Usar DocumentFragment para renderização de tabelas/cards
9. **BUG-H1**: parseInt com radix 10

### Sprint 3 (Qualidade — Manutenibilidade)
10. **CRIT-2/3**: Padronizar zoning_registry.json
11. **MED-14**: Refatorar usage check no rentcastProvider
12. **MED-12/13**: Corrigir duplicação e lógica em api-integrations.js
13. **MED-10**: Consolidar endpoints de mock

### Pode Esperar (Low/Info)
- Substituir `confirm()` por modais customizados
- Event delegation na tabela
- Externalizar constantes hardcoded
- Rotação de logs

---

## Nota sobre Falsos Positivos

Alguns itens reportados são **aceitáveis para o contexto** do GTSearch (ferramenta desktop/local, não SaaS público):

1. **SSL bypass para servidores GIS de condados**: Necessário porque muitos condados usam self-signed certs. O risco é baixo (dados públicos de zoning, não dados sensíveis).
2. **localStorage para dados**: Aceitável para ferramenta local. Migrar para IndexedDB quando encher.
3. **fs.readFileSync no startup**: Aceitável no boot (1x), problemático em hot paths.
4. **confirm() nativo**: Funcional, apenas UX inferior.

---

## Métricas Gerais

| Métrica | Valor |
|---------|-------|
| Total de linhas | 17.622 |
| Arquivos auditados | 12 |
| Findings totais | 84 |
| Density (findings/1000 linhas) | 4.8 |
| Saúde geral | **FAIR** (funcional, mas precisa de hardening de segurança) |
