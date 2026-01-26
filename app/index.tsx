//app/index.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function InitialRedirect() {
  const { user, loading, userRole, isProfileComplete, isGuest } = useAuth();
  const { colors } = useTheme();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then((value) => {
      setHasSeenOnboarding(value === 'true');
    });
  }, []);

  // Show loading while checking auth state or onboarding status
  if (loading || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show onboarding for first-time users (before login)
  if (!hasSeenOnboarding && !user && !isGuest) {
    return <Redirect href="/onboarding" />;
  }

  // Guest mode - allow limited access to contributor screen
  if (isGuest) {
    return <Redirect href="/contributor" />;
  }

  // Not logged in - go to login
  if (!user) {
    return <Redirect href="/login" />;
  }

  // Check if profile is complete
  if (!isProfileComplete) {
    return <Redirect href="/complete-profile" />;
  }

  // Logged in - route based on role
  if (userRole === 'collector') {
    return <Redirect href="/(tabs)/home" />;
  } else if (userRole === 'admin') {
    return <Redirect href="/admin/dashboard" />;
  } else {
    // Default to contributor
    return <Redirect href="/contributor" />;
  }
}