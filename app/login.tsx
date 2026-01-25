import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Dimensions, ImageBackground, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");

import { Assets } from "../constants/Assets";

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, loading, setUserRole, user, continueAsGuest, isGuest, signInAsDevAdmin } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const lastTapRef = React.useRef<number>(0);
  const tapsRef = React.useRef<number>(0);

  const handleTitlePress = () => {
    const now = Date.now();
    // Allow 1 second between taps (more forgiving)
    if (now - lastTapRef.current < 1000) {
      tapsRef.current += 1;
      console.log(`Admin tap count: ${tapsRef.current}`); // Debug log
    } else {
      tapsRef.current = 1;
    }
    lastTapRef.current = now;

    if (tapsRef.current >= 5) {
      setShowAdmin(prev => !prev);
      tapsRef.current = 0;
      // Vibration feedback (if available)
      try {
        const { Vibration } = require('react-native');
        Vibration.vibrate(100);
      } catch (e) { }
    }
  };

  // If already logged in or guest, redirect
  React.useEffect(() => {
    if (user || isGuest) {
      router.replace("/");
    }
  }, [user, isGuest]);

  const handleGoogleSignIn = async () => {
    if (showAdmin) {
      await signInWithGoogle('admin');
    } else {
      await signInWithGoogle();
    }
  };

  const handleContinueAsGuest = () => {
    continueAsGuest();
    router.replace("/contributor");
  };

  const handleDevAdminBypass = async () => {
    if (password === "12203") {
      setShowPasswordModal(false);
      setPassword("");
      await signInAsDevAdmin();
      router.replace("/admin/dashboard");
    } else {
      Alert.alert("Incorrect Password", "Access denied.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topContainer}>
        <ImageBackground source={Assets.IMAGES.LEAF_BG} style={styles.backgroundImage} resizeMode="cover">
          <Text style={styles.appTitle} onPress={handleTitlePress}>Recycle Go</Text>
        </ImageBackground>
      </View>

      <View style={styles.bottomContainer}>
        <Text style={[styles.mottoText, { color: colors.textSecondary, fontSize: 16, marginBottom: 50 }]}>
          {t('guide.plastic.title') ? t('home.welcome') : "Join the recycling revolution."}
        </Text>

        {showAdmin && (
          <View style={{ marginBottom: 20, width: '100%', alignItems: 'center' }}>
            {/* Dev Bypass Button */}
            <TouchableOpacity
              style={{
                padding: 15,
                backgroundColor: '#333',
                borderRadius: 12,
                marginBottom: 10,
                width: width * 0.85,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10
              }}
              onPress={() => setShowPasswordModal(true)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>🚀 Force Login as Dev Admin</Text>
            </TouchableOpacity>

            {user && (
              <TouchableOpacity
                style={{
                  padding: 15,
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  marginBottom: 10,
                  width: width * 0.85,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 10
                }}
                onPress={async () => {
                  try {
                    const { setAdminRole } = useAuth(); // Actually call it from the hook
                    await setAdminRole();
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>⭐ Promote Current User to Admin</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

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


        <TouchableOpacity
          style={[styles.guestButton, { borderColor: colors.primary }]}
          onPress={handleContinueAsGuest}
          disabled={loading}
        >
          <Text style={[styles.guestButtonText, { color: colors.primary }]}>
            Continue as Guest
          </Text>
        </TouchableOpacity>

        <Text style={[styles.roleHint, { color: colors.textSecondary, marginTop: 20, fontSize: 12 }]}>
          Guests can explore and scan items. Sign in to earn rewards.
        </Text>
      </View>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.passwordCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.passwordTitle, { color: colors.text }]}>Admin Access</Text>
            <TextInput
              style={[styles.passwordInput, { borderColor: colors.border, color: colors.text }]}
              placeholder="Enter password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoFocus
            />
            <View style={styles.passwordButtons}>
              <TouchableOpacity
                style={[styles.passwordButton, { backgroundColor: colors.border }]}
                onPress={() => { setShowPasswordModal(false); setPassword(""); }}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.passwordButton, { backgroundColor: colors.primary }]}
                onPress={handleDevAdminBypass}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  guestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: width * 0.85,
    marginTop: 15,
    borderWidth: 2,
    backgroundColor: 'transparent'
  },
  guestButtonText: { fontSize: 16, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  passwordCard: {
    width: width * 0.8,
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 10
  },
  passwordTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  },
  passwordInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 18
  },
  passwordButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10
  },
  passwordButton: {
    flex: 1,
    height: 45,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  }
});