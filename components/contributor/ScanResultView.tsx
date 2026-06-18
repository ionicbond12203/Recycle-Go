import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";

interface ScannedItem {
    imageUri: string;
    labels: string[];
    material: string;
    points: number;
    co2: string;
    name: string;
    recyclable: boolean;
}

interface ScanResultProps {
    item: ScannedItem;
    onAddToCart: () => void;
    onCancel: () => void;
}

export default function ScanResultView({ item, onAddToCart, onCancel }: ScanResultProps) {
    const { t } = useLanguage();
    const { colors } = useTheme();
    const statusColor = item.recyclable ? colors.success : colors.error;
    const topLabels = item.labels.slice(0, 3);

    return (
        <View style={[styles.fullScreenContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={[styles.resultImageContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <LinearGradient
                    colors={[colors.card, colors.backgroundSecondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.resultImageStage, { borderColor: colors.border, shadowColor: colors.shadow }]}
                >
                    <View style={[styles.scanBadge, { backgroundColor: colors.primary + '18' }]}>
                        <Ionicons name="scan-outline" size={16} color={colors.primary} />
                        <Text style={[styles.scanBadgeText, { color: colors.primary }]}>Vision analysis</Text>
                    </View>
                    <Image source={{ uri: item.imageUri }} style={styles.resultImage} resizeMode="contain" />
                </LinearGradient>
                <View style={styles.bracketsContainer}>
                    <View style={[styles.bracket, styles.bracketTL]} />
                    <View style={[styles.bracket, styles.bracketTR]} />
                    <View style={[styles.bracket, styles.bracketBL]} />
                    <View style={[styles.bracket, styles.bracketBR]} />
                </View>
                <TouchableOpacity style={[styles.backButtonAbsolute, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onCancel}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
            </View>

            <View style={[styles.resultDetailsCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }]}>
                <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
                    <Ionicons name={item.recyclable ? "checkmark-circle" : "alert-circle"} size={18} color={statusColor} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {item.recyclable ? "Recyclable item detected" : "Not accepted for pickup"}
                    </Text>
                </View>
                <Text style={[styles.resultItemName, { color: colors.text }]}>{item.name}</Text>
                <View style={[styles.resultStatsRow, { backgroundColor: colors.backgroundSecondary }]}>
                    <View style={styles.resultStatBox}>
                        <Text style={[styles.resultStatLabel, { color: colors.textSecondary }]}>{t('result.savedCO2')}</Text>
                        <Text style={[styles.resultStatValue, { color: colors.text }]}>{item.co2}</Text>
                    </View>
                    <View style={styles.resultStatBox}>
                        <Text style={[styles.resultStatLabel, { color: colors.textSecondary }]}>{t('result.material')}</Text>
                        <Text style={[styles.resultStatValue, { color: colors.text }]}>{item.material}</Text>
                    </View>
                    <View style={styles.resultStatBox}>
                        <Text style={[styles.resultStatLabel, { color: colors.textSecondary }]}>{t('result.points')}</Text>
                        <Text style={[styles.resultStatValue, { color: colors.text }]}>{item.points}</Text>
                    </View>
                </View>
                {topLabels.length > 0 && (
                    <View style={styles.labelRow}>
                        {topLabels.map((label) => (
                            <View key={label} style={[styles.labelChip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                                <Text style={[styles.labelText, { color: colors.textSecondary }]}>{label}</Text>
                            </View>
                        ))}
                    </View>
                )}
                {!item.recyclable && (
                    <View style={[styles.warningBox, { backgroundColor: colors.error + '10' }]}>
                        <Ionicons name="warning-outline" size={20} color={colors.error || "#ff4d4d"} />
                        <Text style={[styles.warningText, { color: colors.error || "#ff4d4d" }]}>
                            {t('result.notRecyclable') || "This item cannot be recycled in our bins."}
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.primaryButton,
                        { backgroundColor: item.recyclable ? colors.primary : colors.secondary }
                    ]}
                    onPress={item.recyclable ? onAddToCart : onCancel}
                >
                    <Text style={[styles.primaryButtonText, { color: colors.textInverse }]}>
                        {item.recyclable ? "Add item to cart" : "Back to home"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreenContainer: { flex: 1 },
    resultImageContainer: { flex: 2, justifyContent: 'center', alignItems: 'center', position: 'relative', paddingHorizontal: 24 },
    resultImageStage: { width: '78%', height: '68%', borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.12, shadowRadius: 14, elevation: 6 },
    scanBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12 },
    scanBadgeText: { fontSize: 11, fontWeight: '900' },
    resultImage: { width: '78%', height: '78%' },
    bracketsContainer: { position: 'absolute', top: '16%', bottom: '16%', left: '16%', right: '16%', pointerEvents: 'none' },
    bracket: { position: 'absolute', width: 40, height: 40, borderColor: '#4CAF50', borderWidth: 4 },
    bracketTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 20 },
    bracketTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 20 },
    bracketBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 20 },
    bracketBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 20 },
    backButtonAbsolute: { position: 'absolute', top: 24, left: 20, padding: 8, borderRadius: 12, borderWidth: 1, shadowOpacity: 0.1, elevation: 2 },
    resultDetailsCard: { flex: 1, borderTopLeftRadius: 22, borderTopRightRadius: 22, marginTop: -24, padding: 24, borderWidth: 1, shadowOpacity: 0.12, shadowRadius: 12, elevation: 10 },
    statusPill: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, marginBottom: 12 },
    statusText: { fontSize: 12, fontWeight: '900' },
    resultItemName: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 18 },
    resultStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, padding: 14, borderRadius: 14 },
    resultStatBox: { alignItems: 'center', flex: 1 },
    resultStatLabel: { fontSize: 10, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase' },
    resultStatValue: { fontSize: 16, fontWeight: 'bold' },
    labelRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 20 },
    labelChip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
    labelText: { fontSize: 11, fontWeight: '700' },
    primaryButton: { paddingVertical: 17, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    primaryButtonText: { fontSize: 16, fontWeight: '900' },
    warningBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 20, gap: 10 },
    warningText: { fontSize: 14, fontWeight: '600', flex: 1 },
});
