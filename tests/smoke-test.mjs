/**
 * Smoke Test - Validates all Audit V3 fixes
 * Run: node tests/smoke-test.mjs
 */

import { getPropertyDetails, getStateLandUse } from '../api-integrations.js';
import { getWetlandsProgressive } from '../wetlands-local.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passed++;
    } else {
        console.log(`  ❌ FAIL: ${testName}`);
        failed++;
    }
}

async function runTests() {
    console.log('\n========================================');
    console.log('  GTSearch Smoke Test - Audit V3 Fixes');
    console.log('========================================\n');

    // -----------------------------------------------
    // TEST 1: P1 - Wetlands high + ON_PROPERTY => 🔴
    // -----------------------------------------------
    console.log('TEST 1: P1 - overallStatus for high risk wetland ON_PROPERTY');
    try {
        const result = await getPropertyDetails({
            lat: 27.3318,
            lng: -81.3266,
            county: 'Highlands',
            parcelId: 'C20363011000500050'
        });
        
        assert(result.success === true, 'API call succeeded');
        assert(result.wetlands.found === true, 'Wetlands found (PFO1Fd)');
        assert(result.wetlands.highestRisk?.risk === 'high', 'Wetlands risk is high');
        assert(result.wetlands.proximity === 'ON_PROPERTY', 'Wetlands proximity is ON_PROPERTY');
        assert(result.overallStatus.includes('ALTO RISCO'), 'overallStatus contains ALTO RISCO');
        assert(!result.overallStatus.includes('AVALIAR'), 'overallStatus does NOT say AVALIAR');
    } catch (err) {
        console.log(`  ❌ FAIL: Test 1 threw error: ${err.message}`);
        failed++;
    }

    // -----------------------------------------------
    // TEST 2: P2 - SALE_MO1=0 does not produce invalid date
    // -----------------------------------------------
    console.log('\nTEST 2: P2 - SALE_MO1=0 handling');
    try {
        const result = await getStateLandUse(27.3318, -81.3266);
        
        assert(result.found === true, 'Land Use found');
        // Check that lastSaleDate does not contain "0/" or "/0/"
        if (result.lastSaleDate) {
            assert(!result.lastSaleDate.startsWith('0/'), 'lastSaleDate does not start with 0/');
            assert(!result.lastSaleDate.includes('/0/'), 'lastSaleDate does not contain /0/');
        } else {
            assert(true, 'lastSaleDate is null (acceptable)');
        }
        // Check that lastSalePrice is not 0
        if (result.lastSalePrice !== null) {
            assert(result.lastSalePrice > 0, 'lastSalePrice is > 0 (not zero)');
        } else {
            assert(true, 'lastSalePrice is null (acceptable)');
        }
    } catch (err) {
        console.log(`  ❌ FAIL: Test 2 threw error: ${err.message}`);
        failed++;
    }

    // -----------------------------------------------
    // TEST 3: P3 - Highlands zoning uses ZON/FLUM only (no dead fields)
    // Note: Highlands server may not be reachable from sandbox (SSL)
    // We test the code path by checking the result structure
    // -----------------------------------------------
    console.log('\nTEST 3: P3 - Highlands zoning (best-effort, may fail from sandbox)');
    try {
        const result = await getPropertyDetails({
            lat: 27.3318,
            lng: -81.3266,
            county: 'Highlands'
        });
        
        assert(result.zoning !== undefined, 'Zoning result exists');
        // If it failed due to SSL, it should have error + manualLink
        if (result.zoning.error) {
            assert(result.zoning.manualLink !== undefined, 'Has manual link on error');
            assert(result.zoning.status.includes('ERRO') || result.zoning.status.includes('NÃO'), 'Status indicates error/unavailable');
            console.log('  ℹ️  Highlands server unreachable (expected from sandbox)');
        } else if (result.zoning.found) {
            assert(result.zoning.code !== undefined, 'Has zoning code');
            assert(result.zoning.description !== undefined, 'Has zoning description');
        }
    } catch (err) {
        console.log(`  ❌ FAIL: Test 3 threw error: ${err.message}`);
        failed++;
    }

    // -----------------------------------------------
    // TEST 4: P5 - Widget data includes sqfoot and buildings
    // -----------------------------------------------
    console.log('\nTEST 4: P5 - Land Use includes sqfoot and buildings');
    try {
        const result = await getStateLandUse(29.694825, -81.848460);
        
        assert(result.found === true, 'Land Use found (Putnam)');
        assert(result.sqfoot !== undefined, 'sqfoot field exists');
        assert(result.buildings !== undefined, 'buildings field exists');
        console.log(`  ℹ️  sqfoot=${result.sqfoot}, buildings=${result.buildings}`);
    } catch (err) {
        console.log(`  ❌ FAIL: Test 4 threw error: ${err.message}`);
        failed++;
    }

    // -----------------------------------------------
    // TEST 5: P6 - Cache consistency with varying coord precision
    // -----------------------------------------------
    console.log('\nTEST 5: P6 - Cache key normalization');
    try {
        // First call
        const result1 = await getWetlandsProgressive(29.694825, -81.848460);
        // Second call with slightly different precision (should hit cache)
        const result2 = await getWetlandsProgressive(29.6948250001, -81.8484600001);
        
        assert(result1.found === result2.found, 'Same result for slightly different coords');
        if (result1.found && result2.found) {
            assert(result1.wetlands?.[0]?.code === result2.wetlands?.[0]?.code, 'Same wetland code from cache');
        }
    } catch (err) {
        console.log(`  ❌ FAIL: Test 5 threw error: ${err.message}`);
        failed++;
    }

    // -----------------------------------------------
    // TEST 6: Putnam County full pipeline
    // -----------------------------------------------
    console.log('\nTEST 6: Putnam County full pipeline');
    try {
        const result = await getPropertyDetails({
            lat: 29.694825,
            lng: -81.848460,
            county: 'Putnam',
            parcelId: '24-09-24-4075-0410-0300'
        });
        
        assert(result.success === true, 'Pipeline succeeded');
        assert(result.wetlands.found === true, 'Wetlands found (PSS1C)');
        assert(result.landUse.found === true, 'Land Use found');
        assert(result.landUse.code === '000', 'DOR code is 000');
        assert(result.landUse.description === 'Vacant Residential', 'Description is Vacant Residential');
        assert(result.zoning.found === true, 'Zoning found');
        assert(result.zoning.code === 'R-2', 'Zoning code is R-2');
    } catch (err) {
        console.log(`  ❌ FAIL: Test 6 threw error: ${err.message}`);
        failed++;
    }

    // -----------------------------------------------
    // SUMMARY
    // -----------------------------------------------
    console.log('\n========================================');
    console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
    console.log('========================================\n');
    
    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Smoke test crashed:', err);
    process.exit(1);
});
