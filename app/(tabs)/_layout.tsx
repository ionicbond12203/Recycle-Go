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

import { FontAwesome, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  // Extract theme colors for dynamic styling based on current theme (light/dark)
  const { colors } = useTheme();

  // Translation function for internationalized tab labels (EN/ZH/MS support)
  const { t } = useLanguage();

  return (
    /**
     * SafeAreaView ensures content respects device safe areas.
     * Background color matches theme to prevent white flash on dark mode.
     * Only 'bottom' edge is used—top insets are handled by individual screen headers.
     */
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <Tabs
        screenOptions={{
          // Headers are managed by individual screens for more granular control
          headerShown: false,

          // Tab bar color states - uses semantic theme colors for consistency
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,

          tabBarShowLabel: true,

          /**
           * Tab bar container styling.
           * Height of 60px provides comfortable touch targets for icons + labels.
           * Elevation: 0 removes Android shadow for a flatter, modern appearance.
           */
          tabBarStyle: {
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            elevation: 0, // Removes Android shadow for cleaner look
          },

          /**
           * Tab label typography.
           * Font size 10 keeps labels compact while remaining legible.
           * Weight 600 (semi-bold) improves readability at small sizes.
           */
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginBottom: 5,
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

        {/* INBOX TAB - Notifications and messages from admin/system */}
        <Tabs.Screen
          name="inbox"
          options={{
            title: t('tabs.inbox'),
            tabBarIcon: ({ color }) => <MaterialIcons name="mail" size={24} color={color} />,
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
