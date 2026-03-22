import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGameStats } from '@/hooks/useGameStats';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { GameLobby } from '@/components/shared/GameLobby';
import { ArrowLeft, Send, Save, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StoryTurn {
  playerEmail: string;
  playerName: string;
  contribution: string;
  timestamp: number;
}

interface StoryBuilderGameState {
  storyId: string;
  category: 'romantic' | 'adventure' | 'mystery' | 'comedy';
  storyStarter: string;
  turns: StoryTurn[];
  currentTurnPlayer: string;
  totalTurnsTarget: number;
  status: 'waiting' | 'active' | 'finished';
  mode: 'vs-partner' | 'solo';
  recorded?: boolean;
  startTime: number;
}

const STORY_STARTERS = {
  romantic: [
    "It was raining when they first met...",
    "The old coffee shop held so many memories...",
    "She didn't expect to see him again after all these years...",
  ],
  adventure: [
    "The map showed an X in the middle of nowhere...",
    "The mountain peak glistened in the distance...",
    "They discovered an ancient door hidden in the forest...",
  ],
  mystery: [
    "The letter arrived without a sender...",
    "Something didn't add up about the disappearance...",
    "The mysterious gift sat on the doorstep...",
  ],
  comedy: [
    "It started as an ordinary Tuesday...",
    "The plan was foolproof, or so they thought...",
    "When the cat knocked over the vase, everything changed...",
  ],
};

const STORY_BUILDER_CONFIG = {
  gameType: 'storybuilder' as const,
  icon: '📖',
  gradient: 'from-pink-600 to-rose-700',
  description: 'Create a collaborative story together! Alternate adding sentences to build your tale.',
  supportsSolo: true,
  supportsAI: false,
};

export const StoryBuilder: React.FC = () => {
  const { user } = useAuth();
  const { recordGame } = useGameStats();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'lobby' | 'category' | 'game'>('lobby');
  const [category, setCategory] = useState<'romantic' | 'adventure' | 'mystery' | 'comedy' | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [gameState, setGameState] = useState<StoryBuilderGameState | null>(null);
  const [currentContribution, setCurrentContribution] = useState<string>('');

  const { gameState: fbGameState, updateGameState, loading: fbLoading } = useRealtimeGame<StoryBuilderGameState>(
    roomId,
    STORY_BUILDER_CONFIG.gameType,
    null
  );

  useEffect(() => {
    if (fbGameState && mode === 'game') {
      setGameState(fbGameState);
    }
  }, [fbGameState, mode]);

  const handleStartSolo = () => {
    setMode('category');
  };

  const handleStartVsPartner = () => {
    setMode('category');
  };

  const handleCategorySelect = (selectedCategory: typeof category) => {
    if (!selectedCategory) return;
    setCategory(selectedCategory);
    setMode('game');
    setRoomId('STORY_' + Math.random().toString(36).substr(2, 6));
    initializeGame(selectedCategory);
  };

  const initializeGame = (selectedCategory: typeof category) => {
    if (!selectedCategory) return;
    const starterIndex = Math.floor(Math.random() * STORY_STARTERS[selectedCategory].length);
    const initialState: StoryBuilderGameState = {
      storyId: 'story_' + Date.now(),
      category: selectedCategory,
      storyStarter: STORY_STARTERS[selectedCategory][starterIndex],
      turns: [],
      currentTurnPlayer: user?.email || '',
      totalTurnsTarget: 10, // 5 per player
      status: 'active',
      mode: mode === 'lobby' ? 'solo' : 'vs-partner',
      recorded: false,
      startTime: Date.now(),
    };

    setGameState(initialState);
    if (mode === 'game' && roomId) {
      updateGameState(initialState);
    }
  };

  const handleSubmitContribution = () => {
    if (!gameState || currentContribution.trim().length === 0) return;

    const newTurn: StoryTurn = {
      playerEmail: user?.email || '',
      playerName: user?.displayName || user?.email?.split('@')[0] || 'Anonymous',
      contribution: currentContribution,
      timestamp: Date.now(),
    };

    const updatedState = {
      ...gameState,
      turns: [...gameState.turns, newTurn],
      currentTurnPlayer: gameState.turns.length % 2 === 0 ? gameState.currentTurnPlayer : 'other',
      status: gameState.turns.length + 1 >= gameState.totalTurnsTarget ? 'finished' as const : 'active' as const,
    };

    setGameState(updatedState);
    setCurrentContribution('');

    if (gameState.mode === 'vs-partner' && roomId) {
      updateGameState(updatedState);
    }

    // Record when finished
    if (updatedState.status === 'finished') {
      const fullStory = [gameState.storyStarter, ...updatedState.turns.map(t => t.contribution)].join(' ');
      recordGame({
        gameType: STORY_BUILDER_CONFIG.gameType,
        playerEmail: user?.email || '',
        result: 'win',
        score: fullStory.split(' ').length, // Score based on word count
        mode: gameState.mode,
      });
    }
  };

  if (mode === 'lobby') {
    return (
      <GameLobby
        gameName="Story Builder"
        gameIcon={STORY_BUILDER_CONFIG.icon}
        gradient={STORY_BUILDER_CONFIG.gradient}
        description={STORY_BUILDER_CONFIG.description}
        supportsSolo={STORY_BUILDER_CONFIG.supportsSolo}
        supportsAI={STORY_BUILDER_CONFIG.supportsAI}
        gameType={STORY_BUILDER_CONFIG.gameType}
        onStartSolo={handleStartSolo}
        onStartVsPartner={handleStartVsPartner}
      />
    );
  }

  if (mode === 'category') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-900 to-pink-800 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Choose Your Story Category</h1>
          <div className="grid grid-cols-2 gap-4">
            {(Object.entries(STORY_STARTERS) as [keyof typeof STORY_STARTERS, string[]][]).map(([cat, starters]) => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className="p-6 rounded-2xl glass-card hover:scale-105 transition text-center"
              >
                <p className="text-4xl mb-3">
                  {{
                    romantic: '💕',
                    adventure: '🗺️',
                    mystery: '🔍',
                    comedy: '😂',
                  }[cat]}
                </p>
                <h3 className="text-lg font-bold text-white capitalize mb-2">{cat}</h3>
                <p className="text-sm text-pink-200">{starters[0]}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-900 to-rose-900">
        <Loader className="w-8 h-8 text-pink-300 animate-spin" />
      </div>
    );
  }

  const fullStory = [gameState.storyStarter, ...gameState.turns.map(t => t.contribution)].join(' ');
  const isFinished = gameState.status === 'finished';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-900 to-pink-800 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-pink-200 hover:text-white transition"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="text-3xl font-bold text-white capitalize">{gameState.category} Story</h1>
          <div className="text-right">
            <p className="text-sm text-pink-300">Turns: {gameState.turns.length}/{gameState.totalTurnsTarget}</p>
          </div>
        </div>

        {/* Story Display */}
        <div className="glass-card p-8 rounded-2xl mb-6 min-h-96">
          <div className="prose prose-invert max-w-none">
            <p className="text-pink-100 text-lg leading-relaxed whitespace-pre-wrap">{fullStory}</p>
          </div>
        </div>

        {/* Contribution Area */}
        {!isFinished && (
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add Your Part</h3>
            <textarea
              value={currentContribution}
              onChange={e => setCurrentContribution(e.target.value)}
              placeholder="Continue the story with 1-2 sentences..."
              maxLength={200}
              className="w-full p-4 rounded-lg bg-rose-900/30 border border-pink-400/30 text-white placeholder-pink-300/50 focus:border-pink-400 focus:outline-none mb-4 resize-none"
              rows={3}
            />
            <div className="flex gap-4 justify-between items-center">
              <p className="text-sm text-pink-300">{currentContribution.length}/200</p>
              <button
                onClick={handleSubmitContribution}
                disabled={currentContribution.trim().length === 0 || isFinished}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold rounded-lg transition"
              >
                <Send size={18} /> Submit
              </button>
            </div>
          </div>
        )}

        {/* Finished State */}
        {isFinished && (
          <div className="glass-card p-6 rounded-2xl text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Story Complete!</h3>
            <p className="text-pink-200 mb-6">You wrote a {fullStory.split(' ').length}-word story together!</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold rounded-lg hover:scale-105 transition"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
