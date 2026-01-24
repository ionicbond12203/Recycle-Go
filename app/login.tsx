import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Dimensions, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth, UserRole } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");

import { Assets } from "../constants/Assets";

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, loading, setUserRole, user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<UserRole>('contributor');
  const [showAdmin, setShowAdmin] = useState(false);
  const lastTapRef = React.useRef<number>(0);
  const tapsRef = React.useRef<number>(0);

  const handleTitlePress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 500) {
      tapsRef.current += 1;
    } else {
      tapsRef.current = 1;
    }
    lastTapRef.current = now;

    if (tapsRef.current === 5) {
      setShowAdmin(prev => !prev);
      tapsRef.current = 0;
    }
  };

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      // We rely on the AuthContext to calculate isProfileComplete
      // But we can also check here if we want instant feedback, 
      // though rerouting might happen via index or layout effectively.
      // Ideally, we just push to the root and let index.tsx handle dispatching.

      router.replace("/");
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    // Set role before signing in so it's available during profile creation
    setUserRole(selectedRole);
    await signInWithGoogle(selectedRole);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topContainer}>
        <ImageBackground source={Assets.IMAGES.LEAF_BG} style={styles.backgroundImage} resizeMode="cover">
          <Text style={styles.appTitle} onPress={handleTitlePress}>Recycle Go</Text>
        </ImageBackground>
      </View>

      <View style={styles.bottomContainer}>
        <Text style={[styles.mottoText, { color: colors.primaryDark }]}>{t('auth.selectRole')}</Text>

        <View style={styles.roleContainer}>
          {(['contributor', 'collector', ...(showAdmin ? ['admin'] : [])] as UserRole[]).map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleButton,
                { borderColor: colors.primary },
                selectedRole === role && { backgroundColor: colors.primary }
              ]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[
                styles.roleButtonText,
                { color: colors.primary },
                selectedRole === role && { color: colors.textInverse }
              ]}>
                {t(`auth.roles.${role}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.googleButton, { backgroundColor: colors.primary }]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {t('actions.signInGoogle')}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.roleHint, { color: colors.textSecondary }]}>
          {t('auth.signingInAs')}: {t(`auth.roles.${selectedRole}`)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topContainer: { flex: 0.4, width: '100%' },
  backgroundImage: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, 0.3)', overflow: 'hidden', borderBottomLeftRadius: 50 },
  appTitle: { fontSize: 40, fontWeight: "bold", color: "#fff", textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 5, marginTop: height * 0.05 },
  bottomContainer: { flex: 0.6, padding: 30, paddingTop: 30, alignItems: "center" },
  mottoText: { fontSize: 20, fontWeight: "600", textAlign: "center", marginBottom: 30 },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  roleButton: { flex: 1, paddingVertical: 10, marginHorizontal: 5, borderRadius: 8, borderWidth: 1, alignItems: 'center', backgroundColor: '#fff' },
  roleButtonText: { fontWeight: "600", fontSize: 14 },
  googleButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 8, paddingVertical: 15, paddingHorizontal: 20, width: width * 0.85, marginTop: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  roleHint: { marginTop: 20, fontSize: 14 },
});