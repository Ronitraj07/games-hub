import React, { useEffect, useState } from 'react';
import { ArenaControls } from './ArenaControls';
import { useCharacter } from '@/hooks/supabase/useCharacter';
import { useCombat } from '@/hooks/supabase/useCombat';

interface ArenaViewProps {
  characterId: string;
  onBattleEnd: () => void;
}

export const ArenaView: React.FC<ArenaViewProps> = ({ characterId, onBattleEnd }) => {
  const { getCharacterById } = useCharacter();
  const { createCombatAction } = useCombat();
  const [character, setCharacter] = useState<any>(null);
  const [opponent, setOpponent] = useState<any>(null);

  useEffect(() => {
    // Load character data
    const loadCharacter = async () => {
      const char = await getCharacterById(characterId);
      setCharacter(char);
      
      // TODO: Load opponent from matchmaking
      // For now, create a mock opponent
      setOpponent({
        id: 'opponent-1',
        name: 'Enemy Warrior',
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50
      });
    };
    
    loadCharacter();
  }, [characterId]);

  const handleAction = async (actionType: 'attack' | 'skill' | 'item' | 'defend', data?: any) => {
    // TODO: Implement combat logic
    console.log('Action:', actionType, data);
    
    // Create combat action in database
    await createCombatAction({
      sessionId: 'current-session-id', // TODO: Get from game session
      characterId,
      actionType,
      targetId: opponent?.id,
      data
    });
  };

  if (!character || !opponent) {
    return <div className="flex items-center justify-center min-h-screen">Loading battle...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Arena Title */}
      <h1 className="text-4xl font-bold text-white mb-8">Battle Arena</h1>

      {/* Battle Area */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Player Character */}
        <div className="bg-blue-900/50 p-6 rounded-xl border-2 border-blue-500">
          <h2 className="text-2xl font-bold text-blue-300 mb-4">{character.name}</h2>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>HP</span>
                <span>{character.health}/{character.maxHealth}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full transition-all"
                  style={{ width: `${(character.health / character.maxHealth) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>MP</span>
                <span>{character.mana}/{character.maxMana}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all"
                  style={{ width: `${(character.mana / character.maxMana) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Opponent */}
        <div className="bg-red-900/50 p-6 rounded-xl border-2 border-red-500">
          <h2 className="text-2xl font-bold text-red-300 mb-4">{opponent.name}</h2>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>HP</span>
                <span>{opponent.health}/{opponent.maxHealth}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full transition-all"
                  style={{ width: `${(opponent.health / opponent.maxHealth) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>MP</span>
                <span>{opponent.mana}/{opponent.maxMana}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all"
                  style={{ width: `${(opponent.mana / opponent.maxMana) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Combat Controls */}
      <ArenaControls
        character={character}
        onAction={handleAction}
      />

      {/* Battle Log */}
      <div className="w-full max-w-6xl mt-8 bg-gray-800/50 p-4 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-300 mb-2">Battle Log</h3>
        <div className="text-sm text-gray-400 space-y-1">
          <p>Battle started!</p>
          {/* TODO: Add battle log messages */}
        </div>
      </div>
    </div>
  );
};