// lib/vision.ts
import { Alert } from "react-native";

const GOOGLE_CLOUD_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!;
const API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`;

export interface VisionResponse {
    labelAnnotations?: { description: string; score: number }[];
    error?: any;
}

/**
 * Analyzes an image using Google Cloud Vision API to identify recyclable objects.
 * Uses multiple detection features for better accuracy.
 * @param base64Image The base64 encoded image string.
 * @returns List of labels found in the image.
 */
export async function analyzeImage(base64Image: string): Promise<string[]> {
    try {
        const body = {
            requests: [
                {
                    image: {
                        content: base64Image,
                    },
                    features: [
                        {
                            type: "LABEL_DETECTION",
                            maxResults: 10, // Increased for more context
                        },
                        {
                            type: "OBJECT_LOCALIZATION",
                            maxResults: 5, // Detect specific objects
                        },
                        {
                            type: "TEXT_DETECTION",
                            maxResults: 3, // Read text on packaging
                        },
                    ],
                },
            ],
        };

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!data.responses || !data.responses[0]) {
            console.warn("Vision API response empty");
            return [];
        }

        const result = data.responses[0];
        const allLabels: string[] = [];

        // Extract labels from LABEL_DETECTION
        if (result.labelAnnotations) {
            const labels = result.labelAnnotations
                .filter((label: any) => label.score > 0.6) // Only high-confidence labels
                .map((label: any) => label.description);
            allLabels.push(...labels);
        }

        // Extract objects from OBJECT_LOCALIZATION
        if (result.localizedObjectAnnotations) {
            const objects = result.localizedObjectAnnotations
                .filter((obj: any) => obj.score > 0.5)
                .map((obj: any) => obj.name);
            allLabels.push(...objects);
        }

        // Extract text from TEXT_DETECTION (useful for reading "PLASTIC", "GLASS" etc on packaging)
        if (result.textAnnotations && result.textAnnotations.length > 0) {
            // First annotation is the full text, skip it and get individual words
            const texts = result.textAnnotations
                .slice(1, 6) // Get first 5 text blocks
                .map((text: any) => text.description.toLowerCase());
            allLabels.push(...texts);
        }

        console.log("Extracted labels:", allLabels);
        return [...new Set(allLabels)]; // Remove duplicates
    } catch (error) {
        console.error("Error calling Vision API:", error);
        Alert.alert("Error", "Failed to analyze image. Please check your API key and internet connection.");
        return [];
    }
}

