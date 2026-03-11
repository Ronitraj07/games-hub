/**
 * useHeartboundSync
 * -----------------
 * Syncs a player's world position + direction to Firebase RTDB.
 * Also returns all other players in the same room so the canvas
 * can render them as remote sprites.
 */
import { useEffect, useRef, useCallback } from 'react';
import { ref, set, onValue, off, remove, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebase';

export interface PlayerState {
  email:     string;
  name:      string;
  x:         number;
  y:         number;
  dir:       'up' | 'down' | 'left' | 'right';
  moving:    boolean;
  spriteColor: string;   // hex — Ronit = #60a5fa, Radhika = #f472b6
  updatedAt: number;
}

const isFirebaseOk = () => {
  try { return !!(import.meta.env.VITE_FIREBASE_DATABASE_URL && database); }
  catch { return false; }
};

export const useHeartboundSync = (
  roomCode: string | null,
  myEmail:  string,
  myName:   string,
  spriteColor: string,
  onPlayersUpdate: (players: Record<string, PlayerState>) => void,
) => {
  const publishRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myPath     = roomCode ? `heartbound/${roomCode}/players/${btoa(myEmail).replace(/=/g, '')}` : null;

  // Push my position (throttled to ~20fps)
  const publish = useCallback((state: Omit<PlayerState, 'email' | 'name' | 'spriteColor' | 'updatedAt'>) => {
    if (!myPath || !isFirebaseOk()) return;
    if (publishRef.current) clearTimeout(publishRef.current);
    publishRef.current = setTimeout(() => {
      set(ref(database, myPath), {
        email: myEmail,
        name:  myName,
        spriteColor,
        ...state,
        updatedAt: Date.now(),
      } satisfies PlayerState);
    }, 50); // 20fps
  }, [myPath, myEmail, myName, spriteColor]);

  // Subscribe to all players in this room
  useEffect(() => {
    if (!roomCode || !isFirebaseOk()) return;
    const roomRef = ref(database, `heartbound/${roomCode}/players`);
    onValue(roomRef, snap => {
      onPlayersUpdate((snap.val() ?? {}) as Record<string, PlayerState>);
    });
    return () => { off(roomRef); };
  }, [roomCode]);

  // Remove self on unmount
  useEffect(() => {
    return () => {
      if (myPath && isFirebaseOk()) remove(ref(database, myPath)).catch(() => {});
    };
  }, [myPath]);

  return { publish };
};
