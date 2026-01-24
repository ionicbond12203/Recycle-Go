// constants/Colors.ts
export const Colors = {
    light: {
        // Primary Colors
        primary: '#38761D',
        primaryLight: '#7CB342', // mixed usage?
        primaryDark: '#2F5233',

        // Secondary Colors
        secondary: '#66BB6A',
        accent: '#4CAF50',

        // Background
        background: '#FFFFFF',
        backgroundSecondary: '#F5F5F5',
        card: '#FFFFFF',

        // Text
        text: '#333333',
        textSecondary: '#666666',
        textTertiary: '#999999',
        textInverse: '#FFFFFF',

        // UI Elements
        border: '#E0E0E0',
        divider: '#F0F0F0',
        shadow: 'rgba(0, 0, 0, 0.1)',
        overlay: 'rgba(0, 0, 0, 0.5)',

        // Status Colors
        success: '#4CAF50',
        warning: '#FFA726',
        error: '#D32F2F',
        info: '#2196F3',

        // Glassmorphism
        glassBackground: 'rgba(255, 255, 255, 0.85)',
        glassBorder: 'rgba(255, 255, 255, 0.3)',

        // Charts
        chartBlue: '#2196F3',
        chartOrange: '#FF9800',

        // Chat
        userBubble: '#38761D',
        botBubble: '#FFFFFF',

        // Specifics
        errorBackground: '#ffebee',

        // Map
        mapMarker: '#38761D',
        mapRoute: '#7CB342',

        // Materials
        materials: {
            plastic: '#FF9800',
            glass: '#2196F3',
            aluminium: '#9E9E9E',
            paper: '#795548',
        },

        // Components
        progressBarBackground: '#F0F0F0',
        badgeBackground: '#E8F5E9',
        switchTrackOff: '#767577',
        switchThumbOff: '#f4f3f4',
        tipBackground: '#FFF9C4',
        tipBorder: '#FBC02D',
        tipText: '#F57F17',
        tipContent: '#444444',
        statCardBackground: '#38761D',
        iconBackground: '#E8F5E9',

        // Onboarding
        onboardingAction: '#2e7c82',

        // Gamification
        levelNovice: '#8D6E63',
        levelWarrior: '#CD7F32', // Bronze
        levelMaster: '#C0C0C0',  // Silver
        levelLegend: '#FFD700',  // Gold

        // Tracking
        trackingPink: '#FF4081',
        trackingPinkLight: '#FCE4EC',
        truckMarkerBg: '#FF4081',
    },

    dark: {
        // Primary Colors
        primary: '#66BB6A',
        primaryLight: '#81C784',
        primaryDark: '#4CAF50',

        // Secondary Colors
        secondary: '#7CB342',
        accent: '#8BC34A',

        // Background
        background: '#121212',
        backgroundSecondary: '#1E1E1E',
        card: '#2C2C2C',

        // Text
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        textTertiary: '#808080',
        textInverse: '#121212',

        // UI Elements
        border: '#3A3A3A',
        divider: '#2A2A2A',
        shadow: 'rgba(0, 0, 0, 0.3)',
        overlay: 'rgba(0, 0, 0, 0.7)',

        // Status Colors
        success: '#66BB6A',
        warning: '#FFB74D',
        error: '#EF5350',
        info: '#42A5F5',

        // Charts
        chartBlue: '#42A5F5',
        chartOrange: '#FFB74D',

        // Chat
        userBubble: '#66BB6A',
        botBubble: '#2C2C2C',

        // Specifics
        errorBackground: '#b71c1c',

        // Glassmorphism
        glassBackground: 'rgba(44, 44, 44, 0.85)',
        glassBorder: 'rgba(255, 255, 255, 0.1)',

        // Map
        mapMarker: '#66BB6A',
        mapRoute: '#81C784',

        // Materials
        materials: {
            plastic: '#FF9800',
            glass: '#2196F3',
            aluminium: '#BDBDBD', // Lighter for dark mode? Or same? Let's keep distinct or slightly adjusted
            paper: '#8D6E63',
        },

        // Components
        progressBarBackground: '#444444',
        badgeBackground: '#1B5E20',
        switchTrackOff: '#767577',
        switchThumbOff: '#f4f3f4',
        tipBackground: '#4A3B0F',
        tipBorder: '#FBC02D',
        tipText: '#FDD835',
        tipContent: '#EEEEEE',
        statCardBackground: '#38761D', // Keep signature green or darken to #2E7D32? Keeping consistent with brand for now.
        iconBackground: '#1a331a',

        // Gamification
        levelNovice: '#8D6E63',
        levelWarrior: '#CD7F32', // Bronze
        levelMaster: '#C0C0C0',  // Silver
        levelLegend: '#FFD700',  // Gold

        // Tracking
        trackingPink: '#FF4081',
        trackingPinkLight: '#3d0014', // Darker for dark mode
        truckMarkerBg: '#FF4081',

        // Onboarding
        onboardingAction: '#2e7c82',
    },
};

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;
