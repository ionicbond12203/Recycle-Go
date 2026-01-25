import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Dimensions, Image, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { GameMechanics } from "../../constants/GameMechanics";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import LanguageSwitcher from "../LanguageSwitcher";

const { width } = Dimensions.get("window");

interface ProfileViewProps {
    stats: { points: number; savedCO2: string; recycled: string };
    user: any;
    onViewHistory: () => void;
}

export default function ProfileView({ stats, user, onViewHistory }: ProfileViewProps) {
    const { t } = useLanguage();
    const router = useRouter(); // Initialize router
    const { colors, isDark, toggleTheme } = useTheme();
    const { signOut, profile } = useAuth(); // Get profile data

    // ... (rest of gamification logic)

    // Gamification Logic
    const points = stats.points || 0;
    const levels = [
        { name: t(GameMechanics.LEVELS.NOVICE.NAME_KEY), min: GameMechanics.LEVELS.NOVICE.MIN, color: colors.levelNovice },
        { name: t(GameMechanics.LEVELS.WARRIOR.NAME_KEY), min: GameMechanics.LEVELS.WARRIOR.MIN, color: colors.levelWarrior },
        { name: t(GameMechanics.LEVELS.MASTER.NAME_KEY), min: GameMechanics.LEVELS.MASTER.MIN, color: colors.levelMaster },
        { name: t(GameMechanics.LEVELS.LEGEND.NAME_KEY), min: GameMechanics.LEVELS.LEGEND.MIN, color: colors.levelLegend }
    ];

    const currentLevelIndex = levels.slice().reverse().findIndex(l => points >= l.min);
    const actualIndex = currentLevelIndex >= 0 ? levels.length - 1 - currentLevelIndex : 0;
    const currentLevel = levels[actualIndex];
    const nextLevel = levels[actualIndex + 1];

    const progress = nextLevel ? ((points - currentLevel.min) / (nextLevel.min - currentLevel.min)) : 1;
    const pointsToNext = nextLevel ? nextLevel.min - points : 0;

    const handleLogoutAction = async () => {
        await signOut();
        router.replace("/login"); // Force navigation to login screen
    };

    const handleLogout = async () => {
        Alert.alert(
            t('auth.signingInAs'),
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                { text: t('profile.logout'), style: 'destructive', onPress: handleLogoutAction }
            ]
        );
    };

    // User Display Name
    const displayName = profile?.full_name || user?.email?.split('@')[0] || "User";
    const displayRole = profile?.role ? t(`auth.roles.${profile.role}`) : "Contributor";

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* User requested "My Profile" title to match user name */}
            <Text style={[styles.screenTitle, { color: colors.text }]}>{displayName}</Text>

            {/* Header Profile Card */}
            <View style={styles.profileHeader}>
                <Image
                    source={{ uri: user?.user_metadata?.avatar_url || "https://i.pravatar.cc/150?img=12" }}
                    style={styles.avatarLarge}
                />
                <View style={styles.profileInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{displayRole}</Text>
                    </View>
                </View>
            </View>

            {/* Gamification Stats Card */}
            <View style={[styles.statsCard, { borderColor: currentLevel.color, backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                <View style={styles.levelHeader}>
                    <View>
                        <Text style={[styles.levelLabel, { color: currentLevel.color }]}>{currentLevel.name}</Text>
                        <Text style={[styles.totalPoints, { color: colors.text }]}>{points} pts</Text>
                    </View>
                    <MaterialCommunityIcons name="trophy-award" size={40} color={currentLevel.color} />
                </View>

                {nextLevel && (
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#444' : '#F0F0F0' }]}>
                            <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: currentLevel.color }]} />
                        </View>
                        <Text style={styles.nextLevelText}>
                            {t('profile.nextLevel').replace('{points}', pointsToNext.toString())}
                        </Text>
                    </View>
                )}

                <View style={styles.miniStatsRow}>
                    <View style={styles.miniStat}>
                        <MaterialCommunityIcons name="recycle" size={20} color={colors.primary} />
                        <Text style={[styles.miniStatVal, { color: colors.text }]}>{stats.recycled}</Text>
                        <Text style={styles.miniStatLabel}>{t('home.recycled')}</Text>
                    </View>
                    <View style={[styles.miniStatDivider, { backgroundColor: colors.divider }]} />
                    <View style={styles.miniStat}>
                        <MaterialCommunityIcons name="cloud-check" size={20} color={colors.primary} />
                        <Text style={[styles.miniStatVal, { color: colors.text }]}>{stats.savedCO2}</Text>
                        <Text style={styles.miniStatLabel}>CO2</Text>
                    </View>
                </View>
            </View>

            {/* Menu Options */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.settings')}</Text>

            <View style={[styles.menuContainer, { backgroundColor: colors.card }]}>
                {/* Dark Mode Toggle */}
                <View style={[styles.menuItem, { borderBottomColor: colors.divider }]}>
                    <View style={styles.menuLeft}>
                        <Ionicons name="moon-outline" size={22} color={colors.textSecondary} />
                        <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.darkMode')}</Text>
                    </View>
                    <Switch
                        value={isDark}
                        onValueChange={toggleTheme}
                        trackColor={{ false: "#767577", true: colors.primaryLight }}
                        thumbColor={isDark ? colors.primary : "#f4f3f4"}
                    />
                </View>

                <View style={[styles.menuItem, { borderBottomColor: colors.divider }]}>
                    <View style={styles.menuLeft}>
                        <Ionicons name="language-outline" size={22} color={colors.textSecondary} />
                        <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.language')}</Text>
                    </View>
                    <LanguageSwitcher />
                </View>

                <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.divider }]} onPress={onViewHistory}>
                    <View style={styles.menuLeft}>
                        <Ionicons name="time-outline" size={22} color={colors.textSecondary} />
                        <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.viewHistory')}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.divider }]} onPress={() => Linking.openURL('mailto:ionicb83@gmail.com?subject=RecycleGo Support')}>
                    <View style={styles.menuLeft}>
                        <Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} />
                        <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.support')}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
                    <View style={styles.menuLeft}>
                        <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
                        <Text style={[styles.menuText, { color: '#D32F2F' }]}>{t('profile.logout')}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Developer Section */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.developer')}</Text>
            <View style={[styles.menuContainer, { backgroundColor: colors.card }]}>
                <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.divider }]} onPress={() => Linking.openURL('https://github.com/ionicbond12203')}>
                    <View style={styles.menuLeft}>
                        <Ionicons name="logo-github" size={22} color={colors.textSecondary} />
                        <Text style={[styles.menuText, { color: colors.text }]}>ionicbond12203</Text>
                    </View>
                    <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => Linking.openURL('mailto:ionicb83@gmail.com')}>
                    <View style={styles.menuLeft}>
                        <Ionicons name="mail-outline" size={22} color={colors.textSecondary} />
                        <Text style={[styles.menuText, { color: colors.text }]}>ionicb83@gmail.com</Text>
                    </View>
                    <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    screenTitle: { fontSize: 28, fontWeight: '800', marginTop: 20, marginBottom: 20 },

    profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    avatarLarge: { width: 80, height: 80, borderRadius: 40, marginRight: 20, borderWidth: 3, borderColor: '#fff', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 },
    profileInfo: { justifyContent: 'center' },
    userName: { fontSize: 22, fontWeight: '700' },
    roleBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginTop: 5 },
    roleText: { color: '#38761D', fontWeight: '600', fontSize: 12 },

    statsCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 30, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    levelLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    totalPoints: { fontSize: 32, fontWeight: '800', color: '#333' },

    progressContainer: { marginBottom: 20 },
    progressBarBg: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, marginBottom: 8, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
    nextLevelText: { fontSize: 12, color: '#999', textAlign: 'right' },

    miniStatsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 15 },
    miniStat: { flex: 1, alignItems: 'center' },
    miniStatVal: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 2 },
    miniStatLabel: { fontSize: 12, color: '#999' },
    miniStatDivider: { width: 1, backgroundColor: '#F0F0F0' },

    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 15 },
    menuContainer: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 20 },
    menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    menuText: { fontSize: 16, fontWeight: '500', color: '#333' }
});
