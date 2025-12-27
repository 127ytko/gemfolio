'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    // Email/Password auth
    signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
    signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
    // OAuth
    signInWithGoogle: () => Promise<void>;
    // Sign out
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = getSupabaseClient();

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Sign up with email and password
    const signUp = async (email: string, password: string, displayName?: string) => {
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: displayName,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        return { error };
    };

    // Sign in with email and password
    const signInWithEmail = async (email: string, password: string) => {
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };

    // Reset password
    const resetPassword = async (email: string) => {
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        return { error };
    };

    // Sign in with Google OAuth
    const signInWithGoogle = async () => {
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    };

    // Sign out
    const signOut = async () => {
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                signUp,
                signInWithEmail,
                resetPassword,
                signInWithGoogle,
                signOut
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
