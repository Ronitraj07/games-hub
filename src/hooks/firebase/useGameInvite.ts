import { useState, useEffect, useCallback } from 'react';
import { ref, set, onValue, off, remove } from 'firebase/database';
import { database } from '@/lib/firebase';
import { sanitizeFirebasePath } from './useRealtimeGame';
import { useAuth } from '@/contexts/AuthContext';

export type InviteStatus = 'idle' | 'creating' | 'waiting' | 'joined' | 'error';

export interface GameInvite {
  roomId: string;
  hostEmail: string;
  guestEmail: string | null;
  gameType: string;
  status: 'open' | 'accepted' | 'cancelled';
  createdAt: number;
}

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

  // Generate a short human-friendly room code
  const generateRoomId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  // HOST: create a room
  const createRoom = useCallback(async () => {
    if (!user?.email || !isFirebaseAvailable()) {
      setError('Firebase not configured — invite system unavailable in local mode.');
      return null;
    }
    setStatus('creating');
    const id = generateRoomId();
    const inviteData: GameInvite = {
      roomId:     id,
      hostEmail:  user.email,
      guestEmail: null,
      gameType,
      status:     'open',
      createdAt:  Date.now(),
    };
    try {
      await set(ref(database, `invites/${id}`), inviteData);
      setRoomId(id);
      setInvite(inviteData);
      setStatus('waiting');
      return id;
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
      return null;
    }
  }, [user, gameType]);

  // GUEST: join a room by code
  const joinRoom = useCallback(async (code: string) => {
    if (!user?.email || !isFirebaseAvailable()) {
      setError('Firebase not configured.');
      return false;
    }
    const upperCode = code.toUpperCase().trim();
    try {
      const inviteRef = ref(database, `invites/${upperCode}`);
      // Read once via a promise
      const snap = await new Promise<any>((resolve, reject) => {
        onValue(inviteRef, resolve, reject, { onlyOnce: true });
      });
      const data: GameInvite | null = snap.val();
      if (!data) { setError('Room not found.'); return false; }
      if (data.status !== 'open') { setError('Room is no longer open.'); return false; }
      if (data.gameType !== gameType) { setError(`This invite is for ${data.gameType}, not ${gameType}.`); return false; }

      await set(inviteRef, { ...data, guestEmail: user.email, status: 'accepted' });
      setRoomId(upperCode);
      setInvite({ ...data, guestEmail: user.email, status: 'accepted' });
      setStatus('joined');
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
      if (data?.status === 'accepted' && data.guestEmail) {
        setInvite(data);
        setStatus('joined');
      }
    });
    return () => off(inviteRef);
  }, [roomId, status]);

  // Cancel room (host)
  const cancelRoom = useCallback(async () => {
    if (!roomId || !isFirebaseAvailable()) return;
    try {
      await remove(ref(database, `invites/${roomId}`));
    } catch {}
    setRoomId(null);
    setInvite(null);
    setStatus('idle');
  }, [roomId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomId && isFirebaseAvailable()) {
        remove(ref(database, `invites/${roomId}`)).catch(() => {});
      }
    };
  }, [roomId]);

  return { status, roomId, invite, error, createRoom, joinRoom, cancelRoom };
};
