import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";

const MOCK_MESSAGES = [
  {
    id: '1',
    sender: 'Recycle-Go Team',
    subject: 'Welcome to Recycle-Go!',
    preview: 'Thanks for joining our community of eco-warriors...',
    time: '2m ago',
    read: false,
  },
  {
    id: '2',
    sender: 'System',
    subject: 'Points Credited',
    preview: 'You have received 50 points for your recent...',
    time: '1h ago',
    read: true,
  },
  {
    id: '3',
    sender: 'Community',
    subject: 'New Recycling Station',
    preview: 'A new recycling station has been added near you...',
    time: '1d ago',
    read: true,
  },
];

export default function InboxScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const renderItem = ({ item }: { item: typeof MOCK_MESSAGES[0] }) => (
    <TouchableOpacity style={[styles.messageItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: item.read ? colors.border : colors.primary }]}>
          <Ionicons name="mail" size={20} color="#fff" />
        </View>
      </View>
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={[styles.sender, { color: colors.text }]}>{item.sender}</Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>{item.time}</Text>
        </View>
        <Text style={[styles.subject, { color: colors.textSecondary }]}>{item.subject}</Text>
        <Text style={[styles.preview, { color: colors.textTertiary }]} numberOfLines={1}>{item.preview}</Text>
      </View>
      {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background, paddingBottom: 20 }]}
      edges={['top', 'bottom']}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('inbox.title')}</Text>
      </View>

      <FlatList
        data={MOCK_MESSAGES}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={60} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('inbox.noMessages')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  listContent: { padding: 20 },
  messageItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    alignItems: 'center',
  },
  avatarContainer: { marginRight: 15 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContent: { flex: 1 },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  sender: { fontWeight: 'bold', fontSize: 16 },
  time: { fontSize: 12 },
  subject: { fontSize: 14, marginBottom: 2 },
  preview: { fontSize: 12 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 10 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, fontSize: 16 },
});
