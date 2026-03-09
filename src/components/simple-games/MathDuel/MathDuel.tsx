import React, { useState, useEffect } from 'react';
import { useRealtimeGame } from '../../../hooks/firebase/useRealtimeGame';
import { useAuth } from '../../../hooks/shared/useAuth';

// TODO: Implement full Math Duel game logic
// Features to implement:
// - Random math problems (addition, subtraction, multiplication, division)
// - Difficulty levels
// - Speed-based scoring
// - Real-time competition
// - Streak bonuses

interface MathDuelProps {
  sessionId: string;
}

export const MathDuel: React.FC<MathDuelProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const { gameData, updateGameState } = useRealtimeGame(sessionId);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-teal-500 to-cyan-500 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-teal-600">
          Math Duel
        </h1>
        
        <div className="text-center mb-6">
          <p className="text-gray-600 text-lg">
            🚧 Game under construction! Coming soon...
          </p>
        </div>

        <div className="bg-teal-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-teal-700">Planned Features:</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• Random math problems (all operations)</li>
            <li>• Three difficulty levels (Easy/Medium/Hard)</li>
            <li>• 10 questions per game</li>
            <li>• Speed bonus for quick answers</li>
            <li>• Streak multipliers</li>
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
