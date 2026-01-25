import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";

export interface ManualItem {
    name: string;
    material: string;
    points: number;
    co2: number;
    imageUri: string;
}

interface ManualItemEntryModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (item: ManualItem) => void;
}

export default function ManualItemEntryModal({ visible, onClose, onAdd }: ManualItemEntryModalProps) {
    const { colors } = useTheme();
    const { t } = useLanguage();
    const [name, setName] = useState("");
    const [selectedMaterial, setSelectedMaterial] = useState("plastic");

    const MATERIALS = [
        { id: 'plastic', name: t('materials.plastic'), icon: 'cup-water', points: 10, co2: 0.5, color: '#3498db' },
        { id: 'glass', name: t('materials.glass'), icon: 'bottle-wine', points: 15, co2: 0.8, color: '#e67e22' },
        { id: 'aluminium', name: t('materials.aluminium'), icon: 'can', points: 25, co2: 1.2, color: '#95a5a6' },
        { id: 'paper', name: t('materials.paper'), icon: 'newspaper', points: 5, co2: 0.3, color: '#f1c40f' }
    ];

    const handleAdd = () => {
        if (!name.trim()) return;

        const materialObj = MATERIALS.find(m => m.id === selectedMaterial);

        onAdd({
            name: name.trim(),
            material: materialObj?.name || selectedMaterial,
            points: materialObj?.points || 10,
            co2: materialObj?.co2 || 0.5,
            imageUri: "https://vsnvghvpsnzpuvxpslyw.supabase.co/storage/v1/object/public/scanned_images/placeholders/manual_item.png" // Placeholder
        });

        setName("");
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>{t('home.addManualItem') || "Add Item Manually"}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.itemName') || "Item Name"}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                        placeholder="e.g. Coca-Cola Bottle"
                        placeholderTextColor={colors.textSecondary + '80'}
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>{t('common.selectMaterial') || "Select Material"}</Text>
                    <View style={styles.materialGrid}>
                        {MATERIALS.map((m) => (
                            <TouchableOpacity
                                key={m.id}
                                style={[
                                    styles.materialCard,
                                    { backgroundColor: colors.card, borderColor: selectedMaterial === m.id ? colors.primary : colors.border },
                                    selectedMaterial === m.id && { borderWidth: 2 }
                                ]}
                                onPress={() => setSelectedMaterial(m.id)}
                            >
                                <MaterialCommunityIcons name={m.icon as any} size={32} color={selectedMaterial === m.id ? colors.primary : colors.textSecondary} />
                                <Text style={[styles.materialName, { color: selectedMaterial === m.id ? colors.primary : colors.text }]}>{m.name}</Text>
                                <Text style={styles.pointsLabel}>+{m.points} pts</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: name.trim() ? colors.primary : colors.textSecondary + '40' }]}
                        onPress={handleAdd}
                        disabled={!name.trim()}
                    >
                        <Text style={styles.addButtonText}>{t('actions.addItem') || "Add to Cart"}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    title: { fontSize: 20, fontWeight: 'bold' },
    closeBtn: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)' },
    content: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 16 },
    materialGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
    materialCard: { width: '47%', padding: 20, borderRadius: 16, alignItems: 'center', gap: 8, borderWidth: 1 },
    materialName: { fontSize: 14, fontWeight: 'bold' },
    pointsLabel: { fontSize: 12, color: '#4CAF50', fontWeight: 'bold' },
    footer: { padding: 20, borderTopWidth: 1 },
    addButton: { paddingVertical: 18, borderRadius: 15, alignItems: 'center' },
    addButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
