// lib/algorithms.ts

export interface Point {
    id: string | number;
    latitude: number;
    longitude: number;
}

/**
 * Calculates the Haversine distance between two points in meters.
 */
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Solves the Traveling Salesperson Problem (TSP) using a Greedy Nearest Neighbor approach.
 * 
 * @param start The starting location (Collector).
 * @param destinations List of locations to visit (Contributors).
 * @returns An ordered list of points representing the optimal path.
 */
export function optimizeRoute(start: Point, destinations: Point[]): Point[] {
    if (destinations.length === 0) return [];

    const unvisited = [...destinations];
    const path: Point[] = [];
    let current = start;

    while (unvisited.length > 0) {
        let nearestIndex = -1;
        let minDistance = Infinity;

        // Find the nearest unvisited neighbor
        for (let i = 0; i < unvisited.length; i++) {
            const dist = getDistance(
                current.latitude,
                current.longitude,
                unvisited[i].latitude,
                unvisited[i].longitude
            );

            if (dist < minDistance) {
                minDistance = dist;
                nearestIndex = i;
            }
        }

        // Move to the nearest neighbor
        if (nearestIndex !== -1) {
            const nextStop = unvisited[nearestIndex];
            path.push(nextStop);
            current = nextStop;
            unvisited.splice(nearestIndex, 1);
        }
    }

    return path;
}

/**
 * Calculates the total distance of a path.
 */
export function calculatePathDistance(start: Point, path: Point[]): number {
    if (path.length === 0) return 0;

    let totalDist = getDistance(start.latitude, start.longitude, path[0].latitude, path[0].longitude);

    for (let i = 0; i < path.length - 1; i++) {
        totalDist += getDistance(path[i].latitude, path[i].longitude, path[i + 1].latitude, path[i + 1].longitude);
    }

    return totalDist;
}

/**
 * Solves TSP using a "Green" approach (2-Opt Optimization on top of Greedy).
 * This generally produces a shorter (more fuel-efficient) path than simple Greedy.
 * 
 * @param start The starting location.
 * @param destinations List of locations to visit.
 * @returns An optimized list of points.
 */
export function optimizeRouteGreen(start: Point, destinations: Point[]): Point[] {
    // 1. Get initial greedy solution
    let currentPath = optimizeRoute(start, destinations);

    if (currentPath.length < 2) return currentPath;

    // 2. Apply 2-Opt optimization
    // This algorithm swaps edges to uncross paths, reducing total distance.
    let improved = true;
    while (improved) {
        improved = false;
        for (let i = 0; i < currentPath.length - 1; i++) {
            for (let j = i + 1; j < currentPath.length; j++) {
                // Determine segments
                // Current order: ... -> i -> i+1 -> ... -> j -> j+1 -> ...
                // New order:     ... -> i -> j -> ... -> i+1 -> j+1 -> ...
                // effectively reversing the segment between i+1 and j

                if (j - i === 1) continue; // No change for adjacent nodes

                // Check if swapping reduces distance
                // Note: accurate 2-opt check would need detailed segment calc, 
                // but for simplicity we can just measure total path or local delta.

                const newPath = [...currentPath];
                // Reverse segment [i+1, j]
                const segment = newPath.slice(i + 1, j + 1).reverse();
                newPath.splice(i + 1, j - i, ...segment);

                const currentDist = calculatePathDistance(start, currentPath);
                const newDist = calculatePathDistance(start, newPath);

                if (newDist < currentDist) {
                    currentPath = newPath;
                    improved = true;
                }
            }
        }
    }

    return currentPath;
}
