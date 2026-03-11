import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, set, get, off, update } from 'firebase/database';
import { database } from '../../lib/firebase';

export const sanitizeFirebasePath = (raw: string): string =>
  raw
    .replace(/\./g, '_')
    .replace(/#/g, '_')
    .replace(/\$/g, '_')
    .replace(/\[/g, '_')
    .replace(/\]/g, '_')
    .replace(/@/g, '_at_')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '') || 'session';

const normalizeFirebaseData = (data: any): any => {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(normalizeFirebaseData);
  const keys = Object.keys(data);
  if (keys.length === 0) return data;
  const isArrayLike = keys.every(k => /^\d+$/.test(k));
  if (isArrayLike) {
    const maxIndex = Math.max(...keys.map(Number));
    const arr: any[] = [];
    for (let i = 0; i <= maxIndex; i++) {
      arr.push(i in data ? normalizeFirebaseData(data[i]) : null);
    }
    return arr;
  }
  const normalized: any = {};
  for (const key of keys) normalized[key] = normalizeFirebaseData(data[key]);
  return normalized;
};

const isFirebaseConfigured = (): boolean => {
  try {
    const dbUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL;
    return !!(dbUrl && dbUrl.length > 10 && database);
  } catch {
    return false;
  }
};

export const useRealtimeGame = <T>(
  sessionId: string,
  gameType: string,
  initialState: T
) => {
  const [gameState, setGameState] = useState<T | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string>('');
  const localState      = useRef<T>(initialState);
  const firebaseEnabled = useRef(isFirebaseConfigured());

  const safePath = `games/${sanitizeFirebasePath(sessionId)}`;

  useEffect(() => {
    if (!firebaseEnabled.current) {
      setGameState(initialState);
      localState.current = initialState;
      setLoading(false);
      return;
    }

    setLoading(true);
    const gameRef = ref(database, safePath);

    // Only write initialState if the room doesn't exist yet
    get(gameRef).then(snapshot => {
      if (!snapshot.exists()) {
        return set(gameRef, initialState);
      }
    }).catch(err => {
      console.warn('[useRealtimeGame] init failed:', err.message);
    });

    const unsubscribe = onValue(
      gameRef,
      (snapshot) => {
        const raw        = snapshot.val();
        const normalized = normalizeFirebaseData(raw) ?? initialState;
        setGameState(normalized as T);
        localState.current = normalized as T;
        setLoading(false);
        setError('');
      },
      (err) => {
        console.warn('[useRealtimeGame] read error:', err.message);
        firebaseEnabled.current = false;
        setGameState(localState.current);
        setLoading(false);
      }
    );

    return () => { off(gameRef); };
  }, [safePath]);

  const updateGameState = useCallback(
    async (newState: T) => {
      setGameState(newState);
      localState.current = newState;
      if (!firebaseEnabled.current || !database) return;
      try {
        const gameRef = ref(database, safePath);
        await set(gameRef, newState);
      } catch (err: any) {
        console.warn('[useRealtimeGame] write failed:', err.message);
      }
    },
    [safePath]
  );

  // Patch lets you update only specific fields without overwriting the whole state
  const patchGameState = useCallback(
    async (patch: Partial<T>) => {
      if (!firebaseEnabled.current || !database) {
        const merged = { ...localState.current, ...patch };
        setGameState(merged);
        localState.current = merged;
        return;
      }
      try {
        const gameRef = ref(database, safePath);
        await update(gameRef, patch as any);
      } catch (err: any) {
        console.warn('[useRealtimeGame] patch failed:', err.message);
      }
    },
    [safePath]
  );

  const exposedState = gameState ?? initialState;
  return { gameState: exposedState, updateGameState, patchGameState, loading, error };
};
