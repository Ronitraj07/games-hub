import React, { useState, useEffect, useRef } from 'react';
import { useRealtimeGame } from '../../../hooks/firebase/useRealtimeGame';
import { useAuth } from '../../../hooks/shared/useAuth';

// TODO: Implement full Pictionary game logic
// Features to implement:
// - HTML5 Canvas for drawing
// - Drawing tools (pencil, eraser, colors)
// - Real-time canvas sync
// - Word prompts
// - Guessing mechanism
// - Timer per round

interface PictionaryProps {
  sessionId: string;
}

export const Pictionary: React.FC<PictionaryProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const { gameData, updateGameState } = useRealtimeGame(sessionId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [guess, setGuess] = useState('');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-500 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-indigo-600">
          Pictionary
        </h1>
        
        <div className="text-center mb-6">
          <p className="text-gray-600 text-lg">
            🚧 Game under construction! Coming soon...
          </p>
        </div>

        <div className="bg-indigo-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-indigo-700">Planned Features:</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• HTML5 Canvas drawing board</li>
            <li>• Drawing tools: pencil, eraser, colors, brush sizes</li>
            <li>• Real-time canvas synchronization</li>
            <li>• Word prompts from various categories</li>
            <li>• 60-second drawing timer</li>
            <li>• Chat-based guessing</li>
            <li>• Turn-based: drawer and guesser swap</li>
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
