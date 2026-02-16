/**
 * Background Location Task for Collector
 * 
 * This module handles background location tracking when the collector
 * is using external Google Maps for navigation.
 * 
 * The location is synced to Supabase every 5 seconds so contributors
 * can see the collector moving on their map in real-time.
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from './supabase';

export const BACKGROUND_LOCATION_TASK = 'background-location-task';

// Store collector ID globally for the background task to access
let currentCollectorId: string | null = null;

export const setBackgroundCollectorId = (id: string | null) => {
    currentCollectorId = id;
};

// Define the background task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
        console.error('Background location error:', error);
        return;
    }

    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        const location = locations[0];

        if (location && currentCollectorId) {
            const { latitude, longitude } = location.coords;

            // Sync to Supabase
            const { error: dbError } = await supabase.from('collectors').upsert({
                id: currentCollectorId,
                latitude,
                longitude,
                updated_at: new Date().toISOString()
            });

            if (dbError) {
                console.log('Background sync error:', dbError.message);
            } else {
                console.log('Background location synced:', latitude, longitude);
            }
        }
    }
});

/**
 * Start background location tracking
 * Call this when collector starts external navigation
 */
export const startBackgroundLocationTracking = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
        console.log('Foreground location permission denied');
        return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
        console.log('Background location permission denied');
        return false;
    }

    const isTaskDefined = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);

    if (!isTaskDefined) {
        console.log('Background task not defined');
        return false;
    }

    const isTracking = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);

    if (!isTracking) {
        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Or every 10 meters
            showsBackgroundLocationIndicator: true,
            foregroundService: {
                notificationTitle: 'Recycle Go',
                notificationBody: 'Tracking your location for pickup...',
                notificationColor: '#2D5A27',
            },
        });
        console.log('Background location tracking started');
    }

    return true;
};

/**
 * Stop background location tracking
 * Call this when collector finishes the job or cancels
 */
export const stopBackgroundLocationTracking = async () => {
    const isTracking = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);

    if (isTracking) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        console.log('Background location tracking stopped');
    }
};
