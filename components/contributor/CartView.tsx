import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPoints = cart.reduce((sum, item) => sum + item.points * item.quantity, 0);
    const totalCO2 = cart.reduce((sum, item) => sum + (item.co2 || 0) * item.quantity, 0);

    return (
        <View style={[styles.fullScreenContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.cartHeader, { paddingTop: insets.top + 14, borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={onBack} style={[styles.headerIconButton, { backgroundColor: colors.backgroundSecondary }]}>
                    <Ionicons name="chevron-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.cartTitle, { color: colors.text }]}>{t('cart.title')} ({totalItems})</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
                {cart.length === 0 ? (
                    <View style={[styles.emptyCart, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={[styles.emptyIcon, { backgroundColor: colors.badgeBackground }]}>
                            <Ionicons name="cart-outline" size={32} color={colors.primary} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Scan an item or add it manually before requesting a pickup.
                        </Text>
                        <TouchableOpacity style={[styles.emptyAction, { backgroundColor: colors.primary }]} onPress={onAddMore}>
                            <Ionicons name="camera-outline" size={18} color={colors.textInverse} />
                            <Text style={[styles.emptyActionText, { color: colors.textInverse }]}>Start scanning</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { color: colors.text }]}>{totalItems}</Text>
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Items</Text>
                            </View>
                            <View style={[styles.summaryItem, styles.summaryDivider, { borderColor: colors.divider }]}>
                                <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalPoints}</Text>
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Est. points</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { color: colors.text }]}>{totalCO2.toFixed(1)}kg</Text>
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>CO2 saved</Text>
                            </View>
                        </View>

                        {cart.map((item) => (
                            <View key={item.id} style={[styles.cartItemRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Image source={{ uri: item.imageUri }} style={[styles.cartItemImage, { backgroundColor: colors.border }]} />
                                <View style={styles.cartItemInfo}>
                                    <Text style={[styles.cartItemName, { color: colors.text }]}>{item.name}</Text>
                                    <Text style={[styles.cartItemMeta, { color: colors.textSecondary }]}>{item.material} - {item.points} pts each</Text>
                                    <View style={[styles.qtyControl, { backgroundColor: colors.backgroundSecondary, opacity: isLocked ? 0.5 : 1 }]}>
                                        <TouchableOpacity
                                            onPress={() => !isLocked && onUpdateQuantity(item.id, -1)}
                                            style={styles.qtyBtn}
                                            disabled={isLocked}
                                        >
                                            {item.quantity === 1 ? <Ionicons name="trash-outline" size={16} color={colors.error} /> : <Text style={{ color: colors.text }}>-</Text>}
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
                    </>
                )}

                <TouchableOpacity
                    style={[styles.addMoreBtn, { marginBottom: 100, opacity: isLocked ? 0.5 : 1 }]}
                    onPress={() => !isLocked && onAddMore()}
                    disabled={isLocked}
                >
                    <Text style={[styles.addMoreText, { color: colors.text }]}>{t('actions.addMoreItems')}</Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={[styles.cartFooter, { borderTopColor: colors.divider, backgroundColor: colors.background }]}>
                <TouchableOpacity
                    style={[
                        styles.primaryButton,
                        { backgroundColor: colors.primary, shadowColor: colors.primary },
                        (!isLocked && cart.length === 0) && { opacity: 0.4 }
                    ]}
                    onPress={onReviewAddress}
                    disabled={!isLocked && cart.length === 0}
                >
                    <Text style={[styles.primaryButtonText, { color: colors.textInverse }]}>
                        {isLocked ? "Track Active Request" : cart.length === 0 ? t('cart.addItemsFirst') || 'Add items to cart first' : t('actions.reviewAddress')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreenContainer: { flex: 1, paddingBottom: 90 },
    cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 18, borderBottomWidth: 1 },
    headerIconButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    cartTitle: { fontSize: 18, fontWeight: 'bold' },
    summaryCard: { flexDirection: 'row', borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 18 },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryDivider: { borderLeftWidth: 1, borderRightWidth: 1 },
    summaryValue: { fontSize: 20, fontWeight: '900' },
    summaryLabel: { fontSize: 11, fontWeight: '700', marginTop: 3 },
    emptyCart: { borderWidth: 1, borderRadius: 24, padding: 28, alignItems: 'center', marginTop: 40 },
    emptyIcon: { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '900', marginBottom: 8 },
    emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 18 },
    emptyAction: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 18 },
    emptyActionText: { fontWeight: '800' },
    cartItemRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'center', padding: 12, borderRadius: 18, borderWidth: 1 },
    cartItemImage: { width: 60, height: 80, borderRadius: 10, resizeMode: 'contain' },
    cartItemInfo: { flex: 1, marginLeft: 15 },
    cartItemName: { fontSize: 15, fontWeight: '800' },
    cartItemMeta: { fontSize: 12, fontWeight: '600', marginTop: 3, marginBottom: 10 },
    qtyControl: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 20, padding: 2 },
    qtyBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    qtyText: { marginHorizontal: 10, fontWeight: 'bold' },
    addMoreBtn: { padding: 15, alignItems: 'center', marginBottom: 100 },
    addMoreText: { fontWeight: '600' },
    cartFooter: { padding: 20, borderTopWidth: 1 },
    primaryButton: { paddingVertical: 18, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
    primaryButtonText: { fontSize: 18, fontWeight: 'bold' },
});
