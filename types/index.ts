// types/index.ts
// Shared type definitions to avoid duplication (DRY principle)

/**
 * Chat message used by ChatModal, home.tsx collector chat, and messaging systems.
 * Consolidates the previously duplicated Message interfaces.
 */
export interface ChatMessage {
    id: number | string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
}

/**
 * Job interface for collector pickup requests.
 * Previously defined inline in home.tsx.
 */
export interface Job {
    id: string;
    latitude: number;
    longitude: number;
    address: string;
    wasteType: string[];
    status: 'pending' | 'accepted' | 'completed' | 'assigned';
    distanceLabel: string;
    rawDistance: number;
    phoneNumber?: string;
    contributorName?: string;
    contributorAvatar?: string;
}

/**
 * Transaction interface for recycling missions.
 */
export interface Transaction {
    id: string;
    collector_id: string;
    contributor_id: string;
    weight_kg: number;
    status: 'pending' | 'confirmed' | 'rejected';
    commission_amount: number;
    created_at: string;
    contributors?: {
        name: string;
        address: string;
    };
}

/**
 * App state for collector home screen navigation flow.
 */
export type CollectorAppState = 'idle' | 'searching' | 'request_received' | 'navigating' | 'driving' | 'arrived' | 'completed';

/**
 * Map type for toggle functionality.
 */
export type MapType = 'standard' | 'satellite' | 'hybrid';
