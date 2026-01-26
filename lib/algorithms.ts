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
 */
export async function fetchRoadMatrix(points: Point[], apiKey: string): Promise<any> {
    const origins = points.map(p => `${p.latitude},${p.longitude}`).join('|');
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${origins}&key=${apiKey}`;
    const response = await fetch(url);
    return response.json();
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
    const allPoints = [start, ...destinations];
    const matrix = await fetchRoadMatrix(allPoints, apiKey);
    const elevations = mode === 'green' ? await fetchElevations(allPoints, apiKey) : {};

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
            const element = matrix.rows[currentIdx].elements[next];
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
