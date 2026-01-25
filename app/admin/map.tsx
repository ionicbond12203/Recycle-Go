import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../lib/supabase";

export default function AdminMap() {
    const router = useRouter();
    const { colors } = useTheme();
    const [collectors, setCollectors] = useState<any[]>([]);
    const [contributors, setContributors] = useState<any[]>([]);

    // Default region (KL)
    const [region, setRegion] = useState({
        latitude: 3.1390,
        longitude: 101.6869,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    });

    useEffect(() => {
        // Fetch active collectors
        const fetchCollectors = async () => {
            const { data } = await supabase
                .from('collectors')
                .select('*');
            if (data) setCollectors(data);
        };

        // Fetch active contributors
        const fetchContributors = async () => {
            const { data } = await supabase
                .from('contributors')
                .select('*');
            if (data) setContributors(data);
        };

        fetchCollectors();
        fetchContributors();

        // Subscribe to live updates
        const collectorChannel = supabase.channel('admin-collectors')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'collectors' }, (payload) => {
                fetchCollectors();
            })
            .subscribe();

        const contributorChannel = supabase.channel('admin-contributors')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contributors' }, (payload) => {
                fetchContributors();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(collectorChannel);
            supabase.removeChannel(contributorChannel);
        };
    }, []);

    return (
        <View style={styles.container}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={region}
            >
                {collectors.map(c => (
                    <Marker
                        key={`collector-${c.id}`}
                        coordinate={{ latitude: c.latitude, longitude: c.longitude }}
                        title="Collector"
                        description={`Last update: ${new Date(c.updated_at).toLocaleTimeString()}`}
                    >
                        <View style={{ backgroundColor: 'white', padding: 5, borderRadius: 20, borderWidth: 2, borderColor: '#2D5A27' }}>
                            <Ionicons name="trash-bin" size={20} color="#2D5A27" />
                        </View>
                    </Marker>
                ))}

                {contributors.map(c => (
                    <Marker
                        key={`contributor-${c.id}`}
                        coordinate={{ latitude: c.latitude, longitude: c.longitude }}
                        title="Contributor"
                        description={`Requesting pickup`}
                    >
                        <View style={{ backgroundColor: 'white', padding: 5, borderRadius: 20, borderWidth: 2, borderColor: '#4ADE80' }}>
                            <Ionicons name="person" size={20} color="#4ADE80" />
                        </View>
                    </Marker>
                ))}
            </MapView>

            <SafeAreaView style={styles.overlay} edges={['top']}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.card }]}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={[styles.legend, { backgroundColor: colors.card }]}>
                    <View style={styles.legendRow}>
                        <Ionicons name="trash-bin" size={16} color="#2D5A27" />
                        <Text style={[styles.legendText, { color: colors.text }]}>Collectors: {collectors.length}</Text>
                    </View>
                    <View style={styles.legendRow}>
                        <Ionicons name="person" size={16} color="#4ADE80" />
                        <Text style={[styles.legendText, { color: colors.text }]}>Contributors: {contributors.length}</Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.2, shadowRadius: 3, elevation: 5 },
    legend: { padding: 12, borderRadius: 12, shadowOpacity: 0.1, elevation: 5, gap: 8 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendText: { fontWeight: 'bold', fontSize: 12 }
});
