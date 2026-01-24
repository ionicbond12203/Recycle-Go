// components/GlassCard.tsx
import { BlurView } from 'expo-blur';
import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface GlassCardProps {
    children: ReactNode;
    style?: ViewStyle;
    intensity?: number;
}

export function GlassCard({ children, style, intensity = 80 }: GlassCardProps) {
    const { isDark, colors } = useTheme();

    return (
        <View style={[styles.container, style]}>
            <BlurView
                intensity={intensity}
                tint={isDark ? 'dark' : 'light'}
                style={styles.blurContainer}
            >
                <View style={[styles.content, { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder }]}>
                    {children}
                </View>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    blurContainer: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    content: {
        borderRadius: 20,
        borderWidth: 1,
    },
});
