import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, set, get, off } from 'firebase/database';
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
 * It OMITS null/undefined slots entirely, so a board like
 * [null, 'X', null] becomes {"1": "X"}.
 * Rebuild the array filling missing slots with null.
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
  const initialized     = useRef(false);

  const safePath = `games/${sanitizeFirebasePath(sessionId)}`;

  useEffect(() => {
    initialized.current = false;

    if (!firebaseEnabled.current) {
      setGameState(initialState);
      localState.current = initialState;
      setLoading(false);
      return;
    }

    setLoading(true);
    const gameRef = ref(database, safePath);

    // ✨ KEY FIX: Only write initialState if the room does NOT exist yet.
    // This prevents any player's page load/re-render from wiping the shared state.
    get(gameRef).then(snapshot => {
      if (!snapshot.exists()) {
        // Room is brand new — write initial state once
        return set(gameRef, initialState);
      }
      // Room already exists — do NOT overwrite, just subscribe below
    }).catch(err => {
      console.warn('[useRealtimeGame] init get/set failed:', err.message);
    });

    // Subscribe to live updates
    const unsubscribe = onValue(
      gameRef,
      (snapshot) => {
        const raw        = snapshot.val();
        const normalized = normalizeFirebaseData(raw) ?? initialState;
        setGameState(normalized as T);
        localState.current = normalized as T;
        setLoading(false);
        setError('');
        initialized.current = true;
      },
      (err) => {
        console.warn('[useRealtimeGame] read error, falling back to local:', err.message);
        firebaseEnabled.current = false;
        setGameState(localState.current);
        setLoading(false);
      }
    );

    return () => { off(gameRef); };
  }, [safePath]);

  const updateGameState = useCallback(
    async (newState: T) => {
      // Always update local state immediately for snappy UI
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

  // Expose gameState as initialState until Firebase responds (avoids null flicker)
  const exposedState = gameState ?? initialState;

  return { gameState: exposedState, updateGameState, loading, error };
};
