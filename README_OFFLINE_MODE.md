# 🔒 GT LANDS - OFFLINE MODE

## 📋 O que foi implementado?

Sistema completo de **OFFLINE MODE** para rodar o GTSearch sem APIs e sem custos, com arquitetura preparada para reativar APIs no futuro com segurança.

---

## ✅ PARTE A: OFFLINE MODE

### Flag Global
- ✅ Variável `OFFLINE_MODE` em `.env` (padrão: `true`)
- ✅ Lida automaticamente pelo `server.js`
- ✅ Aviso no console ao iniciar servidor

### Dados Mock
- ✅ Pasta `/mock` com 5 arquivos JSON:
  - `property.sample.json` - Dados básicos de propriedades
  - `flood.sample.json` - Dados de risco de inundação
  - `zoning.sample.json` - Dados de zoneamento
  - `road_access.sample.json` - Dados de acesso rodoviário
  - `redflags.sample.json` - Alertas e problemas
- ✅ `property.schema.json` - Schema padrão (SSOT)

### Endpoints Mock (Sempre Disponíveis)
- `GET /api/mock/property` - Retorna dados mock de propriedade
- `GET /api/mock/flood` - Retorna dados mock de inundação
- `GET /api/mock/zoning` - Retorna dados mock de zoneamento
- `GET /api/mock/road-access` - Retorna dados mock de acesso
- `GET /api/mock/redflags` - Retorna dados mock de alertas
- `GET /api/schema/property` - Retorna schema padrão

### Bloqueio de APIs
- ✅ Todas chamadas externas bloqueadas quando `OFFLINE_MODE=true`
- ✅ Middleware `checkAPIAllowed()` protege endpoints de API
- ✅ Retorna erro 403 com mensagem clara

---

## ✅ PARTE B: SEGURANÇA DE KEYS

### Proteção de Chaves
- ✅ Nenhuma key hardcoded nos arquivos
- ✅ Todas keys via variáveis de ambiente
- ✅ `.gitignore` configurado para proteger `.env`

### Endpoints Perigosos Desativados
- ❌ `POST /api/config/save` - Desativado (keys via .env apenas)
- ❌ `GET /api/google-maps-key` - Desativado em OFFLINE MODE

### Verificação de Status
- ✅ `GET /api/config/status` - Mostra status das keys (sem expor valores)
- ✅ `GET /api/status` - Mostra modo atual (OFFLINE/ONLINE)

---

## ✅ PARTE C: DATA PROVIDERS

### Camada de Abstração
- ✅ Arquivo `/providers/DataProvider.js` criado
- ✅ 8 providers especializados:
  1. `PropertyDataProvider` - Dados de propriedades
  2. `FloodDataProvider` - Dados de inundação
  3. `ZoningDataProvider` - Dados de zoneamento
  4. `RoadAccessDataProvider` - Dados de acesso
  5. `RedFlagsDataProvider` - Alertas e problemas
  6. `GoogleMapsDataProvider` - Mapas e geocoding
  7. `AIDataProvider` - Análises via IA
  8. `CompsDataProvider` - Propriedades comparáveis

### Funcionamento
- Em **OFFLINE MODE**: Retorna dados mock
- Em **ONLINE MODE**: Chama APIs reais (quando implementadas)
- Estrutura preparada com comentários `TODO` indicando onde adicionar APIs

---

## ✅ PARTE D: PROPERTY OBJECT (SSOT)

### Schema Padrão
- ✅ Arquivo `/mock/property.schema.json`
- ✅ Define estrutura única para todas propriedades
- ✅ Garante consistência entre mock e APIs reais

---

## 🚀 COMO USAR

### Modo OFFLINE (Padrão)
```bash
# Já está configurado!
npm start
```

O servidor inicia em **OFFLINE MODE** automaticamente.

### Modo ONLINE (Quando tiver APIs configuradas)
```bash
# 1. Configure as keys no .env
OFFLINE_MODE=false
GOOGLE_MAPS_API_KEY=sua_key_aqui
OPENAI_API_KEY=sua_key_aqui
# ... outras keys

# 2. Inicie o servidor
npm start
```

---

## 📊 ENDPOINTS DISPONÍVEIS

### Sempre Disponíveis (Mock)
- `GET /api/health` - Health check
- `GET /api/status` - Status do sistema
- `GET /api/mock/*` - Dados mock (6 endpoints)
- `GET /api/schema/property` - Schema padrão

### Disponíveis Apenas em ONLINE MODE
- `POST /api/google-maps` - Proxy Google Maps
- `POST /api/openai` - Proxy OpenAI
- `POST /api/gemini` - Proxy Google Gemini
- `POST /api/perplexity` - Proxy Perplexity
- `POST /api/zillow` - Proxy Zillow (RapidAPI)
- `POST /api/realtor` - Proxy Realtor.com (RapidAPI)
- `POST /api/realty-mole` - Proxy Realty Mole (RapidAPI)
- `POST /api/naip` - NAIP Aerial Imagery
- `POST /api/landsat` - Landsat Satellite

---

## 🔐 SEGURANÇA

### O que está protegido:
- ✅ Keys nunca expostas no frontend
- ✅ `.env` no `.gitignore`
- ✅ Endpoints perigosos desativados
- ✅ Middleware de proteção em todas APIs

### O que NÃO fazer:
- ❌ Nunca commitar `.env`
- ❌ Nunca expor keys no código
- ❌ Nunca chamar APIs diretamente do frontend

---

## 🎯 PRÓXIMOS PASSOS

### Para Adicionar APIs Reais:

1. **Configure as keys** no `.env`:
   ```bash
   OFFLINE_MODE=false
   GOOGLE_MAPS_API_KEY=sua_key
   OPENAI_API_KEY=sua_key
   # ... etc
   ```

2. **Implemente as APIs** nos Data Providers:
   - Abra `/providers/DataProvider.js`
   - Procure por comentários `// TODO:`
   - Implemente as chamadas reais às APIs

3. **Teste** em modo ONLINE:
   ```bash
   npm start
   ```

---

## 📝 ARQUIVOS IMPORTANTES

```
/gt-lands-manus/
├── server.js                    # Servidor principal com OFFLINE MODE
├── .gitignore                   # Proteção de arquivos sensíveis
├── package.json                 # Dependências
├── /mock/                       # Dados simulados
│   ├── property.sample.json
│   ├── flood.sample.json
│   ├── zoning.sample.json
│   ├── road_access.sample.json
│   ├── redflags.sample.json
│   └── property.schema.json     # Schema padrão (SSOT)
├── /providers/                  # Camada de abstração
│   └── DataProvider.js          # 8 providers especializados
└── README_OFFLINE_MODE.md       # Este arquivo
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] PARTE A: OFFLINE MODE implementado
- [x] PARTE B: Segurança de keys garantida
- [x] PARTE C: Data Providers criados
- [x] PARTE D: Property Object (SSOT) definido
- [x] Sistema testado em OFFLINE MODE
- [x] Documentação completa

---

## 🎉 RESULTADO

Sistema **100% funcional** em OFFLINE MODE:
- ✅ Roda sem APIs
- ✅ Roda sem custos
- ✅ Keys protegidas
- ✅ Arquitetura preparada para APIs futuras
- ✅ Fácil de reativar APIs quando necessário

**Pronto para uso!** 🚀
