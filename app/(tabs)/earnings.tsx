import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../lib/supabase";

export default function EarningsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<any[]>([]);

  // Theme Configuration
  const THEME = {
    light: {
      background: "#F8FAFC",
      headerBg: "#FFFFFF",
      textPrimary: "#0F172A",
      textSecondary: "#64748B",
      cardGradient: ['#10b981', '#064e3b'], // Emerald
      cardText: "#FFFFFF",
      cardLabel: "rgba(255, 255, 255, 0.7)",
      withdrawBg: "#FFFFFF",
      withdrawText: "#064e3b",
      accent: "#10b981",
      cardBg: "#FFFFFF",
      border: "#E2E8F0",
      iconBg: "#DEF7EC",
      glowColor: "#10b981",
      glowOpacity: 0.1
    },
    dark: {
      background: "#121212", // Deep Charcoal
      headerBg: "#121212",
      textPrimary: "#FFFFFF",
      textSecondary: "rgba(255, 255, 255, 0.5)",
      cardGradient: ['#00ff88', '#008f44'], // Neon
      cardText: "#000000",
      cardLabel: "rgba(0, 0, 0, 0.6)",
      withdrawBg: "#FFFFFF",
      withdrawText: "#000000",
      accent: "#4ade80",
      cardBg: "#1E1E1E",
      border: "rgba(255, 255, 255, 0.05)",
      iconBg: "rgba(74, 222, 128, 0.1)",
      glowColor: "#4ade80",
      glowOpacity: 0.3
    }
  };

  const currentTheme = isDark ? THEME.dark : THEME.light;

  React.useEffect(() => {
    if (!user) return;

    const fetchBalance = async () => {
      const { data } = await supabase.from('collectors').select('wallet_balance').eq('id', user.id).single();
      if (data) setBalance(Number(data.wallet_balance || 0));
    };

    const fetchHistory = async () => {
      const { data } = await supabase.from('transactions')
        .select(`*, contributors(name, address)`)
        .eq('collector_id', user.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) setHistory(data);
    };

    fetchBalance();
    fetchHistory();

    const channel = supabase.channel('earnings-update')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'collectors', filter: `id = eq.${user.id} ` }, (payload) => {
        if (payload.new.wallet_balance) setBalance(Number(payload.new.wallet_balance));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleStartCollecting = () => {
    router.navigate('/(tabs)/home');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: currentTheme.headerBg, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'transparent' }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.textPrimary }]}>IMPACT DASHBOARD</Text>
        <TouchableOpacity style={[styles.historyBtn, { backgroundColor: isDark ? '#1E1E1E' : '#F1F5F9' }]}>
          <MaterialCommunityIcons name="leaf-circle" size={24} color={currentTheme.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Impact Gradient Card */}
        <LinearGradient
          colors={currentTheme.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientCard, { shadowColor: currentTheme.glowColor, shadowOpacity: currentTheme.glowOpacity }]}
        >
          <View style={styles.cardContent}>
            <View style={styles.balanceSection}>
              <Text style={[styles.cardLabel, { color: currentTheme.cardLabel }]}>LIFETIME ENVIRONMENTAL IMPACT</Text>
              <View style={styles.balanceRow}>
                <Text style={[styles.balanceAmount, { color: currentTheme.cardText }]}>{(balance * 0.45).toFixed(1)}</Text>
                <Text style={[styles.currencySymbol, { color: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)', fontSize: 24, marginLeft: 8 }]}>KG CO2</Text>
              </View>
              <Text style={[styles.cardLabel, { color: currentTheme.cardLabel, marginTop: 4 }]}>SAVED FROM ATMOSPHERE</Text>
            </View>

            <View style={[styles.impactBadgeIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <MaterialCommunityIcons name="tree-outline" size={48} color={currentTheme.cardText} />
            </View>
          </View>
        </LinearGradient>

        {/* Efficiency Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
            <Text style={[styles.statValue, { color: currentTheme.accent }]}>{balance.toFixed(1)}kg</Text>
            <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>Total Recycled</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
            <Text style={[styles.statValue, { color: currentTheme.accent }]}>98%</Text>
            <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>Green Efficiency</Text>
          </View>
        </View>

        <View style={styles.activitySection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}>Collection History</Text>
            <TouchableOpacity>
              <Text style={[styles.viewAllText, { color: currentTheme.accent }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.glowContainer}>
                {isDark && <View style={[styles.glowRing, { borderColor: 'rgba(74, 222, 128, 0.3)' }]} />}
                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.5)' : '#F0FDF4' }]}>
                  <MaterialCommunityIcons name="leaf" size={isDark ? 48 : 64} color={currentTheme.accent} />
                </View>
              </View>

              <Text style={[styles.emptyTitle, { color: currentTheme.textPrimary }]}>No Collections Yet</Text>
              <Text style={[styles.emptyDesc, { color: currentTheme.textSecondary }]}>
                Start accepting recycling requests to see your environmental impact grow here.
              </Text>

              <TouchableOpacity
                style={[styles.startCollectingBtn, { backgroundColor: currentTheme.accent }]}
                onPress={handleStartCollecting}
                activeOpacity={0.9}
              >
                <Text style={[styles.startCollectingText, { color: isDark ? '#000000' : '#FFFFFF' }]}>Start Collecting</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {history.map((item) => (
                <View key={item.id} style={[styles.historyItem, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
                  <View style={[styles.iconBox, { backgroundColor: currentTheme.iconBg }]}>
                    <MaterialCommunityIcons name="check-circle-outline" size={24} color={currentTheme.accent} />
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={[styles.itemTitle, { color: currentTheme.textPrimary }]}>{item.weight_kg}kg Collection</Text>
                    <Text style={[styles.itemSub, { color: currentTheme.textSecondary }]}>
                      {new Date(item.created_at).toLocaleDateString()} • {item.contributors?.address || 'Verified Scan'}
                    </Text>
                  </View>
                  <View style={styles.itemAmountWrapper}>
                    <Text style={[styles.itemAmount, { color: currentTheme.accent }]}>+ {Math.round(item.weight_kg * 10)} pts</Text>
                    <View style={[styles.statusBadge, { backgroundColor: currentTheme.iconBg }]}>
                      <Text style={[styles.statusText, { color: currentTheme.accent }]}>VERIFIED</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  gradientCard: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    height: 140,
    marginTop: 24,
    marginBottom: 32,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  balanceSection: {
    justifyContent: 'center',
    gap: 4,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -2,
  },
  impactBadgeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  withdrawText: {
    fontWeight: '800',
    fontSize: 14,
  },
  activitySection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  glowContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 70,
    borderWidth: 1,
    opacity: 0.5,
  },
  iconCircle: {
    width: 120,
    height: 120, // Keep large for light mode, style above handles content
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 260,
  },
  startCollectingBtn: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startCollectingText: {
    fontWeight: '800',
    fontSize: 16,
  },
  // Item List
  listContainer: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemAmountWrapper: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
