import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";

export interface CartItem {
    id: string;
    name: string;
    imageUri: string;
    quantity: number;
    points: number;
    material: string;
    co2?: number; // Added co2 property
}

interface CartViewProps {
    cart: CartItem[];
    onUpdateQuantity: (id: string, delta: number) => void;
    onAddMore: () => void;
    onReviewAddress: () => void;
    onBack: () => void;
    isLocked?: boolean;
}

export default function CartView({ cart, onUpdateQuantity, onAddMore, onReviewAddress, onBack, isLocked }: CartViewProps) {
    const { t } = useLanguage();
    const { colors, isDark } = useTheme();
    return (
        <View style={[styles.fullScreenContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.cartHeader, { borderBottomColor: colors.divider }]}>
                {/* Back button removed */}
                <Text style={[styles.cartTitle, { color: colors.text }]}>{t('cart.title')} ({cart.length})</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
                {cart.map((item, index) => (
                    <View key={index} style={styles.cartItemRow}>
                        <Image source={{ uri: item.imageUri }} style={[styles.cartItemImage, { backgroundColor: colors.border }]} />
                        <View style={styles.cartItemInfo}>
                            <Text style={[styles.cartItemName, { color: colors.text }]}>{item.name} ({item.material})</Text>
                            <View style={[styles.qtyControl, { backgroundColor: colors.backgroundSecondary, opacity: isLocked ? 0.5 : 1 }]}>
                                <TouchableOpacity
                                    onPress={() => !isLocked && onUpdateQuantity(item.id, -1)}
                                    style={styles.qtyBtn}
                                    disabled={isLocked}
                                >
                                    {item.quantity === 1 ? <Ionicons name="trash-outline" size={16} color="red" /> : <Text style={{ color: colors.text }}>-</Text>}
                                </TouchableOpacity>
                                <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
                                <TouchableOpacity
                                    onPress={() => !isLocked && onUpdateQuantity(item.id, 1)}
                                    style={styles.qtyBtn}
                                    disabled={isLocked}
                                >
                                    <Text style={{ color: colors.text }}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))}

                <TouchableOpacity
                    style={[styles.addMoreBtn, { marginBottom: 100, opacity: isLocked ? 0.5 : 1 }]}
                    onPress={() => !isLocked && onAddMore()}
                    disabled={isLocked}
                >
                    <Text style={[styles.addMoreText, { color: colors.text }]}>{t('actions.addMoreItems')}</Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={[styles.cartFooter, { borderTopColor: colors.divider, backgroundColor: colors.background }]}>
                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={onReviewAddress}>
                    <Text style={[styles.primaryButtonText, { color: colors.textInverse }]}>{t('actions.reviewAddress')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreenContainer: { flex: 1, paddingBottom: 90 },
    cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    cartTitle: { fontSize: 18, fontWeight: 'bold' },
    cartItemRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
    cartItemImage: { width: 60, height: 80, borderRadius: 10, resizeMode: 'contain' },
    cartItemInfo: { flex: 1, marginLeft: 15 },
    cartItemName: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
    qtyControl: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 20, padding: 2 },
    qtyBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    qtyText: { marginHorizontal: 10, fontWeight: 'bold' },
    addMoreBtn: { padding: 15, alignItems: 'center', marginBottom: 100 },
    addMoreText: { fontWeight: '600' },
    cartFooter: { padding: 20, borderTopWidth: 1 },
    primaryButton: { paddingVertical: 18, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
    primaryButtonText: { fontSize: 18, fontWeight: 'bold' },
});
