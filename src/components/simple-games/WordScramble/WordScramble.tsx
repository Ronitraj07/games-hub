import React, { useState, useEffect } from 'react';
import { useRealtimeGame } from '../../../hooks/firebase/useRealtimeGame';
import { useAuth } from '../../../hooks/shared/useAuth';

// TODO: Implement full Word Scramble game logic
// Features to implement:
// - Random word scrambling
// - Timer for each round
// - Score tracking
// - Multiplayer real-time competition

interface WordScrambleProps {
  sessionId: string;
}

export const WordScramble: React.FC<WordScrambleProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const { gameData, updateGameState } = useRealtimeGame(sessionId);
  const [guess, setGuess] = useState('');
  const [score, setScore] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-purple-600">
          Word Scramble
        </h1>
        
        <div className="text-center mb-6">
          <p className="text-gray-600 text-lg">
            🚧 Game under construction! Coming soon...
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">Planned Features:</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• Scrambled word challenges</li>
            <li>• 30-second timer per word</li>
            <li>• Points based on speed</li>
            <li>• Best of 10 rounds</li>
            <li>• Difficulty levels (Easy/Medium/Hard)</li>
            <li>• Real-time score comparison</li>
          </ul>
        </div>

        <div className="text-center text-gray-500">
          <p>Session ID: {sessionId}</p>
          <p>Player: {user?.email}</p>
        </div>
      </div>
    </div>
  );
};
