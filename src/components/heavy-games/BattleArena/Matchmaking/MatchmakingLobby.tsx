import React, { useState } from 'react';
import { Swords, Users, Trophy } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
}

interface MatchmakingLobbyProps {
  characters: Character[];
  onMatchFound: (characterId: string) => void;
}

export const MatchmakingLobby: React.FC<MatchmakingLobbyProps> = ({ characters, onMatchFound }) => {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const handleStartSearch = () => {
    if (!selectedCharacter) return;
    
    setSearching(true);
    
    // Simulate matchmaking (in production, this would be real matchmaking)
    setTimeout(() => {
      setSearching(false);
      onMatchFound(selectedCharacter);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-full mb-4">
            <Swords className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Battle Arena</h1>
          <p className="text-gray-600 dark:text-gray-400">Challenge your opponent in real-time PvP combat</p>
        </div>

        {/* Character Selection */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Select Your Character</h2>
          
          {characters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No characters found</p>
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                Create Character
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => setSelectedCharacter(character.id)}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${selectedCharacter === character.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-700 hover:border-blue-400'
                    }
                  `}
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{character.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{character.class}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Level {character.level}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Matchmaking Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">2</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Players Online</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 text-center">
            <Swords className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Battles</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Your Rank</p>
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center">
          {searching ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Searching for opponent...</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">This may take a moment</p>
            </div>
          ) : (
            <button
              onClick={handleStartSearch}
              disabled={!selectedCharacter}
              className="px-12 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-lg transition-all hover:scale-105"
            >
              {selectedCharacter ? 'Start Matchmaking' : 'Select a Character First'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};