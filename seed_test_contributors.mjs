import 'dotenv/config';

/**
 * FYP Chapter 6 - Algorithm Test Data Seeder
 * 
 * This script inserts test contributor locations into Supabase
 * for testing the Standard vs Green routing algorithms.
 * 
 * Usage:
 *   node seed_test_contributors.mjs scenario_a     (5 points)
 *   node seed_test_contributors.mjs scenario_b     (15 points)
 *   node seed_test_contributors.mjs cleanup        (remove all test data)
 * 
 * All test contributors use IDs prefixed with "test_algo_" for easy cleanup.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing Supabase config. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.');
}

const TEST_PREFIX = 'test_algo_';

// ============================================================
// Ayer Keroh, Malacca Test Points
// Center: 2.2634°N, 102.2925°E
// Points spread across different elevations and road networks
// ============================================================

// Scenario A: 5 points within ~5km radius (Low Density)
const SCENARIO_A = [
    { id: `${TEST_PREFIX}a1`, latitude: 2.2680, longitude: 102.2880, name: 'Test Point A1 - Taman Merdeka' },
    { id: `${TEST_PREFIX}a2`, latitude: 2.2590, longitude: 102.2970, name: 'Test Point A2 - Ayer Keroh Heights' },
    { id: `${TEST_PREFIX}a3`, latitude: 2.2720, longitude: 102.2950, name: 'Test Point A3 - Taman Tasik' },
    { id: `${TEST_PREFIX}a4`, latitude: 2.2550, longitude: 102.2850, name: 'Test Point A4 - Zoo Melaka Area' },
    { id: `${TEST_PREFIX}a5`, latitude: 2.2650, longitude: 102.3010, name: 'Test Point A5 - MITC Area' },
];

// Scenario B: 15 points within ~10km radius (High Density)
const SCENARIO_B = [
    // Include all 5 from Scenario A
    ...SCENARIO_A,
    // 10 additional points spread further out
    { id: `${TEST_PREFIX}b6`,  latitude: 2.2480, longitude: 102.2780, name: 'Test Point B6 - Durian Tunggal' },
    { id: `${TEST_PREFIX}b7`,  latitude: 2.2800, longitude: 102.2900, name: 'Test Point B7 - Lebuh AMJ' },
    { id: `${TEST_PREFIX}b8`,  latitude: 2.2530, longitude: 102.3050, name: 'Test Point B8 - Taman Muzium' },
    { id: `${TEST_PREFIX}b9`,  latitude: 2.2750, longitude: 102.2800, name: 'Test Point B9 - Taman Ayer Keroh' },
    { id: `${TEST_PREFIX}b10`, latitude: 2.2400, longitude: 102.2900, name: 'Test Point B10 - Peringgit' },
    { id: `${TEST_PREFIX}b11`, latitude: 2.2850, longitude: 102.3000, name: 'Test Point B11 - Bukit Katil' },
    { id: `${TEST_PREFIX}b12`, latitude: 2.2600, longitude: 102.2700, name: 'Test Point B12 - Taman Sri Duyong' },
    { id: `${TEST_PREFIX}b13`, latitude: 2.2700, longitude: 102.3100, name: 'Test Point B13 - Taman Seri Rambai' },
    { id: `${TEST_PREFIX}b14`, latitude: 2.2450, longitude: 102.3000, name: 'Test Point B14 - Batu Berendam' },
    { id: `${TEST_PREFIX}b15`, latitude: 2.2900, longitude: 102.2850, name: 'Test Point B15 - Krubong' },
];

// ============================================================
// Supabase REST API Helper
// ============================================================
async function supabaseRequest(method, table, data = null, query = '') {
    const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
    const options = {
        method,
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': method === 'POST' ? 'resolution=merge-duplicates' : 'return=minimal',
        },
    };
    if (data) options.body = JSON.stringify(data);
    
    const res = await fetch(url, options);
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Supabase ${method} ${table} failed: ${res.status} - ${errText}`);
    }
    if (method === 'GET') return res.json();
    return null;
}

// ============================================================
// Seed Contributors
// ============================================================
async function seedContributors(points) {
    console.log(`\nSeeding ${points.length} test contributors...\n`);

    const contributors = points.map(p => ({
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        status: 'active',           // Must be 'active' so Collector can find them
        collector_id: null,
    }));

    // Upsert contributors
    await supabaseRequest('POST', 'contributors', contributors, '?on_conflict=id');
    console.log(`[OK] Inserted ${contributors.length} contributors into 'contributors' table`);

    // Also insert dummy scanned_items so waste types show up
    const materials = ['Plastic', 'Paper', 'Metal', 'Glass', 'E-Waste'];
    const scannedItems = [];
    
    for (const p of points) {
        // Each contributor gets 1-2 random materials
        const numItems = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numItems; i++) {
            scannedItems.push({
                contributor_id: p.id,
                name: `Test ${materials[i % materials.length]} Item`,
                material: materials[i % materials.length],
                points: 5 + Math.floor(Math.random() * 15),
                image_uri: 'https://placehold.co/200x200/2D5A27/white?text=Test',
                co2_saved: 0.3 + Math.random() * 2,
                transaction_id: null,  // Must be null to show as "pending"
            });
        }
    }

    await supabaseRequest('POST', 'scanned_items', scannedItems);
    console.log(`[OK] Inserted ${scannedItems.length} scanned_items for waste type display`);

    console.log('\n--- Test Points Summary ---');
    for (const p of points) {
        console.log(`  ${p.id.padEnd(20)} | ${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)} | ${p.name}`);
    }
    console.log('');
}

// ============================================================
// Cleanup
// ============================================================
async function cleanup() {
    console.log('\nCleaning up test data...\n');

    // Delete scanned_items for test contributors
    await supabaseRequest('DELETE', 'scanned_items', null, `?contributor_id=like.${TEST_PREFIX}*`);
    console.log('[OK] Deleted test scanned_items');

    // Delete test contributors
    await supabaseRequest('DELETE', 'contributors', null, `?id=like.${TEST_PREFIX}*`);
    console.log('[OK] Deleted test contributors');

    console.log('\nCleanup complete!\n');
}

// ============================================================
// Main
// ============================================================
const command = process.argv[2] || 'scenario_a';

console.log('=============================================');
console.log('  FYP Algorithm Test Data Seeder');
console.log(`  Command: ${command}`);
console.log('=============================================');

switch (command) {
    case 'scenario_a':
        await seedContributors(SCENARIO_A);
        console.log('Now open your Collector app and press "Search".');
        console.log('You should see 5 contributors near Ayer Keroh.');
        console.log('Add all 5 to queue, then press "Start Route".');
        console.log('Switch between Standard/Green mode and note the console logs.');
        console.log('\n[ALGO-BENCHMARK] logs will appear in Metro/Logcat.\n');
        break;

    case 'scenario_b':
        await seedContributors(SCENARIO_B);
        console.log('Now open your Collector app and press "Search".');
        console.log('You should see 15 contributors near Ayer Keroh.');
        console.log('Add all 15 to queue, then press "Start Route".');
        console.log('Switch between Standard/Green mode and note the console logs.');
        console.log('\n[ALGO-BENCHMARK] logs will appear in Metro/Logcat.\n');
        break;

    case 'cleanup':
        await cleanup();
        break;

    default:
        console.log('Usage:');
        console.log('  node seed_test_contributors.mjs scenario_a     (5 points)');
        console.log('  node seed_test_contributors.mjs scenario_b     (15 points)');
        console.log('  node seed_test_contributors.mjs cleanup        (remove test data)');
}
