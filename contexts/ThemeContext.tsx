// contexts/ThemeContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { Colors, ColorScheme, ThemeColors } from '../constants/Colors';

interface ThemeContextType {
    theme: ColorScheme;
    colors: ThemeColors;
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (theme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@recycle_app_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const systemTheme = useRNColorScheme();
    const [theme, setThemeState] = useState<ColorScheme>('light');
    const [isLoading, setIsLoading] = useState(true);

    // Load saved theme preference on mount
    useEffect(() => {
        loadTheme();
    }, []);

    // Sync with system theme if no preference is saved
    useEffect(() => {
        if (!isLoading && systemTheme) {
            AsyncStorage.getItem(THEME_STORAGE_KEY).then((savedTheme) => {
                if (!savedTheme) {
                    setThemeState(systemTheme as ColorScheme);
                }
            });
        }
    }, [systemTheme, isLoading]);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme) {
                setThemeState(savedTheme as ColorScheme);
            } else if (systemTheme) {
                setThemeState(systemTheme as ColorScheme);
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setTheme = async (newTheme: ColorScheme) => {
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
            setThemeState(newTheme);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    const value: ThemeContextType = {
        theme,
        colors: Colors[theme],
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
    };

    if (isLoading) {
        return null; // Or a loading screen
    }

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
