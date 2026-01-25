import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
        primary: "#2D5A27",
        secondary: "#4A7043",
        background: "#F8F9F8",
        card: "#FFFFFF",
        text: "#1e293b",
        textSecondary: "#64748b",
        border: "#f1f5f9",
    },
    dark: {
        primary: "#4ADE80",
        secondary: "#2D5A27",
        background: "#121412",
        card: "#1E201E",
        text: "#f1f5f9",
        textSecondary: "#94a3b8",
        border: "#334155",
    }
};

interface HomeViewProps {
    stats: { points: number; savedCO2: string; recycled: string };
    userLocation: { latitude: number; longitude: number } | null;
    avatarUrl?: string;
    recentTransactions?: any[];
    onStartScan: () => void;
    onManualAdd: () => void;
}

export default function HomeView({ stats, userLocation, avatarUrl, recentTransactions = [], onStartScan, onManualAdd }: HomeViewProps) {
    const { t } = useLanguage();
    // ... (rest of local state) as before
    const { isDark } = useTheme();
    const theme = isDark ? CONTRIBUTOR_THEME.dark : CONTRIBUTOR_THEME.light;
    const { profile } = useAuth();
    const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

    // Dynamic Daily Tip
    const [dailyTip, setDailyTip] = useState<{ tip: string, url: string } | null>(null);

    useEffect(() => {
        getDailyTip().then(setDailyTip);
    }, []);

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
        <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 150 }}>
            {/* --- HEADER --- */}
            <View style={styles.headerContainer}>
                <View>
                    <Text style={[styles.headerGreeting, { color: theme.textSecondary }]}>{t('home.goodMorning')}</Text>
                    <Text style={[styles.headerName, { color: theme.text }]}>{displayName}</Text>
                </View>
                <View style={styles.headerActions}>
                    <LanguageSwitcher />
                    <View style={[styles.avatarContainer, { borderColor: theme.card }]}>
                        <Image source={{ uri: avatarUrl || Assets.PLACEHOLDERS.AVATAR }} style={styles.avatarImg} />
                    </View>
                </View>
            </View>

            {/* --- ENVIRONMENTAL IMPACT CARD --- */}
            <View style={styles.sectionContainer}>
                <View style={[styles.impactCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.impactHeader}>
                        <Text style={[styles.impactTitle, { color: theme.primary }]}>{t('home.environmentalImpact')}</Text>
                        <View style={[styles.periodBadge, { backgroundColor: theme.background }]}>
                            <Text style={[styles.periodText, { color: theme.textSecondary }]}>{t('home.thisMonth')}</Text>
                        </View>
                    </View>

                    <View style={styles.impactGrid}>
                        {/* Points */}
                        <View style={styles.impactItem}>
                            <View style={styles.impactIconWrap}>
                                <MaterialCommunityIcons name="star-circle" size={32} color={theme.primary} />
                            </View>
                            <Text style={[styles.impactValue, { color: theme.text }]}>{stats.points.toLocaleString()}</Text>
                            <Text style={styles.impactLabel}>{t('home.points')}</Text>
                        </View>

                        {/* CO2 (Bordered) */}
                        <View style={[styles.impactItem, styles.impactItemBorder, { borderColor: theme.border }]}>
                            <View style={styles.impactIconWrap}>
                                <MaterialCommunityIcons name="cloud-check" size={32} color={theme.primary} />
                            </View>
                            <Text style={[styles.impactValue, { color: theme.text }]}>{stats.savedCO2}</Text>
                            <Text style={styles.impactLabel}>{t('home.savedCO2')}</Text>
                        </View>

                        {/* Items */}
                        <View style={styles.impactItem}>
                            <View style={styles.impactIconWrap}>
                                <MaterialCommunityIcons name="recycle" size={32} color={theme.primary} />
                            </View>
                            <Text style={[styles.impactValue, { color: theme.text }]}>{stats.recycled}</Text>
                            <Text style={styles.impactLabel}>{t('home.itemsRecycled').toUpperCase()}</Text>
                        </View>
                    </View>
                </View>
            </View>

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
                    style={styles.tipCard} // Force Forest Green
                >
                    <View style={styles.leafDecoration}>
                        <MaterialCommunityIcons name="leaf" size={120} color="rgba(255,255,255,0.1)" />
                    </View>

                    <View style={styles.tipContentBox}>
                        <View style={styles.tipBadgeRow}>
                            <MaterialCommunityIcons name="lightbulb" size={16} color="#A7F3D0" />
                            <Text style={styles.tipBadgeText}>{t('home.dailyTip').toUpperCase()}</Text>
                        </View>
                        <Text style={styles.tipMainTitle}>{t('tips.didYouKnow')}</Text>
                        <Text style={styles.tipDescription}>
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

    // Header
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
    headerGreeting: { fontSize: 14, fontWeight: '500' },
    headerName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarContainer: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, shadowColor: "#000", shadowOpacity: 0.1, elevation: 4 },
    avatarImg: { width: '100%', height: '100%', borderRadius: 24 },

    // Sections
    sectionContainer: { paddingHorizontal: 24 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '800' },
    viewAllText: { fontSize: 14, fontWeight: '600' },

    // Impact Card
    impactCard: { borderRadius: 24, padding: 24, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 30, elevation: 2, borderWidth: 1 },
    impactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    impactTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
    periodBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    periodText: { fontSize: 12, fontWeight: '600' },
    impactGrid: { flexDirection: 'row' },
    impactItem: { flex: 1, alignItems: 'center' },
    impactItemBorder: { borderLeftWidth: 1, borderRightWidth: 1 },
    impactIconWrap: { marginBottom: 8 },
    impactValue: { fontSize: 22, fontWeight: '800' },
    impactLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', marginTop: 2, letterSpacing: 0.5 },

    // Grid
    gridContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    gridItem: { flex: 1, alignItems: 'center', gap: 8 },
    gridImageBox: { width: '100%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.05, elevation: 2 },
    gridImage: { width: '100%', height: '100%', opacity: 0.9 },
    gridLabel: { fontSize: 12, fontWeight: '600' },

    // Activity List
    activityList: { gap: 12, marginTop: 16 },
    activityCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.02, elevation: 1 },
    activityIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    activityContent: { flex: 1 },
    activityTitle: { fontSize: 14, fontWeight: '700' },
    activityTime: { fontSize: 12, marginTop: 2 },
    activityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    activityPoints: { fontSize: 12, fontWeight: '800' },
    emptyCard: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 10 },

    // Eco Tip
    tipCard: { backgroundColor: '#2D5A27', borderRadius: 24, padding: 24, overflow: 'hidden', position: 'relative', shadowColor: "#2D5A27", shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
    leafDecoration: { position: 'absolute', top: -30, right: -30, opacity: 0.2 },
    tipContentBox: { zIndex: 10, gap: 8 },
    tipBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tipBadgeText: { color: '#A7F3D0', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
    tipMainTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
    tipDescription: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 22, maxWidth: '85%' },

    // CTA Card
    ctaCard: { borderRadius: 24, padding: 20, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
    ctaContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    ctaIconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    ctaTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 4 },
    ctaDescription: { color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 18 },
    manualLink: { alignSelf: 'center', padding: 8 },
    manualLinkText: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' }
});
