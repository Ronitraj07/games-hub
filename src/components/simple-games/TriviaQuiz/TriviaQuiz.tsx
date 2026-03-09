import React, { useState, useEffect } from 'react';
import { useRealtimeGame } from '../../../hooks/firebase/useRealtimeGame';
import { useAuth } from '../../../hooks/shared/useAuth';

// TODO: Implement full Trivia Quiz game logic
// Features to implement:
// - Question database (various categories)
// - Multiple choice answers
// - Timer per question
// - Real-time score tracking
// - Category selection

interface TriviaQuizProps {
  sessionId: string;
}

export const TriviaQuiz: React.FC<TriviaQuizProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const { gameData, updateGameState } = useRealtimeGame(sessionId);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-500 to-teal-500 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-green-600">
          Trivia Quiz
        </h1>
        
        <div className="text-center mb-6">
          <p className="text-gray-600 text-lg">
            🚧 Game under construction! Coming soon...
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-green-700">Planned Features:</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• 10 questions per game</li>
            <li>• Multiple categories (Science, History, Pop Culture, etc.)</li>
            <li>• 4 multiple choice options</li>
            <li>• 15 seconds per question</li>
            <li>• Points based on speed and accuracy</li>
            <li>• Head-to-head competition</li>
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
