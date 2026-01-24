//app/index.tsx
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function InitialRedirect() {
  const { user, loading, userRole, isProfileComplete } = useAuth();
  const { colors } = useTheme();

  // Show loading while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Not logged in - go to onboarding
  if (!user) {
    return <Redirect href="/onboarding" />;
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