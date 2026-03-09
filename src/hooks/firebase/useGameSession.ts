import { useState, useEffect } from 'react';
import { ref, onValue, off, update } from 'firebase/database';
import { database } from '../../lib/firebase';

interface SessionPlayer {
  player1: string;
  player2: string;
}

interface GameSessionData {
  gameType: string;
  players: SessionPlayer;
  gameState: any;
  createdAt: number;
  lastMove: number;
}

export const useGameSession = (sessionId: string | null) => {
  const [session, setSession] = useState<GameSessionData | null>(null);
  const [players, setPlayers] = useState<SessionPlayer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const sessionRef = ref(database, `sessions/${sessionId}`);

    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSession(data);
        setPlayers(data.players);
      }
      setLoading(false);
    });

    return () => {
      off(sessionRef);
    };
  }, [sessionId]);

  const updateSession = async (updates: Partial<GameSessionData>) => {
    if (!sessionId) return;

    const sessionRef = ref(database, `sessions/${sessionId}`);
    await update(sessionRef, {
      ...updates,
      lastMove: Date.now(),
    });
  };

  return {
    session,
    players,
    loading,
    updateSession,
  };
};
