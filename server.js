import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

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
    const { prompt, model = 'gemini-pro' } = req.body;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

app.listen(PORT, () => {
  console.log(`🚀 GT Lands Dashboard running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api/*`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}`);
});

