import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { askGeminiStream, askEcoAgent } from '../lib/gemini';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    showContactButtons?: boolean;
}

interface EcoBotProps {
    visible: boolean;
    onClose: () => void;
    onScan?: () => void;
    onOpenCart?: () => void;
    onViewProfile?: () => void;
    onTrack?: () => void;
    userStats?: { points: number, savedCO2: string, recycled: string };
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    botIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    title: { fontSize: 18, fontWeight: 'bold' },
    subtitle: { fontSize: 12 },
    listContent: { padding: 15, paddingBottom: 20 },
    bubbleWrapper: { marginBottom: 12 },
    bubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
    userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    botBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    msgText: { fontSize: 15, lineHeight: 22 },
    userText: {},
    botText: {},
    actionContainer: { flexDirection: 'row', marginTop: 8, gap: 8, flexWrap: 'wrap' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    actionText: { fontSize: 13, fontWeight: '600' },
    inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, alignItems: 'center' },
    input: { flex: 1, borderRadius: 25, paddingHorizontal: 20, paddingVertical: 12, marginRight: 10, fontSize: 16 },
    sendBtn: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    suggestionsWrapper: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'transparent' },
    suggestionsContainer: { paddingHorizontal: 15, gap: 10 },
    suggestionChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    suggestionText: { fontSize: 13, fontWeight: '600' }
});

const ALL_SUGGESTIONS = [
    "Is plastic foil recyclable?",
    "How to recycle glass jars?",
    "Can I recycle pizza boxes?",
    "Where is the nearest collection point?",
    "What are the benefits of recycling?",
    "How to earn more points?",
    "Is electronic waste accepted?",
    "How to wash containers before recycling?"
];

// Memoized Header to prevent flickering during streaming re-renders
const ChatHeader = React.memo(({ colors, onClearChat }: { colors: any, onClearChat: () => void }) => (
    <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.botIcon, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={{ fontSize: 24 }}>🤖</Text>
        </View>
        <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>Eco-Assistant</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Online • Gemini</Text>
        </View>
        <TouchableOpacity style={{ padding: 8 }} onPress={onClearChat}>
            <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    </View>
));

// Memoized Message Bubble to optimize rendering of the growing text list
const MessageBubble = React.memo(({ item, colors }: { item: Message, colors: any }) => (
    <View style={styles.bubbleWrapper}>
        <View style={[
            styles.bubble,
            item.sender === 'user'
                ? [styles.userBubble, { backgroundColor: colors.userBubble }]
                : [styles.botBubble, { backgroundColor: colors.botBubble }]
        ]}>
            <Text style={[
                styles.msgText,
                item.sender === 'user' ? [styles.userText, { color: colors.textInverse }] : [styles.botText, { color: colors.text }]
            ]}>
                {item.text}
            </Text>
        </View>

        {item.showContactButtons && (
            <View style={styles.actionContainer}>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.primary }]}
                    onPress={() => Linking.openURL('mailto:ionicb83@gmail.com')}
                >
                    <Ionicons name="mail-outline" size={16} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>Email IONIC</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.primary }]}
                    onPress={() => Linking.openURL('https://github.com/ionicbond12203/Recycle-Go')}
                >
                    <Ionicons name="logo-github" size={16} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>GitHub Repo</Text>
                </TouchableOpacity>
            </View>
        )}
    </View>
));

export default function EcoBot({ visible, onClose, onScan, onOpenCart, onViewProfile, onTrack, userStats }: EcoBotProps) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: "Hi! I'm EcoBot 🤖. Not sure if something is recyclable? Ask me!", sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const streamingTextRef = useRef("");

    // Setup suggestions when modal opens
    useEffect(() => {
        if (visible) {
            const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random());
            setSuggestions(shuffled.slice(0, 3));
        }
    }, [visible]);

    const handleSend = async (overrideText?: string) => {
        const textToSend = overrideText || inputText;
        if (!textToSend.trim() || isStreaming) return;

        const userMsg: Message = { id: Date.now().toString(), text: textToSend, sender: 'user' };
        const botMsgId = (Date.now() + 1).toString();
        const botMsg: Message = { id: botMsgId, text: '', sender: 'bot' };

        setMessages(prev => [...prev, userMsg, botMsg]);
        setInputText("");
        setSuggestions([]);
        setIsStreaming(true);
        streamingTextRef.current = "";

        let lastUpdate = Date.now();

        try {
            const finalReply = await askEcoAgent(textToSend, messages, userStats);
            streamingTextRef.current = finalReply;

            setMessages(prev =>
                prev.map(m =>
                    m.id === botMsgId
                        ? { ...m, text: finalReply.replace('[CONTACT_ACTION]', '').trim() }
                        : m
                )
            );

            // Final state sync for completion & action detection
            const finalProcessed = streamingTextRef.current;
            const hasAction = finalProcessed.includes('[CONTACT_ACTION]');
            
            // Handle Navigation Triggers
            if (finalProcessed.includes('[ACTION_SCAN]') && onScan) {
                setTimeout(() => onScan(), 800);
            } else if (finalProcessed.includes('[ACTION_OPEN_CART]') && onOpenCart) {
                setTimeout(() => onOpenCart(), 800);
            } else if (finalProcessed.includes('[ACTION_VIEW_PROFILE]') && onViewProfile) {
                setTimeout(() => onViewProfile(), 800);
            } else if (finalProcessed.includes('[ACTION_TRACK_DRIVER]') && onTrack) {
                setTimeout(() => onTrack(), 800);
            }

            const cleanFinal = finalProcessed
                .replace('[CONTACT_ACTION]', '')
                .replace('[ACTION_SCAN]', '')
                .replace('[ACTION_OPEN_CART]', '')
                .replace('[ACTION_VIEW_PROFILE]', '')
                .replace('[ACTION_TRACK_DRIVER]', '')
                .trim();

            setMessages(prev =>
                prev.map(m =>
                    m.id === botMsgId
                        ? { ...m, text: cleanFinal, showContactButtons: hasAction }
                        : m
                )
            );
        } catch (error: any) {
            console.error('Chat error:', error);
            setMessages(prev =>
                prev.map(m =>
                    m.id === botMsgId
                        ? { ...m, text: 'Sorry, I\'m having trouble connecting to the assistant. 🤖' }
                        : m
                )
            );
        } finally {
            setIsStreaming(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? 20 : 0, backgroundColor: colors.backgroundSecondary }]}>

                <ChatHeader
                    colors={colors}
                    onClearChat={() => setMessages([{ id: Date.now().toString(), text: "Hi! I'm EcoBot 🤖. Not sure if something is recyclable? Ask me!", sender: 'bot' }])}
                />

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        style={{ flex: 1 }}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                        renderItem={({ item }) => <MessageBubble item={item} colors={colors} />}
                        removeClippedSubviews={false}
                    />

                    {suggestions.length > 0 && (
                        <View style={styles.suggestionsWrapper}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsContainer}>
                                {suggestions.map((s, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.suggestionChip, { backgroundColor: colors.card, borderColor: colors.primary }]}
                                        onPress={() => handleSend(s)}
                                    >
                                        <Text style={[styles.suggestionText, { color: colors.primary }]}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 5), backgroundColor: colors.card, borderTopColor: colors.border }]}>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Type e.g., 'Is foil recyclable?'"
                            placeholderTextColor={colors.textTertiary}
                            onSubmitEditing={() => handleSend()}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: isStreaming ? 0.5 : 1 }]}
                            onPress={() => handleSend()}
                            disabled={isStreaming}
                        >
                            <Ionicons name={isStreaming ? "ellipsis-horizontal" : "send"} size={20} color={colors.textInverse} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}
