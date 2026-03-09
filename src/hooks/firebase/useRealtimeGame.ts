import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, update, remove, off } from 'firebase/database';
import { database } from '../../lib/firebase';
import { nanoid } from 'nanoid';

interface GameSession {
  gameType: string;
  players: {
    player1: string;
    player2: string;
  };
  gameState: any;
  createdAt: number;
  lastMove: number;
}

export const useRealtimeGame = (sessionId: string | null) => {
  const [gameData, setGameData] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const gameRef = ref(database, `sessions/${sessionId}`);

    const unsubscribe = onValue(
      gameRef,
      (snapshot) => {
        const data = snapshot.val();
        setGameData(data);
        setLoading(false);
        setError(null);
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
    async (newState: any) => {
      if (!sessionId) return;

      try {
        const gameRef = ref(database, `sessions/${sessionId}`);
        await update(gameRef, {
          gameState: newState,
          lastMove: Date.now(),
        });
      } catch (err) {
        console.error('Failed to update game state:', err);
        throw err;
      }
    },
    [sessionId]
  );

  const endGame = useCallback(async () => {
    if (!sessionId) return;

    try {
      const gameRef = ref(database, `sessions/${sessionId}`);
      await remove(gameRef);
    } catch (err) {
      console.error('Failed to end game:', err);
      throw err;
    }
  }, [sessionId]);

  return {
    gameData,
    loading,
    error,
    updateGameState,
    endGame,
  };
};

export const createGameSession = async (
  gameType: string,
  player1Email: string,
  player2Email: string,
  initialGameState: any
): Promise<string> => {
  const sessionId = nanoid();
  const sessionRef = ref(database, `sessions/${sessionId}`);

  const session: GameSession = {
    gameType,
    players: {
      player1: player1Email,
      player2: player2Email,
    },
    gameState: initialGameState,
    createdAt: Date.now(),
    lastMove: Date.now(),
  };

  await set(sessionRef, session);
  return sessionId;
};
