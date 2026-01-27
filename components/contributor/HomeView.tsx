import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Assets } from "../../constants/Assets";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getDailyTip } from "../../lib/gemini";
import LanguageSwitcher from "../LanguageSwitcher";
import MaterialGuideModal, { MaterialType } from "./MaterialGuideModal";
import TransactionDetailModal from "./TransactionDetailModal";

const { width } = Dimensions.get("window");

// --- THEME ---
const CONTRIBUTOR_THEME = {
    light: {
        primary: "#10B981", // Emerald 500
        primaryDark: "#064E3B", // Emerald 900
        secondary: "#34D399",
        background: "#F0FDF4", // Mint white
        card: "rgba(255, 255, 255, 0.9)",
        text: "#064E3B",
        textSecondary: "#4B5563",
        border: "rgba(16, 185, 129, 0.1)",
        headerGradient: ["#064E3B", "#10B981"],
    },
    dark: {
        primary: "#10B981",
        primaryDark: "#065F46",
        secondary: "#059669",
        background: "#022C22", // Dark Forest
        card: "rgba(6, 46, 30, 0.7)",
        text: "#ECFDF5",
        textSecondary: "#A7F3D0",
        border: "rgba(16, 185, 129, 0.2)",
        headerGradient: ["#022C22", "#064E3B"],
    }
};

interface HomeViewProps {
    stats: { points: number; savedCO2: string; recycled: string };
    userLocation: { latitude: number; longitude: number } | null;
    avatarUrl?: string;
    recentTransactions?: any[];
    onStartScan: () => void;
    onManualAdd: () => void;
    onProfilePress?: () => void;
}

export default function HomeView({ stats, userLocation, avatarUrl, recentTransactions = [], onStartScan, onManualAdd, onProfilePress }: HomeViewProps) {
    const { t, language } = useLanguage();
    // ... (rest of local state) as before
    const { isDark, colors } = useTheme();
    const theme = isDark ? CONTRIBUTOR_THEME.dark : CONTRIBUTOR_THEME.light;
    const { profile } = useAuth();
    const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

    // Dynamic Daily Tip
    const [dailyTip, setDailyTip] = useState<{ tip: string, url: string } | null>(null);

    useEffect(() => {
        getDailyTip(language).then(setDailyTip);
    }, [language]);

    // Smart name fallback
    const displayName = profile?.full_name || profile?.email?.split('@')[0] || "User";

    const CATEGORIES = [
        { id: 'plastic', name: t('materials.plastic'), image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDubuQIHxWzXLCG7hUAdpkRlPKrNftWqs22AICNsGQSbZ8A67kAVVKk1nGdDOVGD5gyc6AJcJY3CF24yPyhCg4rAWhbDY6uu8KciHdP1wmhq_iGS9_mwpmAD7tMOAnwcSkOxVLGNYzvGP8x7u3SbhO57aJPv15znJ6xSjBd-SmyLiNomC74n2r2LO6JNVGAowmonhTJbZ4YnqW4ndtJIzJxsQuEg7BJkVZCd582coMioKpE-Py0VGz7oV7yOWIAMZo74t5Oih7jvc0' },
        { id: 'glass', name: t('materials.glass'), image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNu7R6OUQoeG20KsInzCZbqXH8IqUGa2HMyIdBTS1h6WEEVVc9n7pvCCNgTRZgzTGV5J9teulqmf6NJsAqMfWF2DDq0EKnPpkMU0lOIO9MpZcGvbP1t4ro1y5RekF-F5jW2vuD3uXUItithtGhBIOaS7RQsR_OcBv958dI2W6m79PbPasNNyGg-fiiv4bu0soFz9WBoTQTjI4KqqbNoDJb6L3qZOSUedu6a6yG3aeIK7_0R6pS_ie_vMUff73wHdGaK7yVy51QwRs' },
        { id: 'aluminium', name: t('materials.aluminium'), image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuiG3T7PCojoxfdnWCXXhzu99dvvGTaBA5mr4DRsURMB5TBTGhuRYiwm_iIP71VrXufV6rghMKfqSdm5R1sNT7HAP2eq0p5V_DLxnPXXl2OGtChcuwecL9YVbOLdoIOqPwjno4u54vGHRK82z1W3XeJrECDOq4EAIoigCYMYmB81ItmaKKZyf2LR_K0_Cyh8J1nEoOVCwLgvWii4whTwVdI-cvze2NdEv6KWtX2Q1V91er73diZPmgpu5VZuZ0-7YWR1YmGyrBMTk' },
        { id: 'paper', name: t('materials.paper'), image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaLmpEqaKEXkrdZbykArvnbQLQ4N6QfZcBJSps19_jMpcRkHUmcIK41_1eoimjehUfskB9KmwgXJ7rl-QQhAZkYqtOILk2C69BgYVBNqxwt72PNfUo023Z7gPQauZaP5jWlHlb2yfy_HexRebJ1kW9ubY43qJaFtEFGmWC6fW7JWK2NXOBadHasUPvUYrmgCLEs-SXAlGRppHyoxcA8FBmp5ey_98n8w0vvR0PwYJi6uqcros1d1ItFzn0XvLQS77KoxOgU02f-BE' }
    ];

    const handleTransactionPress = (transaction: any) => {
        setSelectedTransaction(transaction);
    };

    const isNewUser = stats.points === 0 && stats.recycled === "0";

    return (
        <ScrollView style={[styles.scrollContainer, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 150 }}>
            {/* --- HERO SECTION WITH GRADIENT --- */}
            <LinearGradient
                colors={theme.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroSection}
            >
                {/* --- HEADER --- */}
                <View style={styles.headerContainer}>
                    <View>
                        <Text style={[styles.headerGreeting, { color: "rgba(255,255,255,0.6)" }]}>
                            {new Date().getHours() < 12 ? t('home.goodMorning') : t('home.goodAfternoon') || 'Welcome back'}
                        </Text>
                        <Text style={[styles.headerName, { color: "#FFF" }]}>{displayName}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <LanguageSwitcher />
                        <TouchableOpacity
                            style={[styles.avatarContainer, { borderColor: "rgba(255,255,255,0.2)" }]}
                            onPress={onProfilePress}
                            activeOpacity={0.7}
                        >
                            <Image source={{ uri: avatarUrl || Assets.PLACEHOLDERS.AVATAR }} style={styles.avatarImg} />
                            <View style={styles.onlineDot} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- ENVIRONMENTAL IMPACT CARD (GLASSMORHISM) --- */}
                <View style={styles.heroImpactContainer}>
                    <View style={[styles.impactCard, { backgroundColor: isDark ? 'rgba(2, 44, 34, 0.4)' : 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                        <View style={styles.impactHeader}>
                            <View>
                                <Text style={[styles.impactTitle, { color: '#FFF' }]}>{t('home.environmentalImpact')}</Text>
                                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700' }}>LIFETIME CONTRIBUTION</Text>
                            </View>
                            <View style={[styles.periodBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                                <Text style={[styles.periodText, { color: '#FFF' }]}>{t('home.thisMonth')}</Text>
                            </View>
                        </View>

                        <View style={styles.impactGrid}>
                            {/* Points */}
                            <View style={styles.impactItem}>
                                <Text style={[styles.impactValue, { color: '#FFF' }]}>{stats.points.toLocaleString()}</Text>
                                <Text style={[styles.impactLabel, { color: 'rgba(255,255,255,0.6)' }]}>{t('home.points')}</Text>
                            </View>

                            {/* CO2 (Bordered) */}
                            <View style={[styles.impactItem, styles.impactItemBorder, { borderColor: 'rgba(255,255,255,0.1)' }]}>
                                <Text style={[styles.impactValue, { color: colors.primary }]}>{stats.savedCO2}</Text>
                                <Text style={[styles.impactLabel, { color: 'rgba(255,255,255,0.6)' }]}>{t('home.savedCO2')}</Text>
                            </View>

                            {/* Items */}
                            <View style={styles.impactItem}>
                                <Text style={[styles.impactValue, { color: '#FFF' }]}>{stats.recycled}</Text>
                                <Text style={[styles.impactLabel, { color: 'rgba(255,255,255,0.6)' }]}>KG RECYCLED</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            {/* --- GET STARTED CTA (NEW USER) --- */}
            {isNewUser && (
                <View style={[styles.sectionContainer, { marginTop: 24 }]}>
                    <TouchableOpacity
                        style={[styles.ctaCard, { backgroundColor: theme.primary }]}
                        onPress={onStartScan}
                    >
                        <View style={styles.ctaContent}>
                            <View style={styles.ctaIconBox}>
                                <MaterialCommunityIcons name="camera-plus" size={28} color={theme.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.ctaTitle}>{t('home.startFirstScan')}</Text>
                                <Text style={styles.ctaDescription}>{t('home.startFirstScanDesc')}</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
                        </View>
                    </TouchableOpacity>
                </View>
            )}

            {/* --- RECYCLE NOW GRID --- */}
            <View style={[styles.sectionContainer, { marginTop: 32 }]}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('home.recycleNow')}</Text>
                    <TouchableOpacity onPress={onManualAdd}>
                        <Text style={[styles.viewAllText, { color: theme.primary, textDecorationLine: 'underline' }]}>
                            {t('home.cantScan')}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.gridContainer}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={styles.gridItem}
                            onPress={() => setSelectedMaterial(cat.id as MaterialType)}
                        >
                            <View style={[styles.gridImageBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <Image source={{ uri: cat.image }} style={styles.gridImage} resizeMode="cover" />
                            </View>
                            <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* --- RECENT ACTIVITY --- */}
            <View style={[styles.sectionContainer, { marginTop: 32 }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('home.recentActivity')}</Text>

                {recentTransactions && recentTransactions.length > 0 ? (
                    <View style={styles.activityList}>
                        {recentTransactions.map((t, i) => (
                            <TouchableOpacity key={i} style={[styles.activityCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => handleTransactionPress(t)}>
                                <View style={[styles.activityIconCircle, { backgroundColor: isDark ? 'rgba(74,222,128,0.2)' : '#ecfdf5' }]}>
                                    <MaterialCommunityIcons name="check-decagram" size={24} color={theme.primary} />
                                </View>
                                <View style={styles.activityContent}>
                                    <Text style={[styles.activityTitle, { color: theme.text }]}>{t.weight_kg}kg Recycled</Text>
                                    <Text style={[styles.activityTime, { color: theme.textSecondary }]}>{new Date(t.created_at).toLocaleString()}</Text>
                                </View>
                                <View style={[styles.activityBadge, { backgroundColor: isDark ? 'rgba(74,222,128,0.1)' : '#ecfdf5' }]}>
                                    <Text style={[styles.activityPoints, { color: theme.primary }]}>+{Math.round(t.weight_kg * 10)} pts</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
                        <Text style={{ color: theme.textSecondary }}>{t('home.noProcessingActivity')}</Text>
                    </View>
                )}
            </View>

            {/* --- DAILY ECO-TIP --- */}
            <View style={[styles.sectionContainer, { marginTop: 32, marginBottom: 20 }]}>
                <TouchableOpacity
                    activeOpacity={dailyTip?.url ? 0.9 : 1}
                    onPress={() => dailyTip?.url && Linking.openURL(dailyTip.url)}
                    style={[styles.tipCard, { shadowColor: theme.primary }]}
                >
                    <LinearGradient
                        colors={theme.headerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.leafDecoration}>
                        <MaterialCommunityIcons name="leaf" size={120} color="rgba(255,255,255,0.1)" />
                    </View>

                    <View style={styles.tipContentBox}>
                        <View style={styles.tipBadgeRow}>
                            <MaterialCommunityIcons name="lightbulb" size={16} color="#A7F3D0" />
                            <Text style={styles.tipBadgeText}>{t('home.dailyTip').toUpperCase()}</Text>
                        </View>
                        <Text style={styles.tipMainTitle}>{t('tips.didYouKnow')}</Text>
                        <Text style={[styles.tipDescription, { color: "#FFF" }]}>
                            {dailyTip ? dailyTip.tip : "Rinsing plastic containers before recycling prevents contamination and helps save energy in the processing cycle."}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            <MaterialGuideModal
                visible={!!selectedMaterial}
                material={selectedMaterial}
                onClose={() => setSelectedMaterial(null)}
            />
            <TransactionDetailModal
                visible={!!selectedTransaction}
                transaction={selectedTransaction}
                onClose={() => setSelectedTransaction(null)}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: { flex: 1 },
    heroSection: { paddingTop: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingBottom: 30, marginBottom: 10 },
    // Header
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 10, marginBottom: 10 },
    headerGreeting: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    headerName: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatarContainer: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, position: 'relative' },
    avatarImg: { width: '100%', height: '100%', borderRadius: 24 },
    onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4ADE80', borderWidth: 2, borderColor: '#064E3B' },

    // Sections
    sectionContainer: { paddingHorizontal: 24 },
    heroImpactContainer: { paddingHorizontal: 20, paddingVertical: 10 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
    sectionTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    viewAllText: { fontSize: 13, fontWeight: '800' },

    // Impact Card
    impactCard: { borderRadius: 32, padding: 24, shadowOpacity: 0.2, shadowRadius: 20, elevation: 15, borderWidth: 1 },
    impactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    impactTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    periodBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    periodText: { fontSize: 10, fontWeight: '900' },
    impactGrid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    impactItem: { flex: 1, alignItems: 'center' },
    impactItemBorder: { borderLeftWidth: 1, borderRightWidth: 1 },
    impactValue: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
    impactLabel: { fontSize: 10, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 },

    // Grid
    gridContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    gridItem: { flex: 1, alignItems: 'center', gap: 10 },
    gridImageBox: { width: '100%', aspectRatio: 1, borderRadius: 24, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    gridImage: { width: '100%', height: '100%', opacity: 1 },
    gridLabel: { fontSize: 12, fontWeight: '700' },

    // Activity List
    activityList: { gap: 12, marginTop: 8 },
    activityCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 24, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    activityIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    activityContent: { flex: 1 },
    activityTitle: { fontSize: 16, fontWeight: '800' },
    activityTime: { fontSize: 12, fontWeight: '500', opacity: 0.6 },
    activityBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    activityPoints: { fontSize: 13, fontWeight: '900' },
    emptyCard: { padding: 30, borderRadius: 24, alignItems: 'center', marginTop: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' },

    // Eco Tip
    tipCard: { borderRadius: 30, padding: 24, overflow: 'hidden', position: 'relative', shadowOpacity: 0.4, shadowRadius: 15, elevation: 12 },
    leafDecoration: { position: 'absolute', top: -30, right: -30, opacity: 0.2 },
    tipContentBox: { zIndex: 10, gap: 10 },
    tipBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tipBadgeText: { color: '#A7F3D0', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
    tipMainTitle: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    tipDescription: { fontSize: 15, lineHeight: 24, fontWeight: '500', opacity: 0.9, maxWidth: '90%' },

    // CTA Card
    ctaCard: { borderRadius: 28, padding: 24, shadowColor: "#10B981", shadowOpacity: 0.4, shadowRadius: 15, elevation: 12 },
    ctaContent: { flexDirection: 'row', alignItems: 'center', gap: 18 },
    ctaIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.1, elevation: 5 },
    ctaTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 4 },
    ctaDescription: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20 },
    manualLink: { alignSelf: 'center', padding: 10 },
    manualLinkText: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' }
});
