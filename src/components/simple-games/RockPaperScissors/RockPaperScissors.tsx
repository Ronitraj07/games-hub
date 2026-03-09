import React, { useState, useEffect } from 'react';
import { useRealtimeGame } from '../../../hooks/firebase/useRealtimeGame';
import { useAuth } from '../../../hooks/shared/useAuth';

// TODO: Implement full Rock Paper Scissors game logic
// Features to implement:
// - Choice selection (Rock/Paper/Scissors)
// - Simultaneous reveal mechanism
// - Best of 5/7 rounds
// - Score tracking
// - Animated reveal

interface RockPaperScissorsProps {
  sessionId: string;
}

export const RockPaperScissors: React.FC<RockPaperScissorsProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const { gameData, updateGameState } = useRealtimeGame(sessionId);
  const [choice, setChoice] = useState<'rock' | 'paper' | 'scissors' | null>(null);
  const [score, setScore] = useState({ player1: 0, player2: 0 });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-500 to-pink-500 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-red-600">
          Rock Paper Scissors
        </h1>
        
        <div className="text-center mb-6">
          <p className="text-gray-600 text-lg">
            🚧 Game under construction! Coming soon...
          </p>
        </div>

        <div className="bg-red-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-red-700">Planned Features:</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• Classic Rock, Paper, Scissors gameplay</li>
            <li>• Best of 5 or 7 rounds</li>
            <li>• Simultaneous choice submission</li>
            <li>• Animated reveal with emojis</li>
            <li>• Real-time score tracking</li>
            <li>• Round history display</li>
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
