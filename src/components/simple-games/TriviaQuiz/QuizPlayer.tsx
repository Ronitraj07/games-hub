import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/shared/useAuth';
import { CustomQuiz } from './TriviaQuiz';
import { Trophy, Clock, ArrowLeft, Target } from 'lucide-react';

interface QuizPlayerProps {
  quiz: CustomQuiz;
  sessionId?: string;
  onBack: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ quiz, sessionId, onBack }) => {
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];

  // Timer
  useEffect(() => {
    if (showAnswer || isFinished) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showAnswer, isFinished, currentQuestionIndex]);

  const handleTimeout = () => {
    setShowAnswer(true);
    setTimeout(() => nextQuestion(false), 3000);
  };

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null || showAnswer) return;

    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(score + 10);
    }
    
    setAnswers([...answers, isCorrect]);
    setShowAnswer(true);

    setTimeout(() => nextQuestion(isCorrect), 3000);
  };

  const nextQuestion = (wasCorrect: boolean) => {
    if (currentQuestionIndex + 1 >= quiz.questions.length) {
      setIsFinished(true);
      return;
    }

    setCurrentQuestionIndex(currentQuestionIndex + 1);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setTimeRemaining(20);
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz Complete!</h2>
            
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-6 space-y-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Final Score</p>
                <p className="text-5xl font-bold text-indigo-700 dark:text-indigo-300">{score}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  out of {quiz.questions.length * 10} points
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Correct Answers</p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {answers.filter(Boolean).length}/{answers.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Accuracy: {((answers.filter(Boolean).length / answers.length) * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="bg-pink-50 dark:bg-pink-900/20 border-l-4 border-pink-500 p-4 rounded text-left">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">💕 Message from {quiz.createdBy}:</span>
                <br />
                Thank you for playing my quiz! I hope you enjoyed it!
              </p>
            </div>

            <button
              onClick={onBack}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-lg transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-3xl w-full">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">By {quiz.createdBy}</p>
        </div>

        {/* Progress */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-gray-900 dark:text-white">
                Question {currentQuestionIndex + 1}/{quiz.questions.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-gray-900 dark:text-white">Score: {score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${timeRemaining <= 5 ? 'text-red-600' : 'text-gray-600'}`} />
              <span className={`font-semibold ${timeRemaining <= 5 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                {timeRemaining}s
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-6 text-center mb-6">
          <p className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentQuestion.question}
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correctAnswer;
            const showResult = showAnswer;

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null || showResult}
                className={`p-4 rounded-lg border-2 text-left transition-all font-semibold ${
                  showResult && isCorrect
                    ? 'border-green-500 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : showResult && isSelected && !isCorrect
                    ? 'border-red-500 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    : isSelected
                    ? 'border-indigo-600 bg-indigo-100 dark:bg-indigo-900/30'
                    : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                } disabled:cursor-not-allowed`}
              >
                <span className="text-gray-900 dark:text-white">
                  {String.fromCharCode(65 + index)}. {option}
                </span>
                {showResult && isCorrect && <span className="ml-2">✓</span>}
                {showResult && isSelected && !isCorrect && <span className="ml-2">✗</span>}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showAnswer && currentQuestion.explanation && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">💡 </span>
              {currentQuestion.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};