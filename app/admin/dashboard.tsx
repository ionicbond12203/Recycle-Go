import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function AdminDashboard() {
    const router = useRouter();
    const { signOut } = useAuth();
    const { colors } = useTheme();

    const handleLogout = async () => {
        await signOut();
        router.replace("/login");
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top', 'bottom']}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.primaryDark }]}>Admin Dashboard</Text>
                <TouchableOpacity onPress={handleLogout}>
                    <MaterialIcons name="logout" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                        <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Total Users</Text>
                        <Text style={[styles.cardValue, { color: colors.text }]}>1,245</Text>
                    </View>
                    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                        <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Active Collectors</Text>
                        <Text style={[styles.cardValue, { color: colors.text }]}>45</Text>
                    </View>
                    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                        <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Recycled Items</Text>
                        <Text style={[styles.cardValue, { color: colors.text }]}>8,902</Text>
                    </View>
                </View>

                {/* Actions */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Management</Text>

                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]}>
                    <FontAwesome name="users" size={20} color={colors.textInverse} />
                    <Text style={[styles.actionText, { color: colors.textInverse }]}>Manage Users</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.chartBlue }]}>
                    <FontAwesome name="map" size={20} color={colors.textInverse} />
                    <Text style={[styles.actionText, { color: colors.textInverse }]}>View Map Overview</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.chartOrange }]}>
                    <FontAwesome name="bar-chart" size={20} color={colors.textInverse} />
                    <Text style={[styles.actionText, { color: colors.textInverse }]}>System Analytics</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "bold",
    },
    content: {
        padding: 20,
    },
    statsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 30,
    },
    card: {
        width: "48%",
        padding: 20,
        borderRadius: 10,
        marginBottom: 15,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardLabel: {
        fontSize: 14,
        marginBottom: 5,
    },
    cardValue: {
        fontSize: 24,
        fontWeight: "bold",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
    actionText: {
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 10,
    },
});
