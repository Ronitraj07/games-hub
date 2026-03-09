import React, { useState } from 'react';
import { CharacterCreation } from './Character/CharacterCreation';
import { CharacterSheet } from './Character/CharacterSheet';
import { CombatArena } from './Combat/CombatArena';
import { InventoryGrid } from './Inventory/InventoryGrid';
import { DungeonMap } from './Dungeon/DungeonMap';
import { useCharacter } from '../../../hooks/supabase/useCharacter';

// TODO: Complete Dungeon Crawlers implementation
// Main RPG game with character progression, inventory, and dungeon exploration

export const DungeonCrawlers: React.FC = () => {
  const { characters, activeCharacter, loading } = useCharacter();
  const [currentView, setCurrentView] = useState<'character' | 'dungeon' | 'inventory' | 'combat'>('character');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!activeCharacter) {
    return <CharacterCreation />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-purple-500 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-purple-400">Dungeon Crawlers</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentView('character')}
              className={`px-4 py-2 rounded ${
                currentView === 'character' ? 'bg-purple-600' : 'bg-gray-700'
              } text-white hover:bg-purple-500`}
            >
              Character
            </button>
            <button
              onClick={() => setCurrentView('dungeon')}
              className={`px-4 py-2 rounded ${
                currentView === 'dungeon' ? 'bg-purple-600' : 'bg-gray-700'
              } text-white hover:bg-purple-500`}
            >
              Dungeon
            </button>
            <button
              onClick={() => setCurrentView('inventory')}
              className={`px-4 py-2 rounded ${
                currentView === 'inventory' ? 'bg-purple-600' : 'bg-gray-700'
              } text-white hover:bg-purple-500`}
            >
              Inventory
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {currentView === 'character' && <CharacterSheet character={activeCharacter} />}
        {currentView === 'dungeon' && <DungeonMap />}
        {currentView === 'inventory' && <InventoryGrid characterId={activeCharacter.id} />}
        {currentView === 'combat' && <CombatArena />}
      </div>

      {/* Under Construction Banner */}
      <div className="fixed bottom-4 right-4 bg-yellow-500 text-black px-6 py-3 rounded-lg shadow-lg">
        <p className="font-bold">🚧 Under Construction</p>
        <p className="text-sm">Full RPG system coming soon!</p>
      </div>
    </div>
  );
};
