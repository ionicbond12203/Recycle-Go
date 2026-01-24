import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

export default function CompleteProfileScreen() {
    const { user, profile, refreshProfile, signOut } = useAuth();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '');
    const [contactNumber, setContactNumber] = useState(profile?.contact_number || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!fullName.trim() || !contactNumber.trim()) {
            Alert.alert('Missing Information', 'Please fill in all fields to continue.');
            return;
        }

        try {
            setLoading(true);

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName.trim(),
                    contact_number: contactNumber.trim(),
                })
                .eq('id', user?.id);

            if (error) throw error;

            await refreshProfile();

            // Redirect to root to let InitialRedirect handle the dispatch based on role
            router.replace('/');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace('/login');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
            >
                <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Complete Profile</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Please provide your details to continue using Recycle Go.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                                placeholder="Enter your full name"
                                placeholderTextColor={colors.textSecondary}
                                value={fullName}
                                onChangeText={setFullName}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Contact Number</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                                placeholder="Enter your contact number"
                                placeholderTextColor={colors.textSecondary}
                                value={contactNumber}
                                onChangeText={setContactNumber}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: colors.primary }]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save & Continue</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.signOutButton}
                            onPress={handleSignOut}
                            disabled={loading}
                        >
                            <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    saveButton: {
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    signOutButton: {
        marginTop: 20,
        alignItems: 'center',
        padding: 10,
    },
    signOutText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
