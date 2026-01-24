import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

interface WeightVerificationModalProps {
    visible: boolean;
    onClose: () => void;
    actualWeight: string;
    onWeightChange: (weight: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    waitingForConfirmation: boolean;
}

/**
 * Modal for collectors to verify the weight of collected recyclables.
 * Extracted from home.tsx to follow Single Responsibility Principle.
 */
export default function WeightVerificationModal({
    visible,
    onClose,
    actualWeight,
    onWeightChange,
    onSubmit,
    onCancel,
    waitingForConfirmation
}: WeightVerificationModalProps) {
    const { t } = useLanguage();
    const { colors } = useTheme();

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.weightCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.weightTitle, { color: colors.text }]}>⚖️ {t('collector.verifyCollection')}</Text>

                    {!waitingForConfirmation ? (
                        <>
                            <Text style={[styles.weightSub, { color: colors.textSecondary }]}>{t('collector.enterWeight')}:</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={[styles.weightInput, { color: colors.text, borderBottomColor: colors.border }]}
                                    value={actualWeight}
                                    onChangeText={onWeightChange}
                                    keyboardType="decimal-pad"
                                    placeholder="0.0"
                                    placeholderTextColor={colors.textTertiary}
                                    autoFocus
                                />
                                <Text style={[styles.unitText, { color: colors.text }]}>kg</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.confirmWeightBtn, { backgroundColor: colors.primary }]}
                                onPress={onSubmit}
                            >
                                <Text style={[styles.confirmWeightText, { color: colors.textInverse }]}>
                                    {t('actions.submitRequest')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
                                <Text style={{ color: colors.textTertiary }}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={{ alignItems: 'center', padding: 20 }}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={{ marginTop: 15, fontSize: 16, fontWeight: '600', textAlign: 'center', color: colors.text }}>
                                {t('collector.waitingConfirmation')}
                            </Text>
                            <Text style={{ marginTop: 5, color: colors.textSecondary, textAlign: 'center' }}>
                                {t('collector.checkApp')}
                            </Text>
                            <TouchableOpacity style={[styles.cancelLink, { marginTop: 20 }]} onPress={onCancel}>
                                <Text style={{ color: colors.error }}>{t('collector.cancelRequest')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    weightCard: {
        width: '85%',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 20
    },
    weightTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10
    },
    weightSub: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20
    },
    weightInput: {
        fontSize: 40,
        fontWeight: 'bold',
        borderBottomWidth: 2,
        paddingHorizontal: 10,
        textAlign: 'center',
        minWidth: 100
    },
    unitText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 10
    },
    confirmWeightBtn: {
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center'
    },
    confirmWeightText: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    cancelLink: {
        marginTop: 15,
        padding: 10
    },
});
