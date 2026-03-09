import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/shared/useAuth';

interface GameContextType {
  currentGame: string | null;
  sessionId: string | null;
  isInGame: boolean;
  startGame: (gameType: string, sessionId: string) => void;
  endGame: () => void;
  opponent: string | null;
  setOpponent: (email: string | null) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [isInGame, setIsInGame] = useState(false);

  const startGame = (gameType: string, sessionId: string) => {
    setCurrentGame(gameType);
    setSessionId(sessionId);
    setIsInGame(true);
  };

  const endGame = () => {
    setCurrentGame(null);
    setSessionId(null);
    setOpponent(null);
    setIsInGame(false);
  };

  useEffect(() => {
    // Cleanup on unmount or user logout
    if (!user) {
      endGame();
    }
  }, [user]);

  const value: GameContextType = {
    currentGame,
    sessionId,
    isInGame,
    startGame,
    endGame,
    opponent,
    setOpponent,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
