import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Get current API keys status (without exposing the keys)
app.get('/api/config/status', (req, res) => {
  res.json({
    google_maps: !!process.env.GOOGLE_MAPS_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    perplexity: !!process.env.PERPLEXITY_API_KEY,
    rapidapi: !!process.env.RAPIDAPI_KEY,
  });
});

// Save API keys to .env file
app.post('/api/config/save', (req, res) => {
  try {
    const { google_maps, openai, gemini, perplexity, rapidapi } = req.body;
    
    const envContent = `# GT Lands Dashboard - Environment Variables\n# Configure suas API keys aqui\n\n# Google Maps API\nGOOGLE_MAPS_API_KEY=${google_maps || ''}\n\n# OpenAI API\nOPENAI_API_KEY=${openai || ''}\n\n# Google Gemini API\nGEMINI_API_KEY=${gemini || ''}\n\n# Perplexity API\nPERPLEXITY_API_KEY=${perplexity || ''}\n\n# RapidAPI Key (for Zillow, Realtor.com, Realty Mole)\nRAPIDAPI_KEY=${rapidapi || ''}\n\n# Server Port\nPORT=3000\n`;
    
    fs.writeFileSync('.env', envContent);
    
    // Reload environment variables
    process.env.GOOGLE_MAPS_API_KEY = google_maps || '';
    process.env.OPENAI_API_KEY = openai || '';
    process.env.GEMINI_API_KEY = gemini || '';
    process.env.PERPLEXITY_API_KEY = perplexity || '';
    process.env.RAPIDAPI_KEY = rapidapi || '';
    
    res.json({ success: true, message: 'API keys saved successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Google Maps API Key (for client-side loading)
app.get('/api/google-maps-key', (req, res) => {
  res.json({ key: process.env.GOOGLE_MAPS_API_KEY || '' });
});

// Google Maps API Proxy
app.post('/api/google-maps', async (req, res) => {
  try {
    const { endpoint, params } = req.body;
    
    const url = new URL(endpoint);
    url.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await axios.get(url.toString());
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// OpenAI API Proxy
app.post('/api/openai', async (req, res) => {
  try {
    const { messages, model = 'gpt-4', max_tokens = 1000 } = req.body;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages,
        max_tokens,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Google Gemini API Proxy
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt, model = 'gemini-2.5-flash' } = req.body;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Perplexity API Proxy
app.post('/api/perplexity', async (req, res) => {
  try {
    const { messages, model = 'llama-3.1-sonar-small-128k-online' } = req.body;

    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model,
        messages,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Zillow API Proxy (RapidAPI)
app.post('/api/zillow', async (req, res) => {
  try {
    const { endpoint, params } = req.body;

    const url = new URL(`https://zillow-com1.p.rapidapi.com${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await axios.get(url.toString(), {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com',
      },
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Realtor.com API Proxy (RapidAPI)
app.post('/api/realtor', async (req, res) => {
  try {
    const { endpoint, params } = req.body;

    const url = new URL(`https://realtor.p.rapidapi.com${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await axios.get(url.toString(), {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'realtor.p.rapidapi.com',
      },
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Zillow Search by Coordinates
app.post('/api/zillow/search', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    const response = await axios.get(`https://zillow-com1.p.rapidapi.com/propertyExtendedSearch`, {
      params: {
        location: `${lat},${lng}`,
        status_type: 'ForSale'
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Zillow search error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Zillow Get Property Images
app.post('/api/zillow/images', async (req, res) => {
  try {
    const { zpid } = req.body;
    
    const response = await axios.get(`https://zillow-com1.p.rapidapi.com/images`, {
      params: { zpid },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Zillow images error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Realty Mole Get Property by Address
app.post('/api/realty-mole/property', async (req, res) => {
  try {
    const { address, city, state, zip } = req.body;
    
    const fullAddress = `${address}, ${city}, ${state} ${zip}`;
    
    const response = await axios.get(`https://realty-mole-property-api.p.rapidapi.com/properties`, {
      params: { address: fullAddress },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'realty-mole-property-api.p.rapidapi.com',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Realty Mole error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Realty Mole API Proxy
app.post('/api/realty-mole', async (req, res) => {
  try {
    const { endpoint, params } = req.body;

    const url = new URL(`https://realty-mole-property-api.p.rapidapi.com${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await axios.get(url.toString(), {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'realty-mole-property-api.p.rapidapi.com',
      },
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Florida Counties from Google Sheets
let countiesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

app.get('/api/florida-counties', async (req, res) => {
  try {
    // Check cache
    if (countiesCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      return res.json({ success: true, counties: countiesCache, cached: true });
    }

    // Google Sheets public URL (no API key needed for public sheets)
    const spreadsheetId = '1lpoVCGzTQvbN5_o1ZPDESEZyi5BigOTm6g1ZYaT6pTY';
    const sheetName = 'LINKS UTEIS';
    const range = 'A3:B69'; // 67 counties starting from row 3
    
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&range=${range}`;
    
    const response = await axios.get(url);
    
    // Parse Google Sheets JSON response (it's wrapped in a function call)
    const jsonString = response.data.substring(47).slice(0, -2);
    const data = JSON.parse(jsonString);
    
    // Extract counties data
    const counties = {};
    data.table.rows.forEach(row => {
      if (row.c && row.c[0] && row.c[1]) {
        const countyName = row.c[0].v; // Column A
        const countyLink = row.c[1].v; // Column B
        if (countyName && countyLink) {
          counties[countyName.toUpperCase()] = countyLink;
        }
      }
    });
    
    // Update cache
    countiesCache = counties;
    cacheTimestamp = Date.now();
    
    res.json({ success: true, counties, cached: false, count: Object.keys(counties).length });
  } catch (error) {
    console.error('Error fetching Florida counties:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      fallback: true,
      message: 'Using fallback data from florida-counties.js'
    });
  }
});

// Serve index.html on root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 GT Lands Dashboard running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api/*`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}`);
});

