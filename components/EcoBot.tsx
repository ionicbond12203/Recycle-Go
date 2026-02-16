import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
}

interface EcoBotProps {
    visible: boolean;
    onClose: () => void;
}

import { useTheme } from '../contexts/ThemeContext';
import { askGemini } from '../lib/gemini';

export default function EcoBot({ visible, onClose }: EcoBotProps) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: "Hi! I'm EcoBot 🤖. Not sure if something is recyclable? Ask me!", sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
        };
    }, []);

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

    React.useEffect(() => {
        if (visible) {
            // Pick 3 random unique suggestions
            const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random());
            setSuggestions(shuffled.slice(0, 3));
        }
    }, [visible]);

    const simulateStreaming = useCallback((botMsgId: string, fullText: string) => {
        const words = fullText.split(/(\s+)/); // Split but keep whitespace
        let wordIndex = 0;

        streamIntervalRef.current = setInterval(() => {
            if (wordIndex >= words.length) {
                if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
                streamIntervalRef.current = null;
                setIsStreaming(false);
                return;
            }

            // Add a few words at a time for natural pacing
            const chunk = words.slice(wordIndex, wordIndex + 2).join('');
            wordIndex += 2;

            setMessages(prev =>
                prev.map(m =>
                    m.id === botMsgId
                        ? { ...m, text: m.text + chunk }
                        : m
                )
            );
        }, 30);
    }, []);

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

        try {
            const fullReply = await askGemini(textToSend, messages);
            // Simulate streaming by revealing word-by-word
            simulateStreaming(botMsgId, fullReply);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev =>
                prev.map(m =>
                    m.id === botMsgId
                        ? { ...m, text: 'Sorry, I\'m having trouble connecting. 📡' }
                        : m
                )
            );
            setIsStreaming(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? 20 : 0, backgroundColor: colors.backgroundSecondary }]}>

                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <View style={[styles.botIcon, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={{ fontSize: 24 }}>🤖</Text>
                    </View>
                    <View>
                        <Text style={[styles.title, { color: colors.text }]}>Eco-Assistant</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Ask me about recycling</Text>
                    </View>
                    {/* Close button removed for system back */}
                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    {/* Chat Area */}
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        style={{ flex: 1 }}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                        renderItem={({ item }) => (
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
                                    {/* Parse text for links if bot message */}
                                    {item.sender === 'bot' ? (
                                        item.text.split(/(\s+)/).map((part: string, index: number) => {
                                            const urlRegex = /(https?:\/\/[^\s]+)/g;
                                            const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

                                            if (urlRegex.test(part)) {
                                                return (
                                                    <Text
                                                        key={index}
                                                        style={{ color: colors.info, textDecorationLine: 'underline' }}
                                                        onPress={() => Linking.openURL(part)}
                                                    >
                                                        {part}
                                                    </Text>
                                                );
                                            } else if (emailRegex.test(part)) {
                                                return (
                                                    <Text
                                                        key={index}
                                                        style={{ color: colors.info, textDecorationLine: 'underline' }}
                                                        onPress={() => Linking.openURL(`mailto:${part}`)}
                                                    >
                                                        {part}
                                                    </Text>
                                                );
                                            }
                                            return <Text key={index}>{part}</Text>;
                                        })
                                    ) : (
                                        item.text
                                    )}
                                </Text>
                            </View>
                        )}
                    />

                    {/* Suggestions */}
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

                    {/* Input */}
                    <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 5), backgroundColor: colors.card, borderTopColor: colors.border }]}>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Type e.g., 'Is foil recyclable?'"
                            placeholderTextColor={colors.textTertiary}
                            onSubmitEditing={() => handleSend()}
                        />
                        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: isStreaming ? 0.5 : 1 }]} onPress={() => handleSend()} disabled={isStreaming}>
                            <Ionicons name={isStreaming ? "ellipsis-horizontal" : "send"} size={20} color={colors.textInverse} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    botIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    title: { fontSize: 18, fontWeight: 'bold' },
    subtitle: { fontSize: 12 },
    closeBtn: { marginLeft: 'auto', padding: 5 },
    listContent: { padding: 15, paddingBottom: 20 },
    bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12 },
    userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    botBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    msgText: { fontSize: 15, lineHeight: 22 },
    userText: {},
    botText: {},
    inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, alignItems: 'center' },
    input: { flex: 1, borderRadius: 25, paddingHorizontal: 20, paddingVertical: 12, marginRight: 10, fontSize: 16 },
    sendBtn: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    suggestionsWrapper: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'transparent' },
    suggestionsContainer: { paddingHorizontal: 15, gap: 10 },
    suggestionChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    suggestionText: { fontSize: 13, fontWeight: '600' }
});
