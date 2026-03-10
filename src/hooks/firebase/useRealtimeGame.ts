import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, set, off } from 'firebase/database';
import { database } from '../../lib/firebase';

// Firebase stores arrays as objects {0: val, 1: val} — convert back to arrays
const normalizeFirebaseData = (data: any): any => {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(normalizeFirebaseData);
  const keys = Object.keys(data);
  const isArrayLike = keys.length > 0 && keys.every(k => !isNaN(Number(k)));
  if (isArrayLike) {
    const arr: any[] = [];
    for (let i = 0; i < keys.length; i++) arr.push(normalizeFirebaseData(data[i]));
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const localState = useRef<T>(initialState);
  const firebaseEnabled = useRef(isFirebaseConfigured());

  useEffect(() => {
    // If Firebase not configured, just use local state — no crash
    if (!firebaseEnabled.current) {
      setGameState(initialState);
      localState.current = initialState;
      setLoading(false);
      return;
    }

    setLoading(true);
    const gameRef = ref(database, `games/${sessionId}`);

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
        const raw = snapshot.val();
        const normalized = normalizeFirebaseData(raw) || initialState;
        setGameState(normalized);
        localState.current = normalized;
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
  }, [sessionId]);

  const updateGameState = useCallback(
    async (newState: T) => {
      // Always update local state immediately
      setGameState(newState);
      localState.current = newState;

      // Try Firebase if configured
      if (!firebaseEnabled.current || !database) return;
      try {
        const gameRef = ref(database, `games/${sessionId}`);
        await set(gameRef, newState);
      } catch (err: any) {
        console.warn('Firebase write failed, continuing with local state:', err.message);
      }
    },
    [sessionId]
  );

  return { gameState, updateGameState, loading, error };
};
