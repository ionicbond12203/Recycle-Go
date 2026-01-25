import 'dotenv/config';
import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: config.name ?? "Recycle Go",
    slug: config.slug ?? "recycle-go",
    android: {
        ...config.android,
        config: {
            ...config.android?.config,
            googleMaps: {
                apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
            }
        }
    }
});
