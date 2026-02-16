import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../lib/supabase";

export default function AnalyticsView() {
    const router = useRouter();
    const { colors } = useTheme();
    const [stats, setStats] = useState<any>({ plastic: 0, glass: 0, paper: 0, metal: 0, total: 0, co2: 0, trees: 0, water: 0 });

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


        // Impact Formulas:
        // 1 Mature Tree absorbs ~21kg CO2 per year
        stats.trees = counts.co2 / 21;

        // Water Savings (approx): 
        // Plastic: ~5.7L per kg
        // Paper: ~26L per kg
        // Glass: ~1.2L per kg (cleaning)
        // Metal: ~14L per kg
        // Averaging to a rough estimate based on material count (assuming 0.5kg avg weight per item)
        const estWeight = counts.total * 0.5;
        stats.water = estWeight * 10; // Simplified average

        setStats({ ...counts, trees: stats.trees, water: stats.water });
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
                    <Text style={{ fontSize: 36, fontWeight: 'bold', color: colors.text, marginTop: 10 }}>
                        {stats.co2.toFixed(1)}kg
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>Total CO2 Saved</Text>


                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 10, marginTop: 10 }}>
                        <View style={{ alignItems: 'center' }}>
                            <MaterialCommunityIcons name="tree" size={40} color="#38761D" />
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 5 }}>
                                {Math.ceil(stats.trees)}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Trees Planted</Text>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                            <Ionicons name="water" size={40} color="#2196F3" />
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 5 }}>
                                {Math.ceil(stats.water)}L
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Water Saved</Text>
                        </View>
                    </View>

                    <View style={{ backgroundColor: colors.background, padding: 15, borderRadius: 10, marginTop: 15 }}>
                        <Text style={{ color: colors.textSecondary, fontStyle: 'italic', fontSize: 12, textAlign: 'center' }}>
                            "Your contributions effectively offset the yearly carbon footprint of {Math.ceil(stats.trees)} mature trees."
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView >
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
