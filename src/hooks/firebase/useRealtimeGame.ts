import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, update, remove, off } from 'firebase/database';
import { database } from '../../lib/firebase';

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
      return;
    }

    const gameRef = ref(database, `games/${sessionId}`);

    // Initialize game if doesn't exist
    set(gameRef, initialState).catch(err => {
      console.error('Failed to initialize game:', err);
      setError(err.message);
    });

    const unsubscribe = onValue(
      gameRef,
      (snapshot) => {
        const data = snapshot.val();
        setGameState(data || initialState);
        setLoading(false);
        setError('');
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        console.error('Firebase read error:', err);
      }
    );

    return () => {
      off(gameRef);
    };
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

  const endGame = useCallback(async () => {
    if (!sessionId || !database) return;

    try {
      const gameRef = ref(database, `games/${sessionId}`);
      await remove(gameRef);
    } catch (err: any) {
      console.error('Failed to end game:', err);
      throw err;
    }
  }, [sessionId]);

  return {
    gameState,
    updateGameState,
    endGame,
    loading,
    error,
  };
};
