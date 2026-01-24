import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { supabase } from "../lib/supabase";

interface Job {
    id: string;
    address: string;
    distanceLabel: string;
    contributorName?: string;
    contributorAvatar?: string;
}

interface JobDetailModalProps {
    visible: boolean;
    job: Job | null;
    onClose: () => void;
    onProcess: (job: Job) => void;
    onReject: () => void;
}

interface ScannedItem {
    id: number;
    name: string;
    material: string;
    image_uri: string;
    points: number;
    co2_saved: number;
    created_at: string;
}

import { SafeAreaView } from "react-native-safe-area-context";

export default function JobDetailModal({ visible, job, onClose, onProcess, onReject }: JobDetailModalProps) {
    const { colors, isDark } = useTheme();
    const { t } = useLanguage();
    const [items, setItems] = useState<ScannedItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && job) {
            fetchItems();
        }
    }, [visible, job]);

    const fetchItems = async () => {
        if (!job) return;
        setLoading(true);
        // Fetch items that are NOT linked to a transaction yet (pending)
        const { data, error } = await supabase
            .from('scanned_items')
            .select('*')
            .eq('contributor_id', job.id)
            .is('transaction_id', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching items:", error);
        } else {
            setItems(data || []);
        }
        setLoading(false);
    };

    const renderItem = ({ item }: { item: ScannedItem }) => (
        <View style={[styles.itemCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Image
                source={{ uri: item.image_uri }}
                style={styles.itemImage}
                resizeMode="cover"
            />
            <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.itemMaterial, { color: colors.textSecondary }]}>{item.material}</Text>
                <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: colors.warning + '20' }]}>
                        <Text style={[styles.badgeText, { color: colors.warning }]}>{item.points} pts</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: colors.badgeBackground }]}>
                        <Text style={[styles.badgeText, { color: colors.primary }]}>🌱 {item.co2_saved}kg</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    if (!job) return null;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        {job.contributorAvatar ? (
                            <Image source={{ uri: job.contributorAvatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                                <Text style={[styles.avatarText, { color: colors.textSecondary }]}>{job.contributorName?.charAt(0) || 'C'}</Text>
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{job.contributorName}</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>{job.address}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <>
                        <View style={styles.statsRow}>
                            <Text style={[styles.statText, { color: colors.text }]}>{items.length} Items</Text>
                            <Text style={[styles.statText, { color: colors.text }]}>•</Text>
                            <Text style={[styles.statText, { color: colors.text }]}>{job.distanceLabel} away</Text>
                        </View>

                        <FlatList
                            data={items}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderItem}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Text style={{ color: colors.textSecondary }}>No items scanned yet.</Text>
                                </View>
                            }
                        />

                        {/* Actions */}
                        <View style={[styles.footer, { borderTopColor: colors.divider }]}>
                            <TouchableOpacity style={[styles.rejectBtn, { backgroundColor: colors.errorBackground }]} onPress={onReject}>
                                <Text style={[styles.rejectText, { color: colors.error }]}>{t('actions.decline')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.processBtn, { backgroundColor: colors.primary }]}
                                onPress={() => onProcess(job)}
                            >
                                <Text style={[styles.processText, { color: colors.textInverse }]}>{t('actions.accept')}</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
    avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 20, fontWeight: 'bold' },
    title: { fontSize: 18, fontWeight: 'bold' },
    subtitle: { fontSize: 13, marginTop: 2 },
    closeBtn: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, gap: 10 },
    statText: { fontSize: 16, fontWeight: '500' },
    listContent: { padding: 20 },
    itemCard: { flexDirection: 'row', padding: 10, borderRadius: 12, marginBottom: 15, alignItems: 'center' },
    itemImage: { width: 70, height: 70, borderRadius: 8 },
    itemInfo: { flex: 1, marginLeft: 15 },
    itemName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    itemMaterial: { fontSize: 14, marginBottom: 6 },
    badgeRow: { flexDirection: 'row', gap: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    emptyState: { padding: 40, alignItems: 'center' },
    footer: { padding: 20, flexDirection: 'row', gap: 15, borderTopWidth: 1 },
    rejectBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    rejectText: { fontWeight: 'bold', fontSize: 16 },
    processBtn: { flex: 2, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    processText: { fontWeight: 'bold', fontSize: 16 }
});
