import { getSupabaseClient } from '@/lib/supabase/client';

export interface UserProfile {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    currency_preference: string;
    language_preference: string;
    email_notifications: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Get or create user profile from profiles table
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = getSupabaseClient();

    // Try to get existing profile
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profile) {
        return profile as UserProfile;
    }

    // If not exists, create new profile
    if (error?.code === 'PGRST116') { // No rows returned
        const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({ id: userId } as never)
            .select()
            .single();

        if (insertError) {
            console.error('Error creating user profile:', insertError);
            return null;
        }

        return newProfile as UserProfile;
    }

    console.error('Error fetching user profile:', error);
    return null;
}

/**
 * Update user display name in profiles table
 */
export async function updateDisplayName(userId: string, displayName: string): Promise<boolean> {
    const supabase = getSupabaseClient();

    // First, ensure profile exists
    await getUserProfile(userId);

    // Update display name
    const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName } as never)
        .eq('id', userId);

    if (error) {
        console.error('Error updating display name:', error);
        return false;
    }

    return true;
}

/**
 * Get display name (prioritize profiles.display_name over auth metadata)
 */
export async function getDisplayName(userId: string, authFullName?: string): Promise<string> {
    const profile = await getUserProfile(userId);

    // Priority: profiles.display_name > auth.full_name > 'User'
    if (profile?.display_name) {
        return profile.display_name;
    }

    return authFullName || 'User';
}
