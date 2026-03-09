import React, { useState } from 'react';
import { ArenaView } from './Arena/ArenaView';
import { MatchmakingLobby } from './Matchmaking/MatchmakingLobby';
import { useCharacter } from '@/hooks/supabase/useCharacter';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export type BattlePhase = 'matchmaking' | 'character-select' | 'battle' | 'results';

export const BattleArena: React.FC = () => {
  const [phase, setPhase] = useState<BattlePhase>('matchmaking');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const { characters, loading } = useCharacter();

  const handleMatchFound = (characterId: string) => {
    setSelectedCharacterId(characterId);
    setPhase('battle');
  };

  const handleBattleEnd = () => {
    setPhase('results');
  };

  const handleReturnToLobby = () => {
    setPhase('matchmaking');
    setSelectedCharacterId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {phase === 'matchmaking' && (
        <MatchmakingLobby
          characters={characters}
          onMatchFound={handleMatchFound}
        />
      )}

      {phase === 'battle' && selectedCharacterId && (
        <ArenaView
          characterId={selectedCharacterId}
          onBattleEnd={handleBattleEnd}
        />
      )}

      {phase === 'results' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h2 className="text-3xl font-bold mb-4">Battle Complete!</h2>
          <button
            onClick={handleReturnToLobby}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Return to Lobby
          </button>
        </div>
      )}
    </div>
  );
};