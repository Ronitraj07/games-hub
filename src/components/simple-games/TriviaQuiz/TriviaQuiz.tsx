import React, { useState, useEffect } from 'react';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/hooks/shared/useAuth';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Brain, Trophy, Clock, Plus, Edit2, Play, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  createdBy: string;
  createdFor: string;
  category: string;
}

interface QuestionSet {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  createdBy: string;
  createdFor: string;
  createdAt: string;
}

interface TriviaGameState {
  currentQuestion: number;
  totalQuestions: number;
  players: {
    [email: string]: {
      score: number;
      answers: { questionId: string; correct: boolean; timeSpent: number }[];
    };
  };
  questions: Question[];
  questionSetId: string;
  questionSetName: string;
  status: 'waiting' | 'active' | 'finished';
  timeRemaining: number;
  selectedAnswer: number | null;
  showExplanation: boolean;
}

interface TriviaQuizProps {
  sessionId?: string;
}

const PARTNER_NAMES = {
  'sinharonitraj@gmail.com': 'Sparkles',
  'radhikadidwania567@gmail.com': 'Shizz'
};

const getPartnerEmail = (currentEmail: string): string => {
  return currentEmail === 'sinharonitraj@gmail.com' 
    ? 'radhikadidwania567@gmail.com' 
    : 'sinharonitraj@gmail.com';
};

export const TriviaQuiz: React.FC<TriviaQuizProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'menu' | 'create' | 'select' | 'play'>('menu');
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<QuestionSet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Question creation state
  const [newSetName, setNewSetName] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  const [newQuestions, setNewQuestions] = useState<Question[]>([]);
  const [currentEditQuestion, setCurrentEditQuestion] = useState<Question>({
    id: '',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    createdBy: user?.email || '',
    createdFor: getPartnerEmail(user?.email || ''),
    category: 'Custom'
  });

  const initialState: TriviaGameState = {
    currentQuestion: 0,
    totalQuestions: 10,
    players: {},
    questions: [],
    questionSetId: '',
    questionSetName: '',
    status: 'waiting',
    timeRemaining: 30,
    selectedAnswer: null,
    showExplanation: false
  };

  const { gameState, updateGameState } = useRealtimeGame<TriviaGameState>(
    sessionId || 'trivia-game',
    'trivia',
    initialState
  );

  // Load question sets
  useEffect(() => {
    loadQuestionSets();
  }, [user?.email]);

  const loadQuestionSets = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trivia_question_sets')
        .select('*')
        .or(`created_by.eq.${user.email},created_for.eq.${user.email}`);

      if (error) throw error;
      setQuestionSets(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (!gameState || gameState.status !== 'active' || gameState.showExplanation) return;

    const timer = setInterval(() => {
      if (gameState.timeRemaining > 0) {
        updateGameState({
          ...gameState,
          timeRemaining: gameState.timeRemaining - 1
        });
      } else {
        handleTimeout();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState?.timeRemaining, gameState?.status, gameState?.showExplanation]);

  const handleTimeout = () => {
    if (!gameState) return;
    updateGameState({
      ...gameState,
      showExplanation: true,
      timeRemaining: 0
    });
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!gameState || gameState.showExplanation) return;

    const currentQ = gameState.questions[gameState.currentQuestion];
    const isCorrect = answerIndex === currentQ.correctAnswer;
    const timeSpent = 30 - gameState.timeRemaining;

    const updatedPlayers = { ...gameState.players };
    const playerData = updatedPlayers[user?.email || ''] || { score: 0, answers: [] };

    playerData.answers.push({
      questionId: currentQ.id,
      correct: isCorrect,
      timeSpent
    });

    if (isCorrect) {
      const timeBonus = Math.floor(gameState.timeRemaining / 3);
      playerData.score += 10 + timeBonus;
    }

    updatedPlayers[user?.email || ''] = playerData;

    updateGameState({
      ...gameState,
      selectedAnswer: answerIndex,
      showExplanation: true,
      players: updatedPlayers
    });
  };

  const handleNextQuestion = () => {
    if (!gameState) return;

    if (gameState.currentQuestion + 1 >= gameState.questions.length) {
      updateGameState({
        ...gameState,
        status: 'finished'
      });
    } else {
      updateGameState({
        ...gameState,
        currentQuestion: gameState.currentQuestion + 1,
        timeRemaining: 30,
        selectedAnswer: null,
        showExplanation: false
      });
    }
  };

  const startGame = (set: QuestionSet) => {
    updateGameState({
      ...initialState,
      questions: set.questions,
      questionSetId: set.id,
      questionSetName: set.name,
      totalQuestions: set.questions.length,
      status: 'active',
      players: {
        [user?.email || '']: { score: 0, answers: [] }
      }
    });
    setMode('play');
  };

  const saveQuestionSet = async () => {
    if (!user?.email || !newSetName || newQuestions.length === 0) {
      setError('Please provide a set name and at least one question');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trivia_question_sets')
        .insert({
          name: newSetName,
          description: newSetDescription,
          questions: newQuestions,
          created_by: user.email,
          created_for: getPartnerEmail(user.email)
        })
        .select()
        .single();

      if (error) throw error;

      setNewSetName('');
      setNewSetDescription('');
      setNewQuestions([]);
      setMode('menu');
      await loadQuestionSets();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addQuestionToSet = () => {
    if (!currentEditQuestion.question || currentEditQuestion.options.some(o => !o)) {
      setError('Please fill in all question fields');
      return;
    }

    setNewQuestions([...newQuestions, { ...currentEditQuestion, id: `q${Date.now()}` }]);
    setCurrentEditQuestion({
      id: '',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      createdBy: user?.email || '',
      createdFor: getPartnerEmail(user?.email || ''),
      category: 'Custom'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const currentPlayerScore = gameState?.players[user?.email || '']?.score || 0;
  const partnerName = PARTNER_NAMES[getPartnerEmail(user?.email || '') as keyof typeof PARTNER_NAMES];
  const yourName = PARTNER_NAMES[user?.email as keyof typeof PARTNER_NAMES];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Trivia Quiz</h1>
          <p className="text-gray-600 dark:text-gray-400">Create custom quizzes for each other!</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* Main Menu */}
        {mode === 'menu' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setMode('create')}
                className="p-6 bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                <Plus className="w-8 h-8 mx-auto mb-2" />
                <p className="font-bold text-lg">Create Set</p>
                <p className="text-sm mt-1">Make a quiz for {partnerName}</p>
              </button>
              
              <button
                onClick={() => { setMode('select'); loadQuestionSets(); }}
                className="p-6 bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                <Play className="w-8 h-8 mx-auto mb-2" />
                <p className="font-bold text-lg">Play Quiz</p>
                <p className="text-sm mt-1">Answer their questions</p>
              </button>
              
              <button
                onClick={() => { setMode('select'); loadQuestionSets(); }}
                className="p-6 bg-gradient-to-br from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                <Edit2 className="w-8 h-8 mx-auto mb-2" />
                <p className="font-bold text-lg">My Sets</p>
                <p className="text-sm mt-1">View created quizzes</p>
              </button>
            </div>

            <div className="bg-indigo-50 dark:bg-gray-800 rounded-lg p-6 mt-6">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-3">How It Works:</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                <li>• <strong>{yourName}</strong> creates custom question sets for <strong>{partnerName}</strong></li>
                <li>• <strong>{partnerName}</strong> creates custom question sets for <strong>{yourName}</strong></li>
                <li>• Answer each other's questions and see who knows you better!</li>
                <li>• Questions can be about memories, preferences, inside jokes, etc.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Create Question Set */}
        {mode === 'create' && (
          <div className="space-y-6">
            <button
              onClick={() => setMode('menu')}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Menu
            </button>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Quiz Set Name
                </label>
                <input
                  type="text"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  placeholder="e.g., 'How Well Do You Know Me?'"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-indigo-600 focus:outline-none dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Description (Optional)
                </label>
                <textarea
                  value={newSetDescription}
                  onChange={(e) => setNewSetDescription(e.target.value)}
                  placeholder="e.g., 'Test your knowledge about our relationship!'"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-indigo-600 focus:outline-none dark:bg-gray-800 dark:text-white"
                  rows={2}
                />
              </div>

              <div className="bg-indigo-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="font-semibold mb-4 text-indigo-900 dark:text-indigo-300">Add Question</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Question
                    </label>
                    <input
                      type="text"
                      value={currentEditQuestion.question}
                      onChange={(e) => setCurrentEditQuestion({ ...currentEditQuestion, question: e.target.value })}
                      placeholder="e.g., 'What's my favorite food?'"
                      className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-indigo-600 focus:outline-none dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  {currentEditQuestion.options.map((option, idx) => (
                    <div key={idx}>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        Option {idx + 1} {idx === currentEditQuestion.correctAnswer && '✓ (Correct)'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...currentEditQuestion.options];
                            newOptions[idx] = e.target.value;
                            setCurrentEditQuestion({ ...currentEditQuestion, options: newOptions });
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-indigo-600 focus:outline-none dark:bg-gray-800 dark:text-white"
                        />
                        <button
                          onClick={() => setCurrentEditQuestion({ ...currentEditQuestion, correctAnswer: idx })}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            idx === currentEditQuestion.correctAnswer
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-500 hover:text-white'
                          }`}
                        >
                          ✓
                        </button>
                      </div>
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Explanation (Optional)
                    </label>
                    <textarea
                      value={currentEditQuestion.explanation}
                      onChange={(e) => setCurrentEditQuestion({ ...currentEditQuestion, explanation: e.target.value })}
                      placeholder="e.g., 'We had this on our first date!'"
                      className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-indigo-600 focus:outline-none dark:bg-gray-800 dark:text-white"
                      rows={2}
                    />
                  </div>

                  <button
                    onClick={addQuestionToSet}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Add Question to Set ({newQuestions.length} added)
                  </button>
                </div>
              </div>

              {newQuestions.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-green-900 dark:text-green-300">Questions Added:</h4>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {newQuestions.map((q, idx) => (
                      <li key={idx}>• {q.question}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={saveQuestionSet}
                  disabled={!newSetName || newQuestions.length === 0}
                  className="flex-1 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition-colors"
                >
                  Save Quiz Set for {partnerName}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Select Question Set */}
        {mode === 'select' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('menu')}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Menu
            </button>

            <div className="grid grid-cols-1 gap-4">
              {questionSets.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-lg font-semibold mb-2">No quiz sets yet!</p>
                  <p className="text-sm">Create one for {partnerName} or wait for them to create one for you.</p>
                </div>
              ) : (
                questionSets.map((set) => (
                  <div
                    key={set.id}
                    className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-750 rounded-lg p-6 border-2 border-indigo-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{set.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{set.description}</p>
                      </div>
                      <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {set.questions.length} Q's
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {set.created_by === user?.email 
                          ? `Created by you for ${partnerName}` 
                          : `Created by ${partnerName} for you`}
                      </p>
                      {set.created_for === user?.email && (
                        <button
                          onClick={() => startGame(set)}
                          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                        >
                          Play Now
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Active Game */}
        {mode === 'play' && gameState?.status === 'active' && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-gray-900 dark:text-white">Score: {currentPlayerScore}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className={`w-5 h-5 ${gameState.timeRemaining <= 10 ? 'text-red-600' : 'text-gray-600'}`} />
                <span className={`font-semibold ${gameState.timeRemaining <= 10 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                  {gameState.timeRemaining}s
                </span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                Question {gameState.currentQuestion + 1}/{gameState.totalQuestions}
              </span>
            </div>

            {/* Question */}
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-8">
              <p className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                {gameState.questions[gameState.currentQuestion]?.question}
              </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameState.questions[gameState.currentQuestion]?.options.map((option, idx) => {
                const isSelected = gameState.selectedAnswer === idx;
                const isCorrect = idx === gameState.questions[gameState.currentQuestion].correctAnswer;
                const showResult = gameState.showExplanation;

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    disabled={gameState.showExplanation}
                    className={`p-6 rounded-lg border-2 transition-all text-left font-semibold ${
                      showResult
                        ? isCorrect
                          ? 'bg-green-100 border-green-600 dark:bg-green-900/30 dark:border-green-400'
                          : isSelected
                          ? 'bg-red-100 border-red-600 dark:bg-red-900/30 dark:border-red-400'
                          : 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700'
                        : isSelected
                        ? 'bg-indigo-100 border-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-400'
                        : 'bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-700 hover:border-indigo-400'
                    } disabled:cursor-not-allowed`}
                  >
                    <span className="text-lg">{option}</span>
                    {showResult && isCorrect && <span className="ml-2 text-green-600">✓</span>}
                    {showResult && isSelected && !isCorrect && <span className="ml-2 text-red-600">✗</span>}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {gameState.showExplanation && (
              <div className="space-y-4">
                {gameState.questions[gameState.currentQuestion]?.explanation && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">💡 Explanation:</p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {gameState.questions[gameState.currentQuestion].explanation}
                    </p>
                  </div>
                )}
                <button
                  onClick={handleNextQuestion}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-lg transition-colors"
                >
                  {gameState.currentQuestion + 1 < gameState.totalQuestions ? 'Next Question' : 'Finish Quiz'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Finished State */}
        {mode === 'play' && gameState?.status === 'finished' && (
          <div className="space-y-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz Complete!</h2>
            
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-2">{gameState.questionSetName}</p>
              <p className="text-5xl font-bold text-indigo-700 dark:text-indigo-300 mb-4">{currentPlayerScore}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Correct</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {gameState.players[user?.email || '']?.answers.filter(a => a.correct).length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Wrong</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {gameState.players[user?.email || '']?.answers.filter(a => !a.correct).length}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setMode('menu')}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-lg transition-colors"
            >
              Back to Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};