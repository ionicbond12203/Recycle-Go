import React, { useEffect, useState } from "react";
import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../lib/supabase";

interface TransactionDetailModalProps {
    visible: boolean;
    transaction: any | null;
    onClose: () => void;
}

export default function TransactionDetailModal({ visible, transaction, onClose }: TransactionDetailModalProps) {
    const { t } = useLanguage();
    const { colors } = useTheme();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (transaction && visible) {
            fetchTransactionItems(transaction.id);
        } else {
            setItems([]);
        }
    }, [transaction, visible]);

    const fetchTransactionItems = async (transactionId: string) => {
        setLoading(true);
        const { data } = await supabase.from('scanned_items').select('*').eq('transaction_id', transactionId);
        if (data) setItems(data);
        setLoading(false);
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.detailTitle, { color: colors.text }]}>{t('home.itemsRecycled')}</Text>
                    {loading ? (
                        <Text style={{ color: colors.textSecondary }}>Loading...</Text>
                    ) : (
                        <FlatList
                            data={items}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View style={[styles.detailItem, { borderBottomColor: colors.divider }]}>
                                    <Image source={{ uri: item.image_uri }} style={styles.detailImage} />
                                    <View>
                                        <Text style={[styles.detailName, { color: colors.text }]}>{item.name}</Text>
                                        <Text style={[styles.detailSub, { color: colors.textSecondary }]}>{item.material} • {item.points} pts</Text>
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={
                                <Text style={{ textAlign: 'center', color: colors.textTertiary, marginTop: 20 }}>
                                    No items found for this collection.
                                </Text>
                            }
                        />
                    )}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={[styles.closeText, { color: colors.primary }]}>{t('home.close')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    detailCard: { width: '85%', height: '60%', borderRadius: 20, padding: 20 },
    detailTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1 },
    detailImage: { width: 50, height: 50, borderRadius: 10, marginRight: 15, backgroundColor: '#eee' },
    detailName: { fontSize: 16, fontWeight: '600' },
    detailSub: { fontSize: 14 },
    closeButton: { marginTop: 10, alignSelf: 'center', padding: 10 },
    closeText: { fontWeight: 'bold', fontSize: 16 }
});
