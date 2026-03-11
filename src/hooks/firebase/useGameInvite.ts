import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, set, onValue, off, remove, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { sanitizeFirebasePath } from './useRealtimeGame';
import { useAuth } from '@/contexts/AuthContext';

export type InviteStatus = 'idle' | 'creating' | 'waiting' | 'joined' | 'error';

export interface GameInvite {
  roomId: string;
  hostEmail: string;
  guestEmail: string | null;
  gameType: string;
  status: 'open' | 'accepted' | 'active' | 'cancelled';
  createdAt: number;
  expiresAt: number;   // 20 minutes from creation
}

const ROOM_TTL_MS = 20 * 60 * 1000; // 20 minutes

const isFirebaseAvailable = () => {
  try {
    return !!(import.meta.env.VITE_FIREBASE_DATABASE_URL && database);
  } catch {
    return false;
  }
};

export const useGameInvite = (gameType: string) => {
  const { user } = useAuth();
  const [status,  setStatus]  = useState<InviteStatus>('idle');
  const [roomId,  setRoomId]  = useState<string | null>(null);
  const [invite,  setInvite]  = useState<GameInvite | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  // Track whether WE created this room (so we only clean up our own rooms)
  const isOwner = useRef(false);

  const generateRoomId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  // HOST: create a room with 20-min TTL
  const createRoom = useCallback(async () => {
    if (!user?.email || !isFirebaseAvailable()) {
      setError('Firebase not configured.');
      return null;
    }
    setStatus('creating');
    const id  = generateRoomId();
    const now = Date.now();
    const inviteData: GameInvite = {
      roomId:     id,
      hostEmail:  user.email,
      guestEmail: null,
      gameType,
      status:     'open',
      createdAt:  now,
      expiresAt:  now + ROOM_TTL_MS,
    };
    try {
      await set(ref(database, `invites/${id}`), inviteData);
      setRoomId(id);
      setInvite(inviteData);
      setStatus('waiting');
      isOwner.current = true;
      return id;
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
      return null;
    }
  }, [user, gameType]);

  // GUEST: join a room — accepts both 'open' and 'active' (already-playing room)
  const joinRoom = useCallback(async (code: string) => {
    if (!user?.email || !isFirebaseAvailable()) {
      setError('Firebase not configured.');
      return false;
    }
    const upperCode = code.toUpperCase().trim();
    try {
      const inviteRef = ref(database, `invites/${upperCode}`);
      const snap = await new Promise<any>((resolve, reject) => {
        onValue(inviteRef, resolve, reject, { onlyOnce: true });
      });
      const data: GameInvite | null = snap.val();
      if (!data)                              { setError('Room not found.');             return false; }
      if (data.status === 'cancelled')        { setError('Room has been cancelled.');    return false; }
      if (data.gameType !== gameType)         { setError(`Invite is for ${data.gameType}.`); return false; }
      if (Date.now() > data.expiresAt)        { setError('Room code has expired.');      return false; }
      // Allow joining if open OR if this guest was already the registered guest (rejoin)
      const alreadyGuest = data.guestEmail === user.email;
      if (data.status !== 'open' && !alreadyGuest) {
        setError('Room is no longer open.'); return false;
      }

      await update(inviteRef, { guestEmail: user.email, status: 'active' });
      setRoomId(upperCode);
      setInvite({ ...data, guestEmail: user.email, status: 'active' });
      setStatus('joined');
      isOwner.current = false;
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  }, [user, gameType]);

  // HOST: listen for guest joining
  useEffect(() => {
    if (!roomId || status !== 'waiting' || !isFirebaseAvailable()) return;
    const inviteRef = ref(database, `invites/${roomId}`);
    const unsub = onValue(inviteRef, (snap) => {
      const data: GameInvite | null = snap.val();
      if (data?.guestEmail && (data.status === 'accepted' || data.status === 'active')) {
        setInvite(data);
        setStatus('joined');
      }
    });
    return () => off(inviteRef);
  }, [roomId, status]);

  // Cancel room — only deletes if we own it AND explicitly called
  const cancelRoom = useCallback(async () => {
    if (!roomId || !isFirebaseAvailable() || !isOwner.current) return;
    try { await remove(ref(database, `invites/${roomId}`)); } catch {}
    setRoomId(null);
    setInvite(null);
    setStatus('idle');
    isOwner.current = false;
  }, [roomId]);

  // On modal close (not game exit) — do NOT delete the invite, just reset local UI state
  // The room stays alive in Firebase for up to 20 minutes
  const closeModal = useCallback(() => {
    setStatus('idle');
    // Do NOT clear roomId or delete invite — game component holds roomId separately
  }, []);

  // Cleanup ONLY on actual page unload (tab close / navigate away), not on component unmount
  useEffect(() => {
    const handleUnload = () => {
      if (roomId && isOwner.current && isFirebaseAvailable()) {
        // Use sendBeacon for reliability on page close
        const url = `${import.meta.env.VITE_FIREBASE_DATABASE_URL}/invites/${roomId}.json`;
        navigator.sendBeacon?.(url + '?method=DELETE');
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [roomId]);

  return { status, roomId, invite, error, createRoom, joinRoom, cancelRoom, closeModal };
};
