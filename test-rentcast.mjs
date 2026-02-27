import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env') });

const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY;
const OFFLINE_MODE = process.env.OFFLINE_MODE;

console.log('=== RentCast API Test ===');
console.log('OFFLINE_MODE:', OFFLINE_MODE);
console.log('RENTCAST_API_KEY:', RENTCAST_API_KEY ? `***SET (${RENTCAST_API_KEY.length} chars)***` : 'NOT SET');

if (!RENTCAST_API_KEY) {
    console.error('❌ RENTCAST_API_KEY not set!');
    process.exit(1);
}

if (OFFLINE_MODE === 'true') {
    console.error('❌ OFFLINE_MODE is still true!');
    process.exit(1);
}

// Test a lightweight RentCast API call - property records lookup
const testAddress = '4644 Chuluota Rd, Orlando, FL';
const url = `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(testAddress)}&limit=1`;

console.log(`\nTesting RentCast API with address: ${testAddress}`);
console.log(`URL: ${url}`);

try {
    const response = await fetch(url, {
        headers: {
            'X-Api-Key': RENTCAST_API_KEY,
            'Accept': 'application/json'
        }
    });

    console.log(`\nResponse Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
        const data = await response.json();
        console.log('✅ RentCast API is working!');
        console.log('Properties found:', Array.isArray(data) ? data.length : 1);
        if (Array.isArray(data) && data.length > 0) {
            console.log('First result:', JSON.stringify(data[0], null, 2).substring(0, 300) + '...');
        }
        process.exit(0);
    } else if (response.status === 401) {
        console.error('❌ Invalid API Key (401 Unauthorized)');
        const body = await response.text();
        console.error('Response:', body);
        process.exit(1);
    } else if (response.status === 402) {
        console.error('❌ Payment required (402) - No credits available');
        process.exit(1);
    } else if (response.status === 404) {
        console.log('⚠️ Property not found (404) - but API key is valid!');
        console.log('✅ RentCast API key is valid and working');
        process.exit(0);
    } else {
        const body = await response.text();
        console.error(`❌ Unexpected status ${response.status}:`, body);
        process.exit(1);
    }
} catch (err) {
    console.error('❌ Network error:', err.message);
    process.exit(1);
}
