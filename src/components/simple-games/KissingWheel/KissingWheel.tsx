import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGameStats } from '@/hooks/useGameStats';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { GameLobby } from '@/components/shared/GameLobby';
import { ArrowLeft, RotateCw, SkipBack, Heart, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WheelSection {
  id: string;
  text: string;
  category: 'romantic' | 'silly' | 'bonding' | 'spicy';
  icon: string;
}

interface KissingWheelGameState {
  wheelSections: WheelSection[];
  currentSection: WheelSection | null;
  difficulty: 'mild' | 'medium' | 'spicy';
  spicyOptIn: boolean;
  skipsRemaining: number;
  skipsUsed: number;
  completedDares: WheelSection[];
  totalSpins: number;
  mode: 'vs-partner' | 'solo';
  status: 'lobby' | 'spinning' | 'result' | 'finished';
  recorded?: boolean;
}

const WHEEL_SECTIONS = {
  romantic: [
    { id: 'r1', text: '💋 Kiss for 10 seconds', category: 'romantic', icon: '💋' },
    { id: 'r2', text: '💕 Give a loving compliment', category: 'romantic', icon: '❤️' },
    { id: 'r3', text: '💑 Hold hands and slow dance', category: 'romantic', icon: '💃' },
    { id: 'r4', text: '💌 Write a love note', category: 'romantic', icon: '💌' },
    { id: 'r5', text: '🌅 Watch sunrise together', category: 'romantic', icon: '🌅' },
    { id: 'r6', text: '💆 Give a massage', category: 'romantic', icon: '💆' },
  ],
  silly: [
    { id: 's1', text: '😂 Tell your best joke', category: 'silly', icon: '😂' },
    { id: 's2', text: '💃 Funny dance challenge', category: 'silly', icon: '💃' },
    { id: 's3', text: '🎭 Do funny impressions', category: 'silly', icon: '🎭' },
    { id: 's4', text: '🤣 Remake a funny memory', category: 'silly', icon: '🤣' },
    { id: 's5', text: '🎤 Sing karaoke together', category: 'silly', icon: '🎤' },
    { id: 's6', text: '👯 Match outfit day', category: 'silly', icon: '👯' },
  ],
  bonding: [
    { id: 'b1', text: '🗺️ Plan an adventure', category: 'bonding', icon: '🗺️' },
    { id: 'b2', text: '❓ 20 Questions game', category: 'bonding', icon: '❓' },
    { id: 'b3', text: '🎵 Create playlist together', category: 'bonding', icon: '🎵' },
    { id: 'b4', text: '✨ Share bucket list item', category: 'bonding', icon: '✨' },
    { id: 'b5', text: '👨‍🍳 Cook a recipe together', category: 'bonding', icon: '👨‍🍳' },
    { id: 'b6', text: '📸 Photo memory session', category: 'bonding', icon: '📸' },
  ],
};

const WHEEL_BUILDER_CONFIG = {
  gameType: 'kissingwheel' as const,
  icon: '🎡',
  gradient: 'from-orange-600 to-red-700',
  description: 'Spin the wheel of romance! Get dares from romantic, silly, and bonding categories.',
  supportsSolo: true,
  supportsAI: false,
};

export const KissingWheel: React.FC = () => {
  const { user } = useAuth();
  const { recordGame } = useGameStats();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'lobby' | 'game'>('lobby');
  const [roomId, setRoomId] = useState<string>('');
  const [gameState, setGameState] = useState<KissingWheelGameState | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [difficultySelected, setDifficultySelected] = useState(false);

  const { gameState: fbGameState, updateGameState } = useRealtimeGame<KissingWheelGameState>(
    roomId,
    WHEEL_BUILDER_CONFIG.gameType,
    null
  );

  useEffect(() => {
    if (fbGameState && mode === 'game') {
      setGameState(fbGameState);
    }
  }, [fbGameState, mode]);

  const handleStartSolo = () => {
    setMode('game');
    setRoomId('WHEEL_' + Math.random().toString(36).substr(2, 6));
  };

  const handleStartVsPartner = () => {
    setMode('game');
    setRoomId('WHEEL_' + Math.random().toString(36).substr(2, 6));
  };

  const handleSetDifficulty = (difficulty: 'mild' | 'medium' | 'spicy') => {
    const sections = getWheelSections(difficulty);
    const initialState: KissingWheelGameState = {
      wheelSections: sections,
      currentSection: null,
      difficulty,
      spicyOptIn: difficulty === 'spicy',
      skipsRemaining: 3,
      skipsUsed: 0,
      completedDares: [],
      totalSpins: 0,
      mode: mode === 'lobby' ? 'solo' : 'vs-partner',
      status: 'lobby',
      recorded: false,
    };

    setGameState(initialState);
    if (mode === 'game' && roomId) {
      updateGameState(initialState);
    }
    setDifficultySelected(true);
  };

  const getWheelSections = (difficulty: 'mild' | 'medium' | 'spicy'): WheelSection[] => {
    const sections: WheelSection[] = [
      ...WHEEL_SECTIONS.romantic,
      ...WHEEL_SECTIONS.silly,
      ...WHEEL_SECTIONS.bonding,
    ];

    if (difficulty === 'spicy') {
      // Add spicy sections (would be more in production)
      sections.push({
        id: 'sp1',
        text: '🔥 Share a fantasy',
        category: 'spicy' as const,
        icon: '🔥',
      });
    }

    return sections;
  };

  const handleSpin = () => {
    if (isSpinning || !gameState) return;

    setIsSpinning(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * gameState.wheelSections.length);
      const selectedSection = gameState.wheelSections[randomIndex];

      const updatedState = {
        ...gameState,
        currentSection: selectedSection,
        totalSpins: gameState.totalSpins + 1,
        status: 'result' as const,
      };

      setGameState(updatedState);
      if (gameState.mode === 'vs-partner' && roomId) {
        updateGameState(updatedState);
      }
      setIsSpinning(false);
    }, 2000);
  };

  const handleComplete = () => {
    if (!gameState || !gameState.currentSection) return;

    const updatedState = {
      ...gameState,
      completedDares: [...gameState.completedDares, gameState.currentSection],
      currentSection: null,
      status: 'spinning' as const,
    };

    setGameState(updatedState);
    if (gameState.mode === 'vs-partner' && roomId) {
      updateGameState(updatedState);
    }

    recordGame({
      gameType: WHEEL_BUILDER_CONFIG.gameType,
      playerEmail: user?.email || '',
      result: 'win',
      score: gameState.completedDares.length + 1,
      mode: gameState.mode,
    });
  };

  const handleSkip = () => {
    if (!gameState || gameState.skipsRemaining === 0) return;

    const updatedState = {
      ...gameState,
      skipsRemaining: gameState.skipsRemaining - 1,
      skipsUsed: gameState.skipsUsed + 1,
      currentSection: null,
      status: 'spinning' as const,
    };

    setGameState(updatedState);
    if (gameState.mode === 'vs-partner' && roomId) {
      updateGameState(updatedState);
    }
  };

  if (mode === 'lobby') {
    return (
      <GameLobby
        gameName="Kissing Wheel"
        gameIcon={WHEEL_BUILDER_CONFIG.icon}
        gradient={WHEEL_BUILDER_CONFIG.gradient}
        description={WHEEL_BUILDER_CONFIG.description}
        supportsSolo={WHEEL_BUILDER_CONFIG.supportsSolo}
        supportsAI={WHEEL_BUILDER_CONFIG.supportsAI}
        gameType={WHEEL_BUILDER_CONFIG.gameType}
        onStartSolo={handleStartSolo}
        onStartVsPartner={handleStartVsPartner}
      />
    );
  }

  if (!gameState || !difficultySelected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-orange-800 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-orange-200 hover:text-white transition mb-8"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Choose Difficulty</h1>
          <div className="grid grid-cols-1 gap-4">
            {[
              { level: 'mild', emoji: '💕', label: 'Mild', desc: 'Romantic + Silly only' },
              { level: 'medium', emoji: '🎡', label: 'Medium', desc: 'All categories' },
              { level: 'spicy', emoji: '🔥', label: 'Spicy', desc: 'Adult content (opt-in)' },
            ].map(({ level, emoji, label, desc }) => (
              <button
                key={level}
                onClick={() => handleSetDifficulty(level as any)}
                className="p-6 rounded-2xl glass-card hover:scale-105 transition text-center"
              >
                <p className="text-5xl mb-3">{emoji}</p>
                <h3 className="text-xl font-bold text-white mb-2">{label}</h3>
                <p className="text-sm text-orange-200">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-900 to-red-900">
        <Loader className="w-8 h-8 text-orange-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-orange-800 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-orange-200 hover:text-white transition"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="text-3xl font-bold text-white">🎡 Kissing Wheel</h1>
          <div className="text-right">
            <p className="text-sm text-orange-300">Spins: {gameState.totalSpins}</p>
            <p className="text-sm text-orange-300">Completed: {gameState.completedDares.length}</p>
          </div>
        </div>

        {/* Wheel Display */}
        <div className="glass-card p-8 rounded-2xl mb-8">
          {!gameState.currentSection && !isSpinning ? (
            <>
              <div className="h-64 flex items-center justify-center mb-8">
                <div className="text-center">
                  <p className="text-6xl mb-4">🎡</p>
                  <p className="text-orange-200">Click spin to get a dare!</p>
                </div>
              </div>
              <button
                onClick={handleSpin}
                className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
              >
                <RotateCw size={20} /> SPIN THE WHEEL
              </button>
            </>
          ) : isSpinning ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <p className="text-6xl animate-spin mb-4">🎡</p>
                <p className="text-orange-200">Spinning...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-64 flex items-center justify-center mb-8">
                <div className="text-center">
                  <p className="text-6xl mb-4">{gameState.currentSection.icon}</p>
                  <p className="text-2xl font-bold text-white">{gameState.currentSection.text}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleSkip}
                  disabled={gameState.skipsRemaining === 0 || isSpinning}
                  className="flex items-center justify-center gap-2 p-3 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white font-bold rounded-lg transition"
                >
                  <SkipBack size={18} /> Skip
                </button>
                <button
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className="flex items-center justify-center gap-2 p-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition"
                >
                  <RotateCw size={18} /> SPIN
                </button>
                <button
                  onClick={handleComplete}
                  className="flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition"
                >
                  <Heart size={18} /> Done
                </button>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-3">Completed Dares</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {gameState.completedDares.map((dare, i) => (
              <div key={i} className="p-2 bg-orange-700/30 rounded text-orange-100 text-sm">
                ✓ {dare.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
