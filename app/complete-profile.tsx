import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

export default function CompleteProfileScreen() {
    const { user, profile, refreshProfile, signOut, userRole: authRole, setAdminRole } = useAuth();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '');
    const [contactNumber, setContactNumber] = useState(profile?.contact_number || '');
    // If user already has a role (e.g. admin from invite/dev), preserve it. Default to contributor otherwise.
    const [role, setRole] = useState<UserRole>(authRole || profile?.role || 'contributor');
    const [loading, setLoading] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);
    const lastTapRef = React.useRef<number>(0);
    const tapsRef = React.useRef<number>(0);

    const handleTitlePress = () => {
        const now = Date.now();
        if (now - lastTapRef.current < 1000) {
            tapsRef.current += 1;
        } else {
            tapsRef.current = 1;
        }
        lastTapRef.current = now;

        if (tapsRef.current >= 5) {
            setShowAdmin(prev => !prev);
            tapsRef.current = 0;
            // Vibration feedback
            try {
                const { Vibration } = require('react-native');
                Vibration.vibrate(100);
            } catch (e) { }
        }
    };

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
                    role: role
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
                        <Text style={[styles.title, { color: colors.text }]} onPress={handleTitlePress}>Complete Profile</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Please provide your details to continue using Recycle Go.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {/* Role Selection */}
                        <View style={{ marginBottom: 24 }}>
                            <Text style={[styles.label, { color: colors.text }]}>I am a:</Text>

                            {/* Special handling for Admin - Read Only */}
                            {role === 'admin' ? (
                                <View style={[styles.roleOption, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}>
                                    <View style={{ alignItems: 'center', gap: 4 }}>
                                        <Text style={{ fontSize: 24 }}>🛡️</Text>
                                        <Text style={[styles.roleText, { color: colors.text }]}>Administrator</Text>
                                        <Text style={[styles.roleSubText, { color: colors.textSecondary }]}>System Access</Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <TouchableOpacity
                                        style={[
                                            styles.roleOption,
                                            { borderColor: colors.primary, backgroundColor: role === 'contributor' ? colors.primary : 'transparent' }
                                        ]}
                                        onPress={() => setRole('contributor')}
                                    >
                                        <View style={{ alignItems: 'center', gap: 4 }}>
                                            <Text style={{ fontSize: 24 }}>🌿</Text>
                                            <Text style={[styles.roleText, { color: role === 'contributor' ? '#fff' : colors.text }]}>Recycle</Text>
                                            <Text style={[styles.roleSubText, { color: role === 'contributor' ? '#eee' : colors.textSecondary }]}>Contributor</Text>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.roleOption,
                                            { borderColor: colors.primary, backgroundColor: role === 'collector' ? colors.primary : 'transparent' }
                                        ]}
                                        onPress={() => setRole('collector')}
                                    >
                                        <View style={{ alignItems: 'center', gap: 4 }}>
                                            <Text style={{ fontSize: 24 }}>🚛</Text>
                                            <Text style={[styles.roleText, { color: role === 'collector' ? '#fff' : colors.text }]}>Collect</Text>
                                            <Text style={[styles.roleSubText, { color: role === 'collector' ? '#eee' : colors.textSecondary }]}>Collector</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

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
                                placeholder="+60 12-345 6789"
                                placeholderTextColor={colors.textSecondary}
                                value={contactNumber}
                                onChangeText={setContactNumber}
                                keyboardType="phone-pad"
                            />
                        </View>

                        {showAdmin && (
                            <TouchableOpacity
                                style={{
                                    padding: 15,
                                    backgroundColor: colors.primary,
                                    borderRadius: 12,
                                    marginBottom: 20,
                                    width: '100%',
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    gap: 10
                                }}
                                onPress={async () => {
                                    try {
                                        setLoading(true);
                                        await setAdminRole();
                                        router.replace('/admin/dashboard');
                                    } catch (e) {
                                        console.error(e);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>⭐ Promote Current User to Admin</Text>
                            </TouchableOpacity>
                        )}

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
    // Role Selection Styles
    roleOption: {
        flex: 1,
        borderWidth: 2,
        borderRadius: 12,
        paddingVertical: 15,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    roleText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 4,
    },
    roleSubText: {
        fontSize: 12,
        marginTop: 2,
    },
});
