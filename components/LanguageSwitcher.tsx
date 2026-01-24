import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Language } from '../i18n/translations';

export default function LanguageSwitcher() {
    const { colors } = useTheme();
    const { language, setLanguage } = useLanguage();
    const [modalVisible, setModalVisible] = useState(false);

    const languages: { code: Language; label: string; flag: string }[] = [
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'zh', label: '中文 (Mandarin)', flag: '🇨🇳' },
        { code: 'ms', label: 'Bahasa Melayu', flag: '🇲🇾' }
    ];

    const handleSelect = (code: Language) => {
        setLanguage(code);
        setModalVisible(false);
    };

    return (
        <>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.card }]} onPress={() => setModalVisible(true)}>
                <Ionicons name="language" size={20} color={colors.text} />
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <TouchableOpacity style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => setModalVisible(false)}>
                    <View style={[styles.menu, { backgroundColor: colors.card }]}>
                        <Text style={[styles.title, { color: colors.text }]}>Select Language</Text>
                        {languages.map((lang) => (
                            <TouchableOpacity
                                key={lang.code}
                                style={[
                                    styles.option,
                                    { borderBottomColor: colors.divider },
                                    language === lang.code && { backgroundColor: colors.backgroundSecondary }
                                ]}
                                onPress={() => handleSelect(lang.code)}
                            >
                                <Text style={styles.flag}>{lang.flag}</Text>
                                <Text style={[
                                    styles.label,
                                    { color: colors.text },
                                    language === lang.code && { color: colors.primary, fontWeight: 'bold' }
                                ]}>{lang.label}</Text>
                                {language === lang.code && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: "#000", shadowOpacity: 0.1, elevation: 3
    },
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    menu: { width: 250, borderRadius: 15, padding: 20, elevation: 5 },
    title: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    flag: { fontSize: 24, marginRight: 15 },
    label: { fontSize: 16, flex: 1 },
});
