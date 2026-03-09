import React from 'react';

interface CharacterStatsProps {
  character: any;
}

export const CharacterStats: React.FC<CharacterStatsProps> = ({ character }) => {
  const calculatePercentage = (current: number, max: number) => (current / max) * 100;

  return (
    <div className="space-y-4">
      {/* Health Bar */}
      <div>
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Health</span>
          <span>{character.health} / {character.max_health}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-red-500 h-full transition-all"
            style={{ width: `${calculatePercentage(character.health, character.max_health)}%` }}
          />
        </div>
      </div>

      {/* Mana Bar */}
      <div>
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Mana</span>
          <span>{character.mana} / {character.max_mana}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all"
            style={{ width: `${calculatePercentage(character.mana, character.max_mana)}%` }}
          />
        </div>
      </div>

      {/* Stamina Bar */}
      <div>
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Stamina</span>
          <span>{character.stamina} / {character.max_stamina}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-green-500 h-full transition-all"
            style={{ width: `${calculatePercentage(character.stamina, character.max_stamina)}%` }}
          />
        </div>
      </div>

      {/* Experience Bar */}
      <div>
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Experience</span>
          <span>{character.experience} / {character.level * 100}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-purple-500 h-full transition-all"
            style={{ width: `${calculatePercentage(character.experience, character.level * 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4 mt-6">
        <div className="bg-gray-700 p-3 rounded text-center">
          <p className="text-2xl font-bold text-red-400">{character.stats.strength}</p>
          <p className="text-xs text-gray-400">Strength</p>
        </div>
        <div className="bg-gray-700 p-3 rounded text-center">
          <p className="text-2xl font-bold text-green-400">{character.stats.dexterity}</p>
          <p className="text-xs text-gray-400">Dexterity</p>
        </div>
        <div className="bg-gray-700 p-3 rounded text-center">
          <p className="text-2xl font-bold text-blue-400">{character.stats.intelligence}</p>
          <p className="text-xs text-gray-400">Intelligence</p>
        </div>
        <div className="bg-gray-700 p-3 rounded text-center">
          <p className="text-2xl font-bold text-yellow-400">{character.stats.vitality}</p>
          <p className="text-xs text-gray-400">Vitality</p>
        </div>
        <div className="bg-gray-700 p-3 rounded text-center">
          <p className="text-2xl font-bold text-purple-400">{character.stats.luck}</p>
          <p className="text-xs text-gray-400">Luck</p>
        </div>
      </div>
    </div>
  );
};
