/**
 * avatarSync
 * Load and save AvatarConfigV2 to Supabase player_profiles.
 * Uses user_email (Firebase) — not auth.uid().
 */
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AvatarConfigV2, DEFAULT_AVATAR_V2 } from './SkyCharacterV2';

export async function loadAvatarConfig(userEmail: string): Promise<AvatarConfigV2> {
  if (!isSupabaseConfigured() || !userEmail) return DEFAULT_AVATAR_V2;
  try {
    const { data, error } = await supabase
      .from('player_profiles')
      .select('avatar_config')
      .eq('email', userEmail)
      .single();
    if (error || !data?.avatar_config) return DEFAULT_AVATAR_V2;
    return { ...DEFAULT_AVATAR_V2, ...(data.avatar_config as Partial<AvatarConfigV2>) };
  } catch {
    return DEFAULT_AVATAR_V2;
  }
}

export async function saveAvatarConfig(userEmail: string, cfg: AvatarConfigV2): Promise<void> {
  if (!isSupabaseConfigured() || !userEmail) return;
  try {
    await supabase
      .from('player_profiles')
      .upsert(
        { email: userEmail, avatar_config: cfg, updated_at: new Date().toISOString() },
        { onConflict: 'email' }
      );
  } catch (e) {
    console.warn('[avatarSync] save failed:', e);
  }
}
