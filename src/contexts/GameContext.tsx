import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface GameContextType {
  // Add game-related context here if needed
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const value: GameContextType = {
    // Add game context values here
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};