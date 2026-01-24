import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { ChatMessage } from "../../types";

interface ChatModalProps {
    visible: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    currentUserId: string | null;
    onSendMessage: (text: string) => void;
}

export default function ChatModal({ visible, onClose, messages, currentUserId, onSendMessage }: ChatModalProps) {
    const { colors } = useTheme();
    const [inputText, setInputText] = useState("");
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (visible && messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages, visible]);

    const handleSend = () => {
        if (!inputText.trim()) return;
        onSendMessage(inputText);
        setInputText("");
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                >
                    <View style={[styles.chatHeader, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
                        <Text style={[styles.chatTitle, { color: colors.text }]}>Chat with Driver</Text>
                        <TouchableOpacity style={styles.closeChatBtn} onPress={onClose}>
                            <Ionicons name="close" size={28} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        style={{ flex: 1, backgroundColor: colors.background }}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        renderItem={({ item }) => {
                            const isMe = String(item.sender_id) === String(currentUserId);
                            return (
                                <View style={[styles.msgBubble, isMe ? [styles.msgBubbleMe, { backgroundColor: colors.userBubble }] : [styles.msgBubbleThem, { backgroundColor: colors.botBubble }]]}>
                                    <Text style={[styles.msgText, { color: isMe ? colors.textInverse : colors.text }]}>{item.content}</Text>
                                    <Text style={[styles.msgTime, { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
                                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            );
                        }}
                    />

                    <View style={[styles.chatInputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                        <TextInput
                            style={[styles.chatInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Type a message..."
                            placeholderTextColor={colors.textTertiary}
                        />
                        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={handleSend}>
                            <Ionicons name="send" size={20} color={colors.textInverse} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    chatTitle: { fontSize: 18, fontWeight: 'bold' },
    closeChatBtn: { padding: 5 },
    msgBubble: { maxWidth: '80%', padding: 12, borderRadius: 20, marginBottom: 10 },
    msgBubbleMe: { alignSelf: 'flex-end', borderBottomRightRadius: 0 },
    msgBubbleThem: { alignSelf: 'flex-start', borderBottomLeftRadius: 0 },
    msgText: { fontSize: 16 },
    msgTime: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },
    chatInputContainer: { flexDirection: 'row', padding: 15, borderTopWidth: 1, alignItems: 'center' },
    chatInput: { flex: 1, borderRadius: 25, paddingHorizontal: 20, paddingVertical: 10, marginRight: 10, fontSize: 16 },
    sendBtn: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
});
