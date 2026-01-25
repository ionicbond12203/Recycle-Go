import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../lib/supabase";

export default function AnalyticsView() {
    const router = useRouter();
    const { colors } = useTheme();
    const [stats, setStats] = useState<any>({ plastic: 0, glass: 0, paper: 0, metal: 0, total: 0, co2: 0 });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        // Mocking some aggregation locally since we might not have a dedicated stats table
        // Real app would use an RPC call or view
        const { data } = await supabase.from('scanned_items').select('material, co2_saved');

        const counts = { plastic: 0, glass: 0, paper: 0, metal: 0, total: 0, co2: 0 };
        data?.forEach(item => {
            const mat = item.material?.toLowerCase() || 'other';
            if (mat.includes('plastic')) counts.plastic++;
            else if (mat.includes('glass')) counts.glass++;
            else if (mat.includes('paper')) counts.paper++;
            else if (mat.includes('metal') || mat.includes('aluminum')) counts.metal++;

            counts.total++;
            counts.co2 += (item.co2_saved || 0);
        });
        setStats(counts);
    };

    const Bar = ({ label, value, color }: { label: string, value: number, color: string }) => {
        const percentage = stats.total > 0 ? (value / stats.total) * 100 : 0;
        return (
            <View style={{ marginBottom: 15 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{label}</Text>
                    <Text style={{ color: colors.textSecondary }}>{value} ({percentage.toFixed(1)}%)</Text>
                </View>
                <View style={{ height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${percentage}%`, backgroundColor: color }} />
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Analytics</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Material Breakdown</Text>
                    <Bar label="Plastic" value={stats.plastic} color="#4FC3F7" />
                    <Bar label="Glass" value={stats.glass} color="#81C784" />
                    <Bar label="Paper" value={stats.paper} color="#FFB74D" />
                    <Bar label="Metal" value={stats.metal} color="#BA68C8" />
                </View>

                <View style={[styles.card, { backgroundColor: colors.card, marginTop: 20 }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Environmental Impact</Text>
                    <View style={{ alignItems: 'center', padding: 20 }}>
                        <Ionicons name="leaf" size={60} color="#66BB6A" />
                        <Text style={{ fontSize: 36, fontWeight: 'bold', color: colors.text, marginTop: 10 }}>
                            {stats.co2.toFixed(1)}kg
                        </Text>
                        <Text style={{ color: colors.textSecondary }}>Total CO2 Saved</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    backButton: { marginRight: 15 },
    title: { fontSize: 20, fontWeight: 'bold' },
    card: { padding: 20, borderRadius: 15, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 }
});
