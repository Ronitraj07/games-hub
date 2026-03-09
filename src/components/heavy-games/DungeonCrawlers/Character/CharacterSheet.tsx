import React from 'react';
import { CharacterStats } from './CharacterStats';

interface CharacterSheetProps {
  character: any;
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ character }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border-2 border-purple-500">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-bold text-purple-400">{character.name}</h2>
          <p className="text-gray-400 capitalize">Level {character.level} {character.class}</p>
        </div>
        <div className="text-right">
          <p className="text-yellow-400 text-xl font-bold">{character.gold} Gold</p>
        </div>
      </div>

      <CharacterStats character={character} />

      <div className="mt-6 bg-gray-700 rounded-lg p-4">
        <p className="text-center text-gray-400">
          🚧 Character skills and equipment display coming soon!
        </p>
      </div>
    </div>
  );
};
