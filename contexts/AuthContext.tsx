// contexts/AuthContext.tsx
import type { Session, User } from '@supabase/supabase-js';
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
    isGuest: boolean;
    pendingRole: UserRole | null;
    signInWithGoogle: (selectedRole?: UserRole) => Promise<void>;
    signInAsDevAdmin: () => Promise<void>;
    signOut: () => Promise<void>;
    setUserRole: (role: UserRole) => void;
    refreshProfile: () => Promise<void>;
    continueAsGuest: () => void;
    setAdminRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isProfileComplete, setIsProfileComplete] = useState(true); // Default to true to avoid flash, check in effect
    const [isGuest, setIsGuest] = useState(false);
    const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

    // Listen to auth state changes
    useEffect(() => {
        // Warm up the browser for faster OAuth
        WebBrowser.warmUpAsync();

        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                await loadUserRole(session.user.id);
            }
            setLoading(false);
        });

        // 1. Initial URL check (for deep links that open the app)
        const { Linking } = require('react-native');
        Linking.getInitialURL().then((url: string | null) => {
            if (url) {
                console.log('App opened with initial URL:', url);
                if (url.includes('access_token')) {
                    handleAuthRedirect(url);
                }
            }
        });

        // 2. Continuous Deep Link listener
        const handleDeepLink = (event: { url: string }) => {
            console.log('Global Deep link received:', event.url);
            if (event.url.includes('access_token')) {
                handleAuthRedirect(event.url);
            }
        };
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // 3. Subscribe to auth changes
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                console.log('Auth state changed:', _event);

                // If we are handling a SIGNed_IN event, we want to be careful not to
                // double-fetch if handleAuthRedirect is also doing it.
                // But for safety, we allow it, as consistency is key.

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    // Only load role if we haven't just manually done it? 
                    // Actually, let's just make loadUserRole efficient.
                    loadUserRole(session.user.id);
                } else {
                    setUserRole(null);
                    setProfile(null);
                    setIsProfileComplete(false);
                    setPendingRole(null); // Clear pending role on logout
                }
            }
        );

        return () => {
            WebBrowser.coolDownAsync();
            subscription.remove();
            authSubscription.unsubscribe();
        };
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

    const signInAsDevAdmin = async () => {
        if (!__DEV__) return;

        setLoading(true);
        try {
            // Mock an admin user
            const mockUser: User = {
                id: 'dev-admin-id',
                email: 'dev@admin.com',
                user_metadata: {
                    full_name: 'Dev Admin',
                    avatar_url: 'https://via.placeholder.com/150'
                },
                app_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString()
            };

            const mockProfile: Profile = {
                id: 'dev-admin-id',
                email: 'dev@admin.com',
                role: 'admin',
                full_name: 'Dev Admin',
                contact_number: '+0000000000'
            };

            setUser(mockUser);
            setProfile(mockProfile);
            setUserRole('admin');
            setIsProfileComplete(true);
            setIsGuest(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async (selectedRole?: UserRole) => {
        try {
            setLoading(true);

            // Hardcoded redirect URL to match Supabase config exactly
            const redirectUrl = 'recycle-go://auth/callback';
            console.log('Initial Google Sign In with Redirect URL:', redirectUrl);

            if (selectedRole) {
                setPendingRole(selectedRole);
            }

            // Start OAuth flow with Supabase
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;

            if (data?.url) {
                console.log('Opening OAuth browser...');
                const result = await WebBrowser.openBrowserAsync(data.url);

                // If the user closed the browser without signing in
                if (result.type === 'cancel' || result.type === 'dismiss') {
                    setLoading(false);
                }
            }
        } catch (error: any) {
            console.error('Google sign-in error:', error);
            Alert.alert('Sign In Error', error.message || 'Failed to sign in');
            setLoading(false);
        }
    };

    const handleAuthRedirect = async (url: string, selectedRole?: UserRole) => {
        console.log('Processing Auth Redirect URL:', url);
        try {
            // Extract tokens from URL hash or query
            const tokens: { [key: string]: string } = {};

            // Try parsing from hash (#)
            const hashParts = url.split('#');
            if (hashParts.length > 1) {
                console.log('Found hash parts, parsing...');
                const pairs = hashParts[1].split('&');
                pairs.forEach(pair => {
                    const [key, value] = pair.split('=');
                    tokens[key] = value;
                });
            }

            // Also try parsing from query (?) just in case
            const queryParts = url.split('?');
            if (queryParts.length > 1) {
                console.log('Found query parts, parsing...');
                const pairs = queryParts[1].split('&');
                pairs.forEach(pair => {
                    const [key, value] = pair.split('=');
                    if (!tokens[key]) tokens[key] = value;
                });
            }

            const accessToken = tokens['access_token'];
            const refreshToken = tokens['refresh_token'];

            console.log('Access Token detected:', !!accessToken);
            console.log('Refresh Token detected:', !!refreshToken);

            if (accessToken && refreshToken) {
                console.log('Setting Supabase session with tokens...');
                const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (sessionError) throw sessionError;

                if (sessionData.user) {
                    console.log('Auth check complete. Profile role update starting...');
                    const roleToUse = selectedRole || pendingRole;
                    await createOrUpdateProfile(sessionData.user, roleToUse || undefined);
                    await loadUserRole(sessionData.user.id);
                    setPendingRole(null); // Clear after use
                }
            } else {
                console.warn('Missing tokens in redirect URL');
            }
        } catch (err: any) {
            console.error('Error in handleAuthRedirect:', err);
        } finally {
            // ALWAYS reset loading state after processing logic
            setLoading(false);
        }
    };

    const createOrUpdateProfile = async (user: User, selectedRole?: UserRole) => {
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
                    role: selectedRole || 'contributor',
                });
            } else if (selectedRole && profile.role !== selectedRole) {
                // If logging in with a specific role trick (like admin), update existing record
                await supabase.from('profiles').update({
                    role: selectedRole
                }).eq('id', user.id);
            }
        } catch (error) {
            console.log('Profile handling error:', error);
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
            setIsGuest(false); // Clear guest status on sign out
        } catch (error: any) {
            console.error('Sign out error:', error);
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const continueAsGuest = () => {
        setIsGuest(true);
        setLoading(false);
    };

    const setAdminRole = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { error } = await supabase
                .from('profiles')
                .update({ role: 'admin' })
                .eq('id', user.id);
            if (error) throw error;
            await loadUserRole(user.id);
            Alert.alert('Success', 'Role updated to admin. Please restart the app if changes are not immediate.');
        } catch (error: any) {
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
        isGuest,
        pendingRole,
        signInWithGoogle,
        signInAsDevAdmin,
        signOut,
        setUserRole,
        refreshProfile,
        continueAsGuest,
        setAdminRole,
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
