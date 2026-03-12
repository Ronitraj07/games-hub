/**
 * avatarUtils — encode/decode AvatarConfig to/from base64 string
 * Stored in Zustand avatarUrl field + Firebase player state
 */
import type { AvatarConfig } from './AvatarCreator';
import { DEFAULT_AVATAR } from './AvatarCreator';

export function encodeAvatar(cfg: AvatarConfig): string {
  try { return btoa(JSON.stringify(cfg)); }
  catch { return ''; }
}

export function decodeAvatar(encoded: string | null): AvatarConfig {
  if (!encoded) return { ...DEFAULT_AVATAR };
  try {
    const parsed = JSON.parse(atob(encoded));
    return { ...DEFAULT_AVATAR, ...parsed };
  } catch {
    return { ...DEFAULT_AVATAR };
  }
}
