/**
 * @fileoverview Tab Navigator Layout for Collector Role
 *
 * This layout defines the bottom tab navigation structure for collectors.
 * It uses expo-router's file-based routing where each Tab.Screen corresponds
 * to a file in the (tabs) directory.
 *
 * @remarks
 * The tab bar is intentionally hidden on the home screen (map view) to maximize
 * screen real estate for the interactive map. Other screens display the tab bar
 * normally.
 *
 * @see {@link https://docs.expo.dev/router/advanced/tabs/} for Expo Router tabs documentation
 */

import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Root layout component for the collector's tab navigation.
 *
 * @returns The tab navigator wrapped in a SafeAreaView for proper device inset handling.
 *
 * @remarks
 * Why SafeAreaView wraps Tabs:
 * - Ensures consistent bottom padding across devices with different home indicators
 * - Only 'bottom' edge is specified because header handling is delegated to individual screens
 *
 * Why theme context is used:
 * - All colors are derived from ThemeContext to support light/dark mode switching
 * - Prevents hardcoded color values that would break theme consistency
 */
export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={[]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarShowLabel: true,

          /**
           * Premium Floating Tab Bar Styling
           * Matches the Contributor's aesthetic with absolute positioning,
           * translucency, and a rounded pill container.
           */
          tabBarStyle: {
            position: 'absolute',
            bottom: insets.bottom + 10,
            left: 24,
            right: 24,
            height: 68,
            borderRadius: 34,
            backgroundColor: isDark ? 'rgba(30, 32, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderTopWidth: 0,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 10,
            paddingBottom: 10,
            paddingTop: 10,
          },

          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            marginBottom: 4,
          }
        }}>

        {/* 
          HOME TAB - Collector Map View
          tabBarStyle: { display: 'none' } hides the tab bar on this screen
          to maximize map visibility and provide an immersive experience.
        */}
        <Tabs.Screen
          name="home"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
            tabBarStyle: { display: 'none' } // Hidden for full-screen map UX
          }}
        />

        {/* EARNINGS TAB - Displays collector's earnings history and pending payouts */}
        <Tabs.Screen
          name="earnings"
          options={{
            title: t('tabs.earnings'),
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="wallet" size={24} color={color} />,
          }}
        />

        {/* ACCOUNT TAB - Profile settings, preferences, and logout functionality */}
        <Tabs.Screen
          name="account"
          options={{
            title: t('tabs.account'),
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account" size={24} color={color} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
