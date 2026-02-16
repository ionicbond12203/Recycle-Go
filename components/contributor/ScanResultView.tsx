import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
    const { colors, isDark } = useTheme();
    return (
        <View style={[styles.fullScreenContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.resultImageContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <Image source={{ uri: item.imageUri }} style={styles.resultImage} resizeMode="contain" />
                <View style={styles.bracketsContainer}>
                    <View style={[styles.bracket, styles.bracketTL]} />
                    <View style={[styles.bracket, styles.bracketTR]} />
                    <View style={[styles.bracket, styles.bracketBL]} />
                    <View style={[styles.bracket, styles.bracketBR]} />
                </View>
                <TouchableOpacity style={[styles.backButtonAbsolute, { backgroundColor: colors.background }]} onPress={onCancel}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
            </View>

            <View style={[styles.resultDetailsCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                <Text style={[styles.resultItemName, { color: colors.text }]}>{item.name}</Text>
                <View style={[styles.resultStatsRow, { backgroundColor: colors.backgroundSecondary }]}>
                    <View style={styles.resultStatBox}>
                        <Text style={styles.resultStatLabel}>{t('result.savedCO2')}</Text>
                        <Text style={[styles.resultStatValue, { color: colors.text }]}>{item.co2}</Text>
                    </View>
                    <View style={styles.resultStatBox}>
                        <Text style={styles.resultStatLabel}>{t('result.material')}</Text>
                        <Text style={[styles.resultStatValue, { color: colors.text }]}>{item.material}</Text>
                    </View>
                    <View style={styles.resultStatBox}>
                        <Text style={styles.resultStatLabel}>{t('result.points')}</Text>
                        <Text style={[styles.resultStatValue, { color: colors.text }]}>{item.points}</Text>
                    </View>
                </View>
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
                        {item.recyclable ? "Add to Cart" : "Back to Homepage"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreenContainer: { flex: 1 },
    resultImageContainer: { flex: 2, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    resultImage: { width: '60%', height: '80%' },
    bracketsContainer: { position: 'absolute', top: '10%', bottom: '10%', left: '10%', right: '10%', pointerEvents: 'none' },
    bracket: { position: 'absolute', width: 40, height: 40, borderColor: '#4CAF50', borderWidth: 4 },
    bracketTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 20 },
    bracketTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 20 },
    bracketBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 20 },
    bracketBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 20 },
    backButtonAbsolute: { position: 'absolute', top: 20, left: 20, padding: 8, borderRadius: 12, shadowOpacity: 0.1, elevation: 2 },
    resultDetailsCard: { flex: 1, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, padding: 30, shadowOpacity: 0.1, elevation: 10 },
    resultItemName: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    resultStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, padding: 15, borderRadius: 15 },
    resultStatBox: { alignItems: 'center', flex: 1 },
    resultStatLabel: { fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase' },
    resultStatValue: { fontSize: 16, fontWeight: 'bold' },
    primaryButton: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    primaryButtonText: { fontSize: 16, fontWeight: '700' },
    warningBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 20, gap: 10 },
    warningText: { fontSize: 14, fontWeight: '600', flex: 1 },
});