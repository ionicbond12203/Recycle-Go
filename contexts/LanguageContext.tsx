import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, translations } from '../i18n/translations';

// Recursive type helper for nested keys (optional for strict typing, keeping simple for now)
type Translations = typeof translations.en;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    t: (key: string) => any; // Using simplified getter
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const stored = await AsyncStorage.getItem('app-language');
            if (stored && (stored === 'en' || stored === 'zh' || stored === 'ms')) {
                setLanguageState(stored as Language);
            }
        } catch (e) {
            console.error("Failed to load language", e);
        }
    };

    const setLanguage = async (lang: Language) => {
        try {
            setLanguageState(lang);
            await AsyncStorage.setItem('app-language', lang);
        } catch (e) {
            console.error("Failed to save language", e);
        }
    };

    // Helper to get nested value "home.welcome"
    const t = (path: string) => {
        const keys = path.split('.');
        let current: any = translations[language];
        for (const k of keys) {
            if (current[k] === undefined) {
                // Fallback to English if missing
                let fallback: any = translations['en'];
                for (const fbK of keys) {
                    fallback = fallback?.[fbK];
                }
                return fallback || path;
            }
            current = current[k];
        }
        return current;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
