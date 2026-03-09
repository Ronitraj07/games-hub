import React, { useState, useEffect } from 'react';
import { useRealtimeGame } from '../../../hooks/firebase/useRealtimeGame';
import { useAuth } from '../../../hooks/shared/useAuth';

// TODO: Implement full Memory Match game logic
// Features to implement:
// - Card grid (4x4 or 6x6)
// - Card flipping animations
// - Match detection
// - Turn-based multiplayer
// - Score tracking (matched pairs)

interface MemoryMatchProps {
  sessionId: string;
}

export const MemoryMatch: React.FC<MemoryMatchProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const { gameData, updateGameState } = useRealtimeGame(sessionId);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-cyan-500 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-3xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-600">
          Memory Match
        </h1>
        
        <div className="text-center mb-6">
          <p className="text-gray-600 text-lg">
            🚧 Game under construction! Coming soon...
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Planned Features:</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• 4x4 or 6x6 card grid</li>
            <li>• Beautiful card flip animations</li>
            <li>• Emoji/icon themed cards</li>
            <li>• Turn-based gameplay</li>
            <li>• Score: number of matched pairs</li>
            <li>• Timer to track completion time</li>
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
