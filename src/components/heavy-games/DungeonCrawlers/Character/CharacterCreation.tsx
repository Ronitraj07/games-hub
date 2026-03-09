import React, { useState } from 'react';
import { useCharacter } from '../../../../hooks/supabase/useCharacter';

export const CharacterCreation: React.FC = () => {
  const { createCharacter } = useCharacter();
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<'warrior' | 'mage' | 'rogue' | 'archer'>('warrior');
  const [loading, setLoading] = useState(false);

  const classes = [
    {
      name: 'warrior',
      title: 'Warrior',
      description: 'Strong melee fighter with high health',
      icon: '⚔️',
      stats: { STR: 15, DEX: 8, INT: 5, VIT: 12, LUCK: 5 },
    },
    {
      name: 'mage',
      title: 'Mage',
      description: 'Powerful spellcaster with high mana',
      icon: '🧙',
      stats: { STR: 5, DEX: 7, INT: 15, VIT: 8, LUCK: 10 },
    },
    {
      name: 'rogue',
      title: 'Rogue',
      description: 'Agile assassin with high critical chance',
      icon: '🔪',
      stats: { STR: 8, DEX: 15, INT: 7, VIT: 8, LUCK: 12 },
    },
    {
      name: 'archer',
      title: 'Archer',
      description: 'Ranged damage dealer with precision',
      icon: '🏹',
      stats: { STR: 7, DEX: 13, INT: 8, VIT: 9, LUCK: 8 },
    },
  ];

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please enter a character name');
      return;
    }

    setLoading(true);
    try {
      await createCharacter({ name: name.trim(), class: selectedClass });
    } catch (error) {
      console.error('Failed to create character:', error);
      alert('Failed to create character');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8 max-w-4xl w-full border-2 border-purple-500">
        <h1 className="text-4xl font-bold text-center mb-8 text-purple-400">
          Create Your Hero
        </h1>

        {/* Name Input */}
        <div className="mb-8">
          <label className="block text-purple-300 text-lg mb-2">Character Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border-2 border-purple-500 focus:outline-none focus:border-purple-400"
            placeholder="Enter your character name..."
          />
        </div>

        {/* Class Selection */}
        <div className="mb-8">
          <label className="block text-purple-300 text-lg mb-4">Choose Your Class</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((cls) => (
              <button
                key={cls.name}
                onClick={() => setSelectedClass(cls.name as any)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedClass === cls.name
                    ? 'bg-purple-600 border-purple-400 scale-105'
                    : 'bg-gray-700 border-gray-600 hover:border-purple-500'
                }`}
              >
                <div className="text-5xl mb-2">{cls.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-2">{cls.title}</h3>
                <p className="text-gray-300 text-sm mb-4">{cls.description}</p>
                <div className="flex justify-around text-xs text-purple-300">
                  <div>STR: {cls.stats.STR}</div>
                  <div>DEX: {cls.stats.DEX}</div>
                  <div>INT: {cls.stats.INT}</div>
                  <div>VIT: {cls.stats.VIT}</div>
                  <div>LUCK: {cls.stats.LUCK}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={loading || !name.trim()}
          className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white text-xl font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Creating...' : 'Begin Your Adventure'}
        </button>
      </div>
    </div>
  );
};
