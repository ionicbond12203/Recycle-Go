import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

export type MaterialType = 'plastic' | 'glass' | 'aluminium' | 'paper';

interface MaterialGuideModalProps {
    visible: boolean;
    material: MaterialType | null;
    onClose: () => void;
}

// --- THEME CONSTANTS (Tailwind Match) ---
const GUIDE_THEME = {
    light: {
        card: "#FFFFFF",
        text: "#1e293b", // slate-800
        textSecondary: "#475569", // slate-600

        // Orange (Header)
        orangeBg: "#fff7ed",
        orangeBorder: "#ffedd5",
        orangeIcon: "#f97316",

        // Emerald (Do)
        emeraldBg: "#ecfdf5",
        emeraldBorder: "#d1fae5",
        emeraldText: "#047857",
        emeraldIcon: "#34d399",

        // Rose (Don't)
        roseBg: "#fff1f2",
        roseBorder: "#ffe4e6",
        roseText: "#be123c",
        roseIcon: "#fb7185",

        primaryBtn: "#10B981", // Eco Vibrant
    },
    dark: {
        card: "#0f172a", // slate-900
        text: "#f1f5f9",
        textSecondary: "#94a3b8",

        // Orange
        orangeBg: "rgba(124, 45, 18, 0.2)",
        orangeBorder: "rgba(154, 52, 18, 0.3)",
        orangeIcon: "#fdba74",

        // Emerald
        emeraldBg: "rgba(6, 78, 59, 0.3)",
        emeraldBorder: "rgba(6, 95, 70, 0.4)",
        emeraldText: "#34d399",
        emeraldIcon: "#10b981",

        // Rose
        roseBg: "rgba(136, 19, 55, 0.3)", // rose-900/30
        roseBorder: "rgba(159, 18, 57, 0.4)",
        roseText: "#fb7185",
        roseIcon: "#f43f5e",

        primaryBtn: "#059669",
    }
};

export default function MaterialGuideModal({ visible, material, onClose }: MaterialGuideModalProps) {
    const { t } = useLanguage();
    const { isDark } = useTheme();

    // Select Guide Theme
    const theme = isDark ? GUIDE_THEME.dark : GUIDE_THEME.light;

    if (!material) return null;

    const content = t(`guide.${material}`);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.modalCard, { backgroundColor: theme.card }]}>

                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>

                    {/* Header Icon */}
                    <View style={[styles.headerIconContainer, { backgroundColor: theme.orangeBg, borderColor: theme.orangeBorder }]}>
                        <MaterialIcons name="recycling" size={40} color={theme.orangeIcon} />
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: theme.text }]}>
                        {content.title} {t('actions.recyclingGuide')}
                    </Text>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* DO Recycle Section */}
                        <View style={[styles.sectionBox, { backgroundColor: theme.emeraldBg, borderColor: theme.emeraldBorder }]}>
                            <View style={styles.sectionHeaderRow}>
                                <MaterialIcons name="check-circle" size={20} color={theme.emeraldText} />
                                <Text style={[styles.sectionTitle, { color: theme.emeraldText }]}>{t('actions.doRecycle')}</Text>
                            </View>
                            <View style={styles.listContainer}>
                                {content.dos && content.dos.map((item: string, index: number) => (
                                    <View key={index} style={styles.listItem}>
                                        <View style={[styles.bullet, { backgroundColor: theme.emeraldIcon }]} />
                                        <Text style={[styles.listText, { color: theme.textSecondary }]}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* DON'T Recycle Section */}
                        <View style={[styles.sectionBox, { backgroundColor: theme.roseBg, borderColor: theme.roseBorder }]}>
                            <View style={styles.sectionHeaderRow}>
                                <MaterialIcons name="cancel" size={20} color={theme.roseText} />
                                <Text style={[styles.sectionTitle, { color: theme.roseText }]}>{t('actions.dontRecycle')}</Text>
                            </View>
                            <View style={styles.listContainer}>
                                {content.donts && content.donts.map((item: string, index: number) => (
                                    <View key={index} style={styles.listItem}>
                                        <View style={[styles.bullet, { backgroundColor: theme.roseIcon }]} />
                                        <Text style={[styles.listText, { color: theme.textSecondary }]}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                    </ScrollView>

                    {/* Footer Button */}
                    <TouchableOpacity
                        style={[styles.gotItButton, { backgroundColor: theme.primaryBtn, shadowColor: theme.primaryBtn }]}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.gotItText}>{t('actions.gotIt')}</Text>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
}


const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalCard: { borderRadius: 40, padding: 32, width: '100%', maxHeight: '85%', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },

    closeButton: { position: 'absolute', top: 24, right: 24, padding: 8, zIndex: 10 },

    headerIconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1 },

    title: { fontSize: 24, fontWeight: '800', marginBottom: 24, textAlign: 'center', letterSpacing: -0.5 },

    scrollContent: { width: '100%', marginBottom: 24 },

    sectionBox: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

    listContainer: { gap: 8 },
    listItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    bullet: { width: 6, height: 6, borderRadius: 3 },
    listText: { fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 18 },

    gotItButton: { width: '100%', paddingVertical: 18, borderRadius: 100, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    gotItText: { color: '#ffffff', fontWeight: '700', fontSize: 16 }
});
