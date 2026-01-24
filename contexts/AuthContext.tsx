// contexts/AuthContext.tsx
import type { Session, User } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

// Needed for web browser redirect
WebBrowser.maybeCompleteAuthSession();

// Your Google Web Client ID
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!;

// Supabase OAuth redirect URL
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

export type UserRole = 'contributor' | 'collector' | 'admin';

export interface Profile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    role: UserRole;
    contact_number?: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    userRole: UserRole | null;
    profile: Profile | null;
    isProfileComplete: boolean;
    signInWithGoogle: (selectedRole?: UserRole) => Promise<void>;
    signOut: () => Promise<void>;
    setUserRole: (role: UserRole) => void;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isProfileComplete, setIsProfileComplete] = useState(true); // Default to true to avoid flash, check in effect

    // Listen to auth state changes
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                await loadUserRole(session.user.id);
            }
            setLoading(false);
        });

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    loadUserRole(session.user.id);
                } else {
                    setUserRole(null);
                    setProfile(null);
                    setIsProfileComplete(false);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const loadUserRole = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data) {
                const userProfile = data as Profile;
                setUserRole(userProfile.role);
                setProfile(userProfile);
                checkProfileCompletion(userProfile);
            }
        } catch (error) {
            console.log('Error loading user role:', error);
        }
    };

    const checkProfileCompletion = (profile: Profile) => {
        if (profile.role === 'admin') {
            setIsProfileComplete(true);
            return;
        }

        // Check for mandatory fields
        const isComplete = !!(profile.full_name && profile.contact_number);
        setIsProfileComplete(isComplete);
    };

    const refreshProfile = async () => {
        if (user) {
            await loadUserRole(user.id);
        }
    };

    const signInWithGoogle = async (selectedRole?: UserRole) => {
        try {
            setLoading(true);

            // Create redirect URL for the app - use native for development build
            const redirectUrl = AuthSession.makeRedirectUri({
                scheme: 'applemap',
                path: 'auth/callback',
            });

            console.log('Redirect URL:', redirectUrl);
            console.log('Add this URL to Supabase Dashboard > Auth > URL Configuration > Redirect URLs');

            // Start OAuth flow with Supabase
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (error) {
                throw error;
            }

            if (data?.url) {
                // Open browser for OAuth
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectUrl
                );

                if (result.type === 'success' && result.url) {
                    // Parse the URL to get tokens
                    const url = new URL(result.url);
                    const params = new URLSearchParams(url.hash.substring(1));

                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken && refreshToken) {
                        // Set session with tokens
                        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });

                        if (sessionError) {
                            throw sessionError;
                        }

                        // Create profile if needed
                        if (sessionData.user) {
                            await createProfileIfNeeded(sessionData.user, selectedRole);
                            // Explicitly load role immediately after creation to ensure state is ready
                            await loadUserRole(sessionData.user.id);
                        }
                    }
                } else if (result.type === 'cancel' || result.type === 'dismiss') {
                    console.log('User cancelled sign-in');
                }
            }
        } catch (error: any) {
            console.error('Google sign-in error:', error);
            Alert.alert('Sign In Error', error.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    const createProfileIfNeeded = async (user: User, selectedRole?: UserRole) => {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!profile) {
                await supabase.from('profiles').insert({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.email,
                    avatar_url: user.user_metadata?.avatar_url,
                    role: selectedRole || userRole || 'contributor',
                });
            }
        } catch (error) {
            console.log('Profile creation error:', error);
        }
    };

    const signOut = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setUser(null);
            setSession(null);
            setUserRole(null);
            setProfile(null);
            setIsProfileComplete(false);
        } catch (error: any) {
            console.error('Sign out error:', error);
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const value: AuthContextType = {
        user,
        session,
        loading,
        userRole,
        profile,
        isProfileComplete,
        signInWithGoogle,
        signOut,
        setUserRole,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
