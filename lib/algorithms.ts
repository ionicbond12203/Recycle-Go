// lib/algorithms.ts

export interface Point {
    id: string | number;
    latitude: number;
    longitude: number;
}

export interface RouteMetrics {
    distance: number; // meters
    duration: number; // seconds
    elevationGain: number; // meters
    energyScore: number; // Custom unit for comparison
}

/**
 * Calculates the Haversine distance for initial filtering (Free).
 */
export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const f1 = (lat1 * Math.PI) / 180;
    const f2 = (lat2 * Math.PI) / 180;
    const df = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(df / 2) * Math.sin(df / 2) +
        Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Fetches real road distance and duration matrix from Google.
 * Automatically batches requests to stay under 100-element API limit.
 */
export async function fetchRoadMatrix(points: Point[], apiKey: string): Promise<any> {
    const n = points.length;
    const totalElements = n * n;
    const destinations = points.map(p => `${p.latitude},${p.longitude}`).join('|');

    // If under 100 elements, single request (original behavior)
    if (totalElements <= 100) {
        const origins = points.map(p => `${p.latitude},${p.longitude}`).join('|');
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${origins}&key=${apiKey}`;
        const response = await fetch(url);
        return response.json();
    }

    // Batch: split origins into chunks where chunkSize * n <= 100
    const chunkSize = Math.max(1, Math.floor(100 / n));
    console.log(`[ALGO-DEBUG] Batching matrix: ${n} points, ${totalElements} elements, chunk size: ${chunkSize}`);

    const allRows: any[] = [];

    for (let i = 0; i < n; i += chunkSize) {
        const originSlice = points.slice(i, i + chunkSize);
        const origins = originSlice.map(p => `${p.latitude},${p.longitude}`).join('|');
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK') {
            // Return the error for the validation layer to handle
            return data;
        }

        allRows.push(...data.rows);
    }

    // Reconstruct the full matrix response
    return {
        status: 'OK',
        rows: allRows,
        origin_addresses: allRows.map(() => ''),
        destination_addresses: points.map(() => ''),
    };
}

/**
 * Fetches elevation data for coordinate points from Google.
 */
export async function fetchElevations(points: Point[], apiKey: string): Promise<Record<string, number>> {
    const locations = points.map(p => `${p.latitude},${p.longitude}`).join('|');
    const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${locations}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    const elevationMap: Record<string, number> = {};
    points.forEach((p, i) => {
        elevationMap[p.id] = data.results[i].elevation;
    });
    return elevationMap;
}

/**
 * Energy-Aware Cost Function
 * This is the "Science" part of your research.
 * Model: E = (Dist * Cr) + (m * g * max(0, DeltaH)) + (Time * P_idle)
 */
export function calculateEnergyCost(dist: number, time: number, elev1: number, elev2: number): number {
    const rollingResistance = dist * 1.0; // Simulated factor
    const elevationPenalty = Math.max(0, elev2 - elev1) * 25.0; // Heavy penalty for uphill
    const idlePenalty = time * 0.5; // Penalty for congestion/time
    return rollingResistance + elevationPenalty + idlePenalty;
}

/**
 * Solves TSP using real road matrix.
 * Mode: 'standard' (Distance) or 'green' (Energy)
 */
export async function solveRealTSP(
    start: Point,
    destinations: Point[],
    apiKey: string,
    mode: 'standard' | 'green'
): Promise<{ path: Point[], metrics: RouteMetrics }> {
    // ======= FYP BENCHMARK: Start Timer =======
    const benchmarkStart = Date.now();

    const allPoints = [start, ...destinations];

    const matrixStart = Date.now();
    const matrix = await fetchRoadMatrix(allPoints, apiKey);
    const matrixTime = Date.now() - matrixStart;

    // ======= Validate API Response =======
    console.log('[ALGO-DEBUG] Matrix API status:', matrix?.status);
    if (matrix?.status !== 'OK') {
        console.error('[ALGO-DEBUG] Matrix API error:', JSON.stringify(matrix?.error_message || matrix?.status));
        throw new Error(`Distance Matrix API error: ${matrix?.status || 'No response'}`);
    }
    if (!matrix.rows || matrix.rows.length === 0) {
        console.error('[ALGO-DEBUG] Matrix has no rows!');
        throw new Error('Distance Matrix returned empty rows');
    }

    // Log element statuses for debugging
    for (let r = 0; r < matrix.rows.length; r++) {
        const statuses = matrix.rows[r].elements.map((e: any) => e.status);
        console.log(`[ALGO-DEBUG] Row ${r} element statuses:`, statuses.join(', '));
    }

    const elevStart = Date.now();
    const elevations = mode === 'green' ? await fetchElevations(allPoints, apiKey) : {};
    const elevTime = Date.now() - elevStart;

    const solveStart = Date.now();

    const n = allPoints.length;
    const unvisited = [...Array(n).keys()].slice(1);
    let currentIdx = 0;
    const pathIdx = [0];

    let totalDist = 0;
    let totalDur = 0;
    let totalElevGain = 0;
    let totalEnergy = 0;

    while (unvisited.length > 0) {
        let bestNext = -1;
        let bestCost = Infinity;

        for (const next of unvisited) {
            const element = matrix.rows[currentIdx]?.elements?.[next];
            
            // Skip pairs where Google couldn't find a route
            if (!element || element.status !== 'OK' || !element.distance || !element.duration) {
                console.warn(`[ALGO-DEBUG] Skipping unreachable pair: ${currentIdx} -> ${next} (status: ${element?.status})`);
                continue;
            }

            const d = element.distance.value;
            const t = element.duration.value;

            let cost = d; // Default for Standard
            if (mode === 'green') {
                const e1 = elevations[allPoints[currentIdx].id];
                const e2 = elevations[allPoints[next].id];
                cost = calculateEnergyCost(d, t, e1, e2);
            }

            if (cost < bestCost) {
                bestCost = cost;
                bestNext = next;
            }
        }

        // If no reachable next point found, break to avoid infinite loop
        if (bestNext === -1) {
            console.warn(`[ALGO-DEBUG] No reachable point from index ${currentIdx}, stopping TSP with ${unvisited.length} unvisited`);
            break;
        }

        const chosenElement = matrix.rows[currentIdx].elements[bestNext];
        totalDist += chosenElement.distance.value;
        totalDur += chosenElement.duration.value;

        if (mode === 'green') {
            const e1 = elevations[allPoints[currentIdx].id];
            const e2 = elevations[allPoints[bestNext].id];
            totalElevGain += Math.max(0, e2 - e1);
            totalEnergy += bestCost;
        }

        pathIdx.push(bestNext);
        unvisited.splice(unvisited.indexOf(bestNext), 1);
        currentIdx = bestNext;
    }

    const solveTime = Date.now() - solveStart;
    const totalTime = Date.now() - benchmarkStart;

    // ======= FYP BENCHMARK: Log Results =======
    console.log('\n========================================');
    console.log('[ALGO-BENCHMARK] ROUTE OPTIMIZATION RESULTS');
    console.log('========================================');
    console.log(`Mode:              ${mode.toUpperCase()}`);
    console.log(`Points:            ${destinations.length} destinations`);
    console.log('--- Timing ---');
    console.log(`Matrix API Time:   ${matrixTime} ms`);
    console.log(`Elevation API:     ${mode === 'green' ? elevTime + ' ms' : 'N/A (Standard mode)'}`);
    console.log(`TSP Solve Time:    ${solveTime} ms`);
    console.log(`TOTAL Time:        ${totalTime} ms`);
    console.log('--- Metrics ---');
    console.log(`Total Distance:    ${totalDist} m (${(totalDist / 1000).toFixed(2)} km)`);
    console.log(`Total Duration:    ${totalDur} s (${(totalDur / 60).toFixed(1)} min)`);
    console.log(`Elevation Gain:    ${totalElevGain.toFixed(1)} m`);
    console.log(`Energy Score:      ${(totalEnergy || totalDist).toFixed(0)} units`);
    console.log('--- Route Order ---');
    console.log(`Path:              ${pathIdx.map(i => allPoints[i].id).join(' -> ')}`);
    console.log('========================================\n');

    return {
        path: pathIdx.map(i => allPoints[i]),
        metrics: {
            distance: totalDist,
            duration: totalDur,
            elevationGain: totalElevGain,
            energyScore: totalEnergy || totalDist // Fallback to distance for store
        }
    };
}

