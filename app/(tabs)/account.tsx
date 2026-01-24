import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Linking, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

import { Assets } from "../../constants/Assets";
import { useLanguage } from "../../contexts/LanguageContext";
import { Language } from "../../i18n/translations";

// Design constants from Reference
const DESIGN = {
  colors: {
    primaryLight: "#059669", // Emerald 600
    primaryDark: "#4ade80",  // Neon Green
    backgroundLight: "#f9fafb",
    backgroundDark: "#121212",
    cardDark: "#1e1e1e",
    cardLight: "#ffffff",
    textDark: "#f1f5f9",
    textLight: "#0f172a",
    slate500: "#64748B",
    slate400: "#94A3B8",
    borderDark: "#333333",
    borderLight: "#E2E8F0",
  },
};


const SettingItem = ({
  icon,
  label,
  value,
  onPress,
  type = 'arrow',
  iconBg,
  iconColor,
  isVectorIcon = false,
  isDark,
  textColor
}: any) => (
  <TouchableOpacity
    style={[styles.settingItem, { borderBottomColor: isDark ? '#2D2D2D' : '#F1F5F9' }]}
    onPress={onPress}
    disabled={type === 'switch'}
    activeOpacity={0.7}
  >
    <View style={styles.settingLeft}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg || (isDark ? 'rgba(74, 222, 128, 0.2)' : '#DCFCE7') }]}>
        {isVectorIcon ? (
          <MaterialCommunityIcons name={icon} size={20} color={iconColor || (isDark ? DESIGN.colors.primaryDark : DESIGN.colors.primaryLight)} />
        ) : (
          <Ionicons name={icon} size={20} color={iconColor || (isDark ? DESIGN.colors.primaryDark : DESIGN.colors.primaryLight)} />
        )}
      </View>
      <Text style={[styles.settingLabel, { color: textColor }]}>{label}</Text>
    </View>
    {type === 'switch' ? (
      <Switch
        value={value}
        onValueChange={onPress}
        trackColor={{ false: "#767577", true: (isDark ? DESIGN.colors.primaryDark : DESIGN.colors.primaryLight) }}
        thumbColor={value ? "#fff" : "#f4f3f4"}
      />
    ) : (
      <Ionicons name="chevron-forward" size={20} color={isDark ? '#64748B' : '#CBD5E1'} />
    )}
  </TouchableOpacity>
);

export default function AccountScreen() {
  const { colors, isDark, toggleTheme } = useTheme(); // We will use isDark to toggle between our custom DESIGN palette
  const { t, language, setLanguage } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const primaryColor = isDark ? DESIGN.colors.primaryDark : DESIGN.colors.primaryLight;

  // Dynamic Theme Colors
  const bgColor = isDark ? DESIGN.colors.backgroundDark : DESIGN.colors.backgroundLight;
  const cardColor = isDark ? DESIGN.colors.cardDark : DESIGN.colors.cardLight;
  const textColor = isDark ? DESIGN.colors.textDark : DESIGN.colors.textLight;
  const subTextColor = isDark ? DESIGN.colors.slate400 : DESIGN.colors.slate500;
  const borderColor = isDark ? DESIGN.colors.borderDark : DESIGN.colors.borderLight;

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'zh', label: '中文 (Mandarin)', flag: '🇨🇳' },
    { code: 'ms', label: 'Bahasa Melayu', flag: '🇲🇾' }
  ];

  const handleLogout = () => {
    Alert.alert(t('profile.logout'), t('profile.logout') + "?", [
      { text: t('common.cancel'), style: "cancel" },
      {
        text: t('profile.logout'), style: "destructive", onPress: async () => {
          await signOut();
          router.replace("/login");
        }
      }
    ]);
  };
  const handleLanguageChange = () => {
    setModalVisible(true);
  };

  const handleSelectLanguage = (code: Language) => {
    setLanguage(code);
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('profile.title')}</Text>

          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: profile?.avatar_url || user?.user_metadata?.avatar_url || Assets.PLACEHOLDERS.AVATAR }}
                style={[styles.avatar, { borderColor: primaryColor }]}
              />
              <View style={[styles.editBadge, { backgroundColor: primaryColor, borderColor: bgColor }]}>
                <Ionicons name="pencil" size={12} color="#fff" />
              </View>
            </View>

            <Text style={[styles.name, { color: textColor }]}>{profile?.full_name || user?.user_metadata?.full_name || "James"}</Text>
            <Text style={[styles.email, { color: subTextColor }]}>{profile?.email || user?.email || "ionicb83@gmail.com"}</Text>

            <View style={[styles.roleBadge, { backgroundColor: 'rgba(74, 222, 128, 0.2)', borderColor: 'rgba(74, 222, 128, 0.3)' }]}>
              <Text style={[styles.roleText, { color: primaryColor }]}>GOLD COLLECTOR</Text>
            </View>
          </View>
        </View>

        {/* SETTINGS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
          <View style={[styles.cardGroup, { backgroundColor: cardColor, borderColor: borderColor }]}>
            <SettingItem
              icon="moon-outline"
              label={t('profile.darkMode')}
              value={isDark}
              onPress={toggleTheme}
              type="switch"
              iconBg={isDark ? 'rgba(99, 102, 241, 0.2)' : '#E0E7FF'} // Indigo
              iconColor={isDark ? '#818CF8' : '#4F46E5'}
              isDark={isDark}
              textColor={textColor}
            />
            <SettingItem
              icon="notifications-outline"
              label="Notifications"
              onPress={() => { }}
              iconBg={isDark ? 'rgba(74, 222, 128, 0.2)' : '#DCFCE7'} // Primary Green
              iconColor={primaryColor}
              isDark={isDark}
              textColor={textColor}
            />
            <SettingItem
              icon="globe-outline" // Language/Translate
              label={t('profile.language')}
              onPress={handleLanguageChange}
              iconBg={isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE'} // Blue
              iconColor={isDark ? '#60A5FA' : '#2563EB'}
              isDark={isDark}
              textColor={textColor}
            />
          </View>
        </View>

        {/* HELP & SUPPORT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.support')}</Text>
          <View style={[styles.cardGroup, { backgroundColor: cardColor, borderColor: borderColor }]}>
            <SettingItem
              icon="help-circle-outline"
              label={t('profile.support')}
              onPress={() => Linking.openURL('mailto:ionicb83@gmail.com')}
              iconBg={isDark ? 'rgba(249, 115, 22, 0.2)' : '#FFEDD5'} // Orange
              iconColor={isDark ? '#FB923C' : '#EA580C'}
              isDark={isDark}
              textColor={textColor}
            />
            <SettingItem
              icon="document-text-outline"
              label="Terms of Service"
              onPress={() => { }}
              iconBg={isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5'} // Emerald
              iconColor={isDark ? '#34D399' : '#059669'}
              isDark={isDark}
              textColor={textColor}
            />
          </View>
        </View>

        {/* DEVELOPER */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.developer')}</Text>
          <View style={[styles.cardGroup, { backgroundColor: cardColor, borderColor: borderColor }]}>
            <SettingItem
              icon="github"
              label={t('profile.github')}
              onPress={() => Linking.openURL('https://github.com/ionicbond12203')}
              iconBg={isDark ? '#334155' : '#F1F5F9'} // Slate
              iconColor={isDark ? '#F8FAFC' : '#0F172A'}
              isVectorIcon
              isDark={isDark}
              textColor={textColor}
            />
            <SettingItem
              icon="email-outline"
              label={t('profile.email')}
              onPress={() => Linking.openURL('mailto:ionicb83@gmail.com')}
              iconBg={isDark ? 'rgba(236, 72, 153, 0.2)' : '#FCE7F3'} // Pink
              iconColor={isDark ? '#F472B6' : '#DB2777'}
              isVectorIcon
              isDark={isDark}
              textColor={textColor}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: subTextColor }]}>App Version 2.4.0 (Build 108)</Text>
      </ScrollView>

      {/* Language Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalMenu, { backgroundColor: cardColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Select Language</Text>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  { borderBottomColor: borderColor },
                  language === lang.code && { backgroundColor: isDark ? '#2D2D2D' : '#F8FAFC' }
                ]}
                onPress={() => handleSelectLanguage(lang.code)}
              >
                <Text style={styles.flagIcon}>{lang.flag}</Text>
                <Text style={[
                  styles.languageLabel,
                  { color: textColor },
                  language === lang.code && { color: primaryColor, fontWeight: 'bold' }
                ]}>{lang.label}</Text>
                {language === lang.code && <Ionicons name="checkmark" size={20} color={primaryColor} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 24 },
  profileCard: { alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 6,
    borderRadius: 20,
    borderWidth: 4,
  },
  name: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 16 },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  roleText: {
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 8
  },
  cardGroup: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  settingLabel: { fontSize: 16, fontWeight: '600' },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 10,
    alignItems: 'center'
  },
  logoutText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#EF4444' // Red-500
  },
  version: { textAlign: 'center', marginTop: 30, fontSize: 12 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalMenu: { width: 300, borderRadius: 20, padding: 24, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  languageOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, paddingHorizontal: 4 },
  flagIcon: { fontSize: 24, marginRight: 16 },
  languageLabel: { fontSize: 16, flex: 1 },
});