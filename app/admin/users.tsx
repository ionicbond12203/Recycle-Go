import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../lib/supabase";

// Types
interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    avatar_url: string | null;
    updated_at: string;
    points?: number;
    total_co2_saved?: number;
    recycled_items?: number;
    wallet_balance?: number;
}

export default function UsersManager() {
    const router = useRouter();
    const { colors } = useTheme();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // 1. Fetch Profiles
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .order('updated_at', { ascending: false });

            if (profileError) throw profileError;

            // 2. Fetch Collector Balances
            const { data: collectorData, error: collectorError } = await supabase
                .from('collectors')
                .select('id, wallet_balance');

            if (collectorError) {
                console.log("Could not fetch collector balances:", collectorError);
            }

            // 3. Merge Data
            const mergedUsers = (profiles || []).map(profile => {
                const collector = collectorData?.find(c => c.id === profile.id);
                return {
                    ...profile,
                    wallet_balance: collector?.wallet_balance || 0
                };
            });

            setUsers(mergedUsers);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    const handleDeleteUser = async (userId: string, email: string) => {
        Alert.alert(
            "Delete User",
            `Are you sure you want to delete ${email}? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            console.log("Starting full deletion for user:", userId);

                            // 1. Check if the administrator is actually authenticated in Supabase
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session) {
                                throw new Error("You must be logged in with a real account (not mock Dev Admin) for RLS policies to work.");
                            }

                            if (userId === session.user.id) {
                                throw new Error("You cannot delete your own account.");
                            }

                            // 2. Clean up ALL associated data
                            // We delete in an order that respects potential dependencies

                            // A. Unlink scanned items from transactions first!
                            // This prevents FK constraint errors when deleting transactions
                            console.log("Unlinking scanned items from transactions...");
                            await supabase.from('scanned_items')
                                .update({ transaction_id: null })
                                .or(`contributor_id.eq.${userId}`);

                            // B. Delete messages involving this user
                            console.log("Deleting messages...");
                            await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

                            // C. Delete scanned items (optional: if you want them gone too, or just keep them unlinked)
                            // For now, let's keep them (unlinked) if they are the source of history, 
                            // but the user's scan history should probably be deleted if the user is gone.
                            console.log("Deleting scanned items...");
                            await supabase.from('scanned_items').delete().eq('contributor_id', userId);

                            // D. Delete transactions where they are contributor OR collector
                            console.log("Deleting transactions...");
                            await supabase.from('transactions').delete().or(`collector_id.eq.${userId},contributor_id.eq.${userId}`);

                            // E. Clean up identity tables
                            console.log("Cleaning up collector/contributor records...");
                            await supabase.from('collectors').delete().eq('id', userId);
                            await supabase.from('contributors').delete().eq('id', userId);

                            // 3. Delete the profile
                            const { data, error, status } = await supabase
                                .from('profiles')
                                .delete()
                                .eq('id', userId)
                                .select(); // Using select() helps verify if a row was actually deleted

                            if (error) throw error;

                            if (!data || data.length === 0) {
                                throw new Error("Delection failed: Row not found or blocked by RLS. Ensure your real account has 'admin' role.");
                            }

                            Alert.alert("Success", "User and all associated data deleted successfully.");
                            fetchUsers(); // Refresh list
                        } catch (err: any) {
                            console.error("Deletion error details:", err);
                            Alert.alert("Deletion Error", err.message || "Failed to delete user.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: UserProfile }) => (
        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image
                source={{ uri: item.avatar_url || "https://i.pravatar.cc/150?u=" + item.id }}
                style={styles.avatar}
            />
            <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>
                    {item.full_name || item.email?.split('@')[0] || "Anonymous User"}
                </Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: item.role === 'admin' ? '#FFEBEE' : item.role === 'collector' ? '#E3F2FD' : '#F1F8E9', marginBottom: 5 }]}>
                    <Text style={[styles.roleText, { color: item.role === 'admin' ? '#D32F2F' : item.role === 'collector' ? '#1976D2' : '#388E3C' }]}>
                        {item.role.toUpperCase()}
                    </Text>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    {item.role === 'collector' ? (
                        <View style={styles.statItem}>
                            <Ionicons name="wallet-outline" size={14} color={colors.textSecondary} />
                            <Text style={[styles.statText, { color: colors.textSecondary }]}>RM {item.wallet_balance?.toFixed(2) || "0.00"}</Text>
                        </View>
                    ) : item.role === 'contributor' ? (
                        <>
                            <View style={styles.statItem}>
                                <Ionicons name="star-outline" size={14} color={colors.textSecondary} />
                                <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.points || 0} pts</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="leaf-outline" size={14} color={colors.textSecondary} />
                                <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.total_co2_saved || 0}kg</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="repeat-outline" size={14} color={colors.textSecondary} />
                                <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.recycled_items || 0}</Text>
                            </View>
                        </>
                    ) : null}
                </View>
            </View>

            {/* Delete Button */}
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteUser(item.id, item.email)}
            >
                <Ionicons name="trash-outline" size={20} color="#D32F2F" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Manage Users</Text>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search users..."
                    placeholderTextColor={colors.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 20 }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    backButton: { marginRight: 15 },
    title: { fontSize: 20, fontWeight: 'bold' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 20, padding: 12, borderRadius: 10, borderWidth: 1 },
    searchInput: { flex: 1, fontSize: 16 },
    userCard: { flexDirection: 'row', padding: 15, marginBottom: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '700' },
    userEmail: { fontSize: 14, marginBottom: 5 },
    roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    roleText: { fontSize: 10, fontWeight: '700' },
    statsRow: { flexDirection: 'row', gap: 12, marginTop: 4, flexWrap: 'wrap' },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: 12, fontWeight: '500' },
    deleteButton: { padding: 10, alignSelf: 'center' }
});
