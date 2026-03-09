import React, { useState, useEffect } from 'react';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/hooks/shared/useAuth';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Brain, Trophy, Clock, Plus, Edit, Play, Trash2, Heart } from 'lucide-react';
import { QuizCreator } from './QuizCreator';
import { QuizPlayer } from './QuizPlayer';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface CustomQuiz {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdFor: string;
  questions: Question[];
  createdAt: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface TriviaQuizProps {
  sessionId?: string;
}

export const TriviaQuiz: React.FC<TriviaQuizProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const [view, setView] = useState<'menu' | 'create' | 'play'>('menu');
  const [myQuizzes, setMyQuizzes] = useState<CustomQuiz[]>([]);
  const [quizzesForMe, setQuizzesForMe] = useState<CustomQuiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<CustomQuiz | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<CustomQuiz | null>(null);

  // Load saved quizzes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('triviaQuizzes');
    if (saved) {
      const allQuizzes: CustomQuiz[] = JSON.parse(saved);
      setMyQuizzes(allQuizzes.filter(q => q.createdBy === user?.email));
      setQuizzesForMe(allQuizzes.filter(q => q.createdFor === user?.email));
    }
  }, [user?.email, view]);

  const handleSaveQuiz = (quiz: CustomQuiz) => {
    const saved = localStorage.getItem('triviaQuizzes');
    const allQuizzes: CustomQuiz[] = saved ? JSON.parse(saved) : [];
    
    if (editingQuiz) {
      // Update existing quiz
      const index = allQuizzes.findIndex(q => q.id === editingQuiz.id);
      if (index !== -1) {
        allQuizzes[index] = quiz;
      }
    } else {
      // Add new quiz
      allQuizzes.push(quiz);
    }
    
    localStorage.setItem('triviaQuizzes', JSON.stringify(allQuizzes));
    setEditingQuiz(null);
    setView('menu');
  };

  const handleDeleteQuiz = (quizId: string) => {
    const saved = localStorage.getItem('triviaQuizzes');
    if (saved) {
      const allQuizzes: CustomQuiz[] = JSON.parse(saved);
      const filtered = allQuizzes.filter(q => q.id !== quizId);
      localStorage.setItem('triviaQuizzes', JSON.stringify(filtered));
      setMyQuizzes(filtered.filter(q => q.createdBy === user?.email));
      setQuizzesForMe(filtered.filter(q => q.createdFor === user?.email));
    }
  };

  const handlePlayQuiz = (quiz: CustomQuiz) => {
    setSelectedQuiz(quiz);
    setView('play');
  };

  const handleEditQuiz = (quiz: CustomQuiz) => {
    setEditingQuiz(quiz);
    setView('create');
  };

  const handleBackToMenu = () => {
    setView('menu');
    setSelectedQuiz(null);
    setEditingQuiz(null);
  };

  if (view === 'create') {
    return (
      <QuizCreator
        userEmail={user?.email || ''}
        partnerEmail={user?.email === 'sinharonitraj@gmail.com' ? 'radhikadidwania567@gmail.com' : 'sinharonitraj@gmail.com'}
        onSave={handleSaveQuiz}
        onCancel={handleBackToMenu}
        editingQuiz={editingQuiz}
      />
    );
  }

  if (view === 'play' && selectedQuiz) {
    return (
      <QuizPlayer
        quiz={selectedQuiz}
        sessionId={sessionId}
        onBack={handleBackToMenu}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Trivia Quiz</h1>
          <p className="text-gray-600 dark:text-gray-400">Create personalized quizzes for each other!</p>
        </div>

        {/* Create Quiz Button */}
        <button
          onClick={() => setView('create')}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-lg transition-all mb-8 flex items-center justify-center gap-2"
        >
          <Plus className="w-6 h-6" />
          Create New Quiz for Your Partner
        </button>

        {/* Quizzes Created For You */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            Quizzes Made For You
          </h2>
          {quizzesForMe.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">No quizzes yet!</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Your partner hasn't created any quizzes for you.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzesForMe.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border-2 border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{quiz.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{quiz.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-4">
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded">{quiz.category}</span>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded capitalize">{quiz.difficulty}</span>
                    <span>{quiz.questions.length} questions</span>
                  </div>
                  <button
                    onClick={() => handlePlayQuiz(quiz)}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Play Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Your Created Quizzes */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Edit className="w-6 h-6 text-indigo-500" />
            Quizzes You Created
          </h2>
          {myQuizzes.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">You haven't created any quizzes yet!</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Click the button above to create your first quiz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-6 border-2 border-indigo-200 dark:border-indigo-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{quiz.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{quiz.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-4">
                    <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded">{quiz.category}</span>
                    <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded capitalize">{quiz.difficulty}</span>
                    <span>{quiz.questions.length} questions</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditQuiz(quiz)}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Playing as: {user?.email}</p>
          <p className="mt-2 text-xs">
            💡 Tip: Create quizzes about your relationship, inside jokes, or things only you two know!
          </p>
        </div>
      </div>
    </div>
  );
};