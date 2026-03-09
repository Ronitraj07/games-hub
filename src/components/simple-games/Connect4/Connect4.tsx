import React, { useState, useEffect } from 'react';
import { useRealtimeGame } from '../../../hooks/firebase/useRealtimeGame';
import { useAuth } from '../../../hooks/shared/useAuth';

// TODO: Implement full Connect 4 game logic
// Features to implement:
// - 7x6 game board
// - Gravity physics for dropping pieces
// - Win detection (4 in a row: horizontal, vertical, diagonal)
// - Animated piece dropping
// - Turn-based multiplayer

interface Connect4Props {
  sessionId: string;
}

export const Connect4: React.FC<Connect4Props> = ({ sessionId }) => {
  const { user } = useAuth();
  const { gameData, updateGameState } = useRealtimeGame(sessionId);
  const [board, setBoard] = useState<Array<Array<string | null>>>(Array(6).fill(null).map(() => Array(7).fill(null)));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-yellow-500 to-orange-500 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-3xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-yellow-600">
          Connect 4
        </h1>
        
        <div className="text-center mb-6">
          <p className="text-gray-600 text-lg">
            🚧 Game under construction! Coming soon...
          </p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-700">Planned Features:</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• Classic 7x6 grid board</li>
            <li>• Smooth piece dropping animation</li>
            <li>• Win detection (4 in a row)</li>
            <li>• Red vs Yellow discs</li>
            <li>• Turn indicator</li>
            <li>• Real-time multiplayer</li>
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
