/**
 * useHeartboundSync
 * -----------------
 * Syncs a player's world position + direction to a FIXED persistent Firebase path.
 * No room codes — both players always share the same node:
 *   heartbound/meadow-haven/players/<base64email>
 *
 * Also subscribes to all other players in the world and exposes
 * an `onlinePlayers` list so the hub page can show who’s currently in.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { ref, set, onValue, off, remove, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebase';

export interface PlayerState {
  email:       string;
  name:        string;
  x:           number;
  y:           number;
  dir:         'up' | 'down' | 'left' | 'right';
  moving:      boolean;
  spriteColor: string;
  online:      boolean;
  updatedAt:   number;
}

// Single persistent world — no room codes needed
const WORLD_PATH = 'heartbound/meadow-haven/players';

const isFirebaseOk = () => {
  try { return !!(import.meta.env.VITE_FIREBASE_DATABASE_URL && database); }
  catch { return false; }
};

const encodeEmail = (email: string) =>
  btoa(email).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

export const useHeartboundSync = (
  myEmail:     string,
  myName:      string,
  spriteColor: string,
  onPlayersUpdate: (players: Record<string, PlayerState>) => void,
) => {
  const publishThrottle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myPath = myEmail ? `${WORLD_PATH}/${encodeEmail(myEmail)}` : null;

  // Push my position (throttled ~20fps)
  const publish = useCallback((
    state: Omit<PlayerState, 'email' | 'name' | 'spriteColor' | 'online' | 'updatedAt'>
  ) => {
    if (!myPath || !isFirebaseOk()) return;
    if (publishThrottle.current) clearTimeout(publishThrottle.current);
    publishThrottle.current = setTimeout(() => {
      set(ref(database, myPath), {
        email: myEmail,
        name:  myName,
        spriteColor,
        online: true,
        ...state,
        updatedAt: Date.now(),
      } satisfies PlayerState);
    }, 50);
  }, [myPath, myEmail, myName, spriteColor]);

  // Mark self as online (presence) when entering
  const markOnline = useCallback(() => {
    if (!myPath || !isFirebaseOk()) return;
    set(ref(database, myPath), {
      email: myEmail, name: myName, spriteColor,
      online: true, x: 0, y: 0, dir: 'down', moving: false,
      updatedAt: Date.now(),
    } satisfies PlayerState);
  }, [myPath, myEmail, myName, spriteColor]);

  // Mark self as offline (stays in DB so hub can show “offline”)
  const markOffline = useCallback(() => {
    if (!myPath || !isFirebaseOk()) return;
    set(ref(database, myPath), {
      email: myEmail, name: myName, spriteColor,
      online: false, x: 0, y: 0, dir: 'down', moving: false,
      updatedAt: Date.now(),
    } satisfies PlayerState);
  }, [myPath, myEmail, myName, spriteColor]);

  // Subscribe to all players in the world
  useEffect(() => {
    if (!isFirebaseOk() || !myEmail) return;
    const worldRef = ref(database, WORLD_PATH);
    onValue(worldRef, snap => {
      onPlayersUpdate((snap.val() ?? {}) as Record<string, PlayerState>);
    });
    return () => { off(worldRef); };
  }, [myEmail]);

  // Mark offline on unmount (exit game)
  useEffect(() => {
    return () => { markOffline(); };
  }, [markOffline]);

  return { publish, markOnline, markOffline };
};

// ──────────────────────────────────────────────────────────────────
// Lightweight presence-only hook used by the hub page to show
// who’s currently online before entering
// ──────────────────────────────────────────────────────────────────
export const useHeartboundPresence = () => {
  const [players, setPlayers] = useState<PlayerState[]>([]);

  useEffect(() => {
    if (!isFirebaseOk()) return;
    const worldRef = ref(database, WORLD_PATH);
    onValue(worldRef, snap => {
      const val = snap.val() ?? {};
      setPlayers(Object.values(val) as PlayerState[]);
    });
    return () => off(worldRef);
  }, []);

  return players;
};
