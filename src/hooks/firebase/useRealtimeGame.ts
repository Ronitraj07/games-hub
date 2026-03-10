import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, set, off } from 'firebase/database';
import { database } from '../../lib/firebase';

// Firebase paths cannot contain . # $ [ ]
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

/**
 * Firebase stores JS arrays as objects {"0": val, "1": val, ...}.
 * Crucially, it OMITS null/undefined slots entirely, so a board like
 * [null, 'X', null] becomes {"1": "X"} — and the naive isArrayLike
 * reconstruction skips the null slots, leaving undefined at index 0 & 2.
 *
 * Fix: detect array-like objects by checking if ALL keys are numeric,
 * then rebuild the array up to (maxKey + 1) filling missing slots with null.
 */
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
      // Fill missing numeric slots (Firebase-omitted nulls) back with null
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
  const [gameState, setGameState] = useState<T>(initialState);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string>('');
  const localState       = useRef<T>(initialState);
  const firebaseEnabled  = useRef(isFirebaseConfigured());

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

    set(gameRef, initialState).catch(err => {
      console.warn('Firebase init failed, using local state:', err.message);
      firebaseEnabled.current = false;
      setGameState(initialState);
      localState.current = initialState;
      setLoading(false);
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
        console.warn('Firebase read failed, using local state:', err.message);
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
        console.warn('Firebase write failed, continuing with local state:', err.message);
      }
    },
    [safePath]
  );

  return { gameState, updateGameState, loading, error };
};
