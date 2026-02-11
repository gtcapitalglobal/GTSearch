# Security Hardening & Architecture Improvements

**Project:** GTSearch (gt-lands-manus)  
**Date:** February 2026  
**Status:** ✅ Complete

## Overview

This document describes the comprehensive security hardening and architectural improvements implemented in the GTSearch project. The main objective was to enhance the OFFLINE MODE implementation with fail-closed security, endpoint protection, secrets management, provider architecture cleanup, SSOT enforcement, and UI improvements.

## Architecture

### Fail-Closed Security Model

The system implements a **fail-closed** security model where:
- `OFFLINE_MODE` defaults to `TRUE` if missing or invalid
- Automatic fallback to `OFFLINE_MODE=true` if required API keys are missing
- All API endpoints are disabled in OFFLINE MODE by default
- No secrets are exposed in logs or responses

### Provider Architecture

```
BaseProvider (abstract)
├── MockProvider (OFFLINE MODE)
│   └── Returns mock data from /mock/*.sample.json
└── ApiProvider (ONLINE MODE)
    ├── GoogleMapsProvider
    ├── OpenAIProvider
    ├── GeminiProvider
    └── RapidAPIProvider
```

**Central Router:** `/providers/index.js` selects Mock vs API providers based on `OFFLINE_MODE` flag.

## Security Features

### 1. OFFLINE MODE (Fail-Closed)

**File:** `server.js`

**Logic:**
1. If `OFFLINE_MODE` is missing/invalid → default to `TRUE`
2. If `OFFLINE_MODE=false` but required keys are missing → force `TRUE` + warn
3. Required keys: `GOOGLE_MAPS_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `RAPIDAPI_KEY`

**Benefits:**
- No accidental API costs
- Safe development environment
- Explicit opt-in for ONLINE MODE

### 2. Endpoint Protection

**File:** `/middleware/security.js`

**Features:**
- **Rate Limiting:** 100 req/15min (normal), 20 req/15min (strict)
- **Request Size Limit:** 1MB maximum
- **Timeout:** 30 seconds per request
- **Parameter Allowlisting:** Reject unknown parameters
- **URL Rejection:** Prevent SSRF attacks (no user-supplied URLs)
- **ADMIN_TOKEN Authentication:** Required for all `/api/*` endpoints in ONLINE MODE

**Usage:**
```javascript
import { secureEndpoint } from './middleware/security.js';

app.post('/api/sensitive', secureEndpoint('strict'), async (req, res) => {
  // Your code here
});
```

### 3. Secrets Management

**File:** `/utils/logger.js`

**Features:**
- **Secret Masking:** Shows only last 4 characters (e.g., `****1234`)
- **Recursive Masking:** Works with nested objects
- **Safe API Logging:** Masks secrets in request/response logs
- **Config Status Logging:** Shows booleans only, no values

**Usage:**
```javascript
import { logInfo, logError, logSecure } from './utils/logger.js';

logInfo('Server started', { port: 3000 });
logSecure('API key loaded', { key: process.env.GOOGLE_MAPS_API_KEY });
logError('Request failed', error);
```

### 4. SSOT Validation

**File:** `/utils/validator.js`

**Features:**
- Validates all mock outputs against `/mock/property.schema.json`
- Non-blocking warnings (doesn't break functionality)
- Adds `_validation` field to response if schema mismatch
- Uses AJV with JSON Schema Draft-07

**Integration:**
```javascript
import { validateMockOutputMiddleware } from './utils/validator.js';

app.use('/api/mock', validateMockOutputMiddleware);
```

### 5. Audit Logging

**File:** `/utils/audit.js`

**Features:**
- Logs every API request with timestamp, provider, and result
- Saves to `/logs/audit.log` in JSON Lines format
- Provides functions to read logs and generate statistics
- Automatic middleware integration

**Usage:**
```javascript
import { auditLog, auditLogMiddleware } from './utils/audit.js';

app.use('/api', auditLogMiddleware());

// Manual logging
auditLog({
  action: 'property_analysis',
  provider: 'mock',
  result: 'success',
  metadata: { parcel_id: '12345' }
});
```

## Testing

### Smoke Tests

**File:** `/tests/smoke.test.js`

**Command:** `npm run smoke`

**Tests:**
- ✅ Health check (`/api/health`)
- ✅ Status endpoint (`/api/status`)
- ✅ All mock endpoints (`/api/mock/*`)
- ✅ Property schema endpoint (`/api/schema/property`)
- ✅ Secret exposure check
- ✅ Invalid endpoint returns 404
- ✅ `_meta` field presence in mock responses

**Result:** 19/19 tests passing ✅

## UI Improvements

### OFFLINE/ONLINE MODE Banner

**File:** `public/analysis2.html`

**Features:**
- Visual banner at top of page
- **Yellow** with 🔒 for OFFLINE MODE
- **Green** with 🌐 for ONLINE MODE
- **Red** with ⚠️ for errors
- Automatically loads status via `/api/status`

**Implementation:**
```html
<div id="mode-banner" class="w-full py-2 text-center text-sm font-semibold shadow-md">
  <span id="mode-text">Carregando...</span>
</div>

<script>
  fetch('/api/status')
    .then(r => r.json())
    .then(data => {
      const banner = document.getElementById('mode-banner');
      const text = document.getElementById('mode-text');
      
      if (data.OFFLINE_MODE || data.offline_mode) {
        banner.className = 'w-full py-2 text-center text-sm font-semibold shadow-md bg-yellow-100 text-yellow-900';
        text.textContent = '🔒 OFFLINE MODE - Usando dados mock (sem custos de API)';
      } else {
        banner.className = 'w-full py-2 text-center text-sm font-semibold shadow-md bg-green-100 text-green-900';
        text.textContent = '🌐 ONLINE MODE - APIs ativas';
      }
    });
</script>
```

## Configuration

### Environment Variables

**Required for ONLINE MODE:**
```bash
OFFLINE_MODE=false
ADMIN_TOKEN=your_secure_token_here
GOOGLE_MAPS_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
RAPIDAPI_KEY=your_key_here
```

**Optional:**
```bash
PORT=3000
```

### OFFLINE MODE (Default)

No configuration needed. System runs in OFFLINE MODE by default with mock data.

## API Endpoints

### Public Endpoints (Always Available)

- `GET /api/health` - Health check
- `GET /api/status` - System status
- `GET /api/mock/property` - Mock property data
- `GET /api/mock/flood` - Mock flood data
- `GET /api/mock/zoning` - Mock zoning data
- `GET /api/mock/road_access` - Mock road access data
- `GET /api/mock/redflags` - Mock red flags data
- `GET /api/schema/property` - Property schema (SSOT)

### Protected Endpoints (ONLINE MODE Only)

**Requires:** `ADMIN_TOKEN` in `Authorization` header

- `POST /api/google-maps` - Google Maps API proxy
- `POST /api/openai` - OpenAI API proxy
- `POST /api/gemini` - Gemini API proxy
- `POST /api/perplexity` - Perplexity API proxy
- `POST /api/zillow` - Zillow API proxy (via RapidAPI)
- `POST /api/realtor` - Realtor API proxy (via RapidAPI)
- `POST /api/realty-mole` - Realty Mole API proxy (via RapidAPI)

**Authentication:**
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"endpoint": "...", "params": {...}}' \
     http://localhost:3000/api/google-maps
```

## Files Structure

```
/home/ubuntu/gt-lands-manus/
├── server.js                      # Main Express server
├── package.json                   # Dependencies + scripts
├── .env                           # Environment variables (gitignored)
├── middleware/
│   └── security.js                # Security middleware
├── utils/
│   ├── logger.js                  # Secure logging
│   ├── validator.js               # SSOT validation
│   └── audit.js                   # Audit logging
├── providers/
│   ├── BaseProvider.js            # Abstract base class
│   ├── MockProvider.js            # Mock data provider
│   ├── ApiProvider.js             # API base class
│   └── index.js                   # Central router
├── tests/
│   └── smoke.test.js              # Smoke tests
├── mock/
│   ├── property.schema.json       # SSOT schema
│   ├── property.sample.json       # Mock property data
│   ├── flood.sample.json          # Mock flood data
│   ├── zoning.sample.json         # Mock zoning data
│   ├── road_access.sample.json    # Mock road access data
│   └── redflags.sample.json       # Mock red flags data
├── logs/
│   └── audit.log                  # Audit log (auto-generated)
└── public/
    └── analysis2.html             # Frontend with mode banner
```

## Best Practices

### 1. Always Use Secure Logging

❌ **Don't:**
```javascript
console.log('API Key:', process.env.GOOGLE_MAPS_API_KEY);
```

✅ **Do:**
```javascript
import { logSecure } from './utils/logger.js';
logSecure('API Key loaded', { key: process.env.GOOGLE_MAPS_API_KEY });
// Output: API Key loaded { key: '****1234' }
```

### 2. Use Security Middleware

❌ **Don't:**
```javascript
app.post('/api/sensitive', async (req, res) => {
  // No rate limiting, no auth, no validation
});
```

✅ **Do:**
```javascript
import { secureEndpoint } from './middleware/security.js';

app.post('/api/sensitive', secureEndpoint('strict'), async (req, res) => {
  // Rate limited, authenticated, validated
});
```

### 3. Validate Mock Data

❌ **Don't:**
```javascript
app.get('/api/mock/property', (req, res) => {
  res.json(mockData); // No validation
});
```

✅ **Do:**
```javascript
import { validateMockOutputMiddleware } from './utils/validator.js';

app.use('/api/mock', validateMockOutputMiddleware);

app.get('/api/mock/property', (req, res) => {
  res.json(mockData); // Automatically validated
});
```

### 4. Audit All Actions

❌ **Don't:**
```javascript
app.post('/api/analyze', async (req, res) => {
  const result = await analyze(req.body);
  res.json(result);
  // No audit trail
});
```

✅ **Do:**
```javascript
import { auditLog } from './utils/audit.js';

app.post('/api/analyze', async (req, res) => {
  const result = await analyze(req.body);
  
  auditLog({
    action: 'property_analysis',
    provider: 'openai',
    result: 'success',
    metadata: { parcel_id: req.body.parcel_id }
  });
  
  res.json(result);
});
```

## Troubleshooting

### Server Won't Start in ONLINE MODE

**Symptom:** Server starts in OFFLINE MODE even with `OFFLINE_MODE=false`

**Cause:** Missing required API keys

**Solution:** Check console warnings:
```
⚠️  OFFLINE_MODE=false but required keys missing:
   Missing: GOOGLE_MAPS_API_KEY, OPENAI_API_KEY
   => FORCING OFFLINE MODE for security
```

Add missing keys to `.env` file.

### API Endpoints Return 403

**Symptom:** All `/api/*` endpoints return 403 Forbidden

**Cause:** Missing or invalid `ADMIN_TOKEN` in ONLINE MODE

**Solution:** Add `Authorization` header:
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     http://localhost:3000/api/google-maps
```

### Rate Limit Errors

**Symptom:** 429 Too Many Requests

**Cause:** Exceeded rate limit (100 req/15min or 20 req/15min strict)

**Solution:** Wait 15 minutes or adjust rate limits in `/middleware/security.js`

### Validation Warnings in Logs

**Symptom:** `⚠️ Mock output validation failed` in console

**Cause:** Mock data doesn't fully conform to property schema

**Solution:** This is expected for simplified mock samples. Validation is non-blocking. To fix:
1. Update mock samples to match schema exactly, or
2. Update schema to match mock data structure

## Future Improvements

- [ ] Add database-backed audit log (currently file-based)
- [ ] Implement API key rotation system
- [ ] Add Prometheus metrics for monitoring
- [ ] Create admin dashboard for audit log visualization
- [ ] Implement IP-based rate limiting (currently global)
- [ ] Add webhook notifications for security events
- [ ] Create automated security scanning in CI/CD

## References

- [AJV JSON Schema Validator](https://ajv.js.org/)
- [Express Rate Limit](https://www.npmjs.com/package/express-rate-limit)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [JSON Schema Draft-07](https://json-schema.org/draft-07/schema)

## Changelog

### v2.0.0 - February 2026

**Security:**
- ✅ Fail-closed OFFLINE MODE by default
- ✅ ADMIN_TOKEN authentication for ONLINE MODE
- ✅ Rate limiting on all endpoints
- ✅ Secret masking in logs
- ✅ SSRF protection (no user-supplied URLs)
- ✅ Parameter allowlisting

**Architecture:**
- ✅ Modular provider system (Base/Mock/API)
- ✅ Central routing based on OFFLINE_MODE
- ✅ SSOT enforcement via JSON schema validation
- ✅ Comprehensive audit logging

**Testing:**
- ✅ Smoke tests (19 tests, 100% passing)
- ✅ `npm run smoke` command

**UI:**
- ✅ OFFLINE/ONLINE MODE banner
- ✅ Zero API keys in frontend code

---

**Last Updated:** February 10, 2026  
**Maintained By:** Manus AI  
**Project:** GTSearch (gt-lands-manus)
