import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, off } from 'firebase/database';
import { database } from '../../lib/firebase';

// Firebase stores arrays as objects {0: val, 1: val} — convert back to arrays
const normalizeFirebaseData = (data: any): any => {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(normalizeFirebaseData);
  // Check if it looks like an array (all keys are numeric)
  const keys = Object.keys(data);
  const isArrayLike = keys.length > 0 && keys.every(k => !isNaN(Number(k)));
  if (isArrayLike) {
    const arr = [];
    for (let i = 0; i < keys.length; i++) {
      arr.push(normalizeFirebaseData(data[i]));
    }
    return arr;
  }
  // Recursively normalize object values
  const normalized: any = {};
  for (const key of keys) {
    normalized[key] = normalizeFirebaseData(data[key]);
  }
  return normalized;
};

export const useRealtimeGame = <T>(
  sessionId: string,
  gameType: string,
  initialState: T
) => {
  const [gameState, setGameState] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!sessionId || !database) {
      setLoading(false);
      setError('Firebase database not configured. Please add VITE_FIREBASE_DATABASE_URL to your environment variables.');
      return;
    }

    const gameRef = ref(database, `games/${sessionId}`);

    set(gameRef, initialState).catch(err => {
      console.error('Failed to initialize game:', err);
      setError(err.message);
    });

    const unsubscribe = onValue(
      gameRef,
      (snapshot) => {
        const raw = snapshot.val();
        const normalized = normalizeFirebaseData(raw) || initialState;
        setGameState(normalized);
        setLoading(false);
        setError('');
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        console.error('Firebase read error:', err);
      }
    );

    return () => { off(gameRef); };
  }, [sessionId]);

  const updateGameState = useCallback(
    async (newState: T) => {
      if (!sessionId || !database) return;
      try {
        const gameRef = ref(database, `games/${sessionId}`);
        await set(gameRef, newState);
      } catch (err: any) {
        console.error('Failed to update game state:', err);
        setError(err.message);
        throw err;
      }
    },
    [sessionId]
  );

  return { gameState, updateGameState, loading, error };
};
