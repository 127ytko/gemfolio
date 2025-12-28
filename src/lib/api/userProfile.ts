import { getSupabaseClient } from '@/lib/supabase/client';

export interface UserProfile {
    id: string;
    user_id: string;
    display_name: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Get or create user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = getSupabaseClient();

    // Try to get existing profile
    const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (profile) {
        return profile;
    }

    // If not exists, create new profile
    if (error?.code === 'PGRST116') { // No rows returned
        const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert({ user_id: userId } as never)
            .select()
            .single();

        if (insertError) {
            console.error('Error creating user profile:', insertError);
            return null;
        }

        return newProfile;
    }

    console.error('Error fetching user profile:', error);
    return null;
}

/**
 * Update user display name
 */
export async function updateDisplayName(userId: string, displayName: string): Promise<boolean> {
    const supabase = getSupabaseClient();

    // First, ensure profile exists
    await getUserProfile(userId);

    // Update display name
    const { error } = await supabase
        .from('user_profiles')
        .update({ display_name: displayName } as never)
        .eq('user_id', userId);

    if (error) {
        console.error('Error updating display name:', error);
        return false;
    }

    return true;
}

/**
 * Get display name (prioritize user_profiles over auth metadata)
 */
export async function getDisplayName(userId: string, authFullName?: string): Promise<string> {
    const profile = await getUserProfile(userId);

    // Priority: user_profiles.display_name > auth.full_name > 'User'
    if (profile?.display_name) {
        return profile.display_name;
    }

    return authFullName || 'User';
}
