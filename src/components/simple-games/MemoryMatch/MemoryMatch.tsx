import React, { useState, useRef } from 'react';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Celebration, MiniCelebration } from '@/components/shared/Celebration';
import { playClick, playFlip, playMatch, playWrong, playWin } from '@/utils/sounds';
import { Brain, Trophy, Users, RotateCcw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Card { id: number; symbol: string; isFlipped: boolean; isMatched: boolean; }
interface MemoryMatchGameState {
  cards: Card[];
  flippedCards: number[];
  players: { [email: string]: { score: number; moves: number } };
  currentPlayer: string;
  status: 'waiting' | 'active' | 'finished';
  gridSize: 4 | 6;
  gameMode: 'solo' | 'versus';
}

const EMOJI_SETS = {
  romantic: ['❤️','💕','💖','💗','💘','💙','💚','💛','💜','💝','💞','💟','💋','💌','💍','💎','💐','🌹'],
  nature:   ['🌺','🌻','🌼','🌷','🌸','🌿','🍀','🍁','🍂','🍃','🍄','🌾','🌱','🌲','🌳','🌴','🌵','🌽'],
  animals:  ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐒','🐔','🐧'],
};

const generateCards = (gridSize: 4 | 6, theme: keyof typeof EMOJI_SETS = 'romantic'): Card[] => {
  const pairCount = (gridSize * gridSize) / 2;
  const symbols = EMOJI_SETS[theme].slice(0, pairCount);
  const pairs = [...symbols, ...symbols];
  for (let i = pairs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pairs[i], pairs[j]] = [pairs[j], pairs[i]]; }
  return pairs.map((symbol, id) => ({ id, symbol, isFlipped: false, isMatched: false }));
};

export const MemoryMatch: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const { user } = useAuth();
  const [gridSize, setGridSize] = useState<4 | 6>(4);
  const [theme, setTheme] = useState<keyof typeof EMOJI_SETS>('romantic');
  const [showCelebration, setShowCelebration] = useState(false);
  const [showMini, setShowMini] = useState(false);
  // Ref to always hold the latest gameState for use inside setTimeout closures
  const gameStateRef = useRef<MemoryMatchGameState | null>(null);

  const initialState: MemoryMatchGameState = {
    cards: [], flippedCards: [], players: {}, currentPlayer: user?.email || '', status: 'waiting', gridSize: 4, gameMode: 'solo',
  };

  const { gameState, updateGameState, loading } = useRealtimeGame<MemoryMatchGameState>(sessionId || 'memorymatch-game', 'memorymatch', initialState);

  // Keep ref in sync with latest gameState
  gameStateRef.current = gameState ?? null;

  const startGame = () => {
    playClick();
    updateGameState({ ...initialState, cards: generateCards(gridSize, theme), gridSize, status: 'active', players: { [user?.email || '']: { score: 0, moves: 0 } } });
  };

  const handleCardClick = (cardId: number) => {
    if (!gameState || gameState.status !== 'active') return;
    const safeCards = Array.isArray(gameState.cards) ? gameState.cards : [];
    const card = safeCards[cardId];
    if (!card || card.isFlipped || card.isMatched || gameState.flippedCards.length >= 2) return;

    playFlip();
    const newFlipped = [...gameState.flippedCards, cardId];
    const newCards   = safeCards.map((c: Card) => c.id === cardId ? { ...c, isFlipped: true } : c);
    const playerEmail = user?.email || '';
    const playerData  = gameState.players[playerEmail] || { score: 0, moves: 0 };
    const updPlayers  = { ...gameState.players, [playerEmail]: { ...playerData, moves: playerData.moves + 1 } };

    if (newFlipped.length === 2) {
      const [fId, sId] = newFlipped;

      if (newCards[fId].symbol === newCards[sId].symbol) {
        // ✅ MATCH
        playMatch();
        setShowMini(true);
        setTimeout(() => setShowMini(false), 1000);

        const matched = newCards.map((c: Card) => c.id === fId || c.id === sId ? { ...c, isMatched: true } : c);
        const newScore = playerData.score + 1;
        const finalPlayers = { ...updPlayers, [playerEmail]: { ...updPlayers[playerEmail], score: newScore } };
        const isFinished = matched.every((c: Card) => c.isMatched);

        updateGameState({
          ...gameState,
          cards: matched,
          flippedCards: [],
          players: finalPlayers,
          status: isFinished ? 'finished' : 'active',
        });

        if (isFinished) {
          setTimeout(() => { playWin(); setShowCelebration(true); }, 500);
        }
      } else {
        // ❌ NO MATCH — show both flipped briefly, then flip back using the ref (avoids stale closure)
        playWrong();
        updateGameState({ ...gameState, cards: newCards, flippedCards: newFlipped, players: updPlayers });

        setTimeout(() => {
          const latest = gameStateRef.current;
          if (!latest) return;
          const latestCards = Array.isArray(latest.cards) ? latest.cards : [];
          const reset = latestCards.map((c: Card) =>
            c.id === fId || c.id === sId ? { ...c, isFlipped: false } : c
          );
          updateGameState({ ...latest, cards: reset, flippedCards: [] });
        }, 1000);
      }
    } else {
      updateGameState({ ...gameState, cards: newCards, flippedCards: newFlipped });
    }
  };

  const resetGame = () => { playClick(); setShowCelebration(false); updateGameState(initialState); };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;

  const safeCards = Array.isArray(gameState?.cards) ? gameState.cards : [];
  const playerData = gameState?.players[user?.email || ''] || { score: 0, moves: 0 };

  return (
    <div className="min-h-screen p-4">
      <Celebration show={showCelebration} type="win" message="All Pairs Found! 🎉" onComplete={() => setShowCelebration(false)} />
      <MiniCelebration show={showMini} message="Match!" icon="heart" />

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">🃏 Memory Match</h1>
          <button onClick={resetGame} className="glass-btn p-2 rounded-xl text-gray-600 dark:text-gray-400"><RotateCcw size={20} /></button>
        </div>

        <div className="glass-card p-6">
          {gameState?.status === 'waiting' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 glass rounded-2xl mb-3">
                  <Brain className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Memory Match</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Find all the matching pairs!</p>
              </div>

              <div className="glass rounded-xl p-5">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Grid Size</h3>
                <div className="grid grid-cols-2 gap-3">
                  {([4, 6] as const).map(s => (
                    <button key={s} onClick={() => { playClick(); setGridSize(s); }}
                      className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                        gridSize === s ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-transparent glass'
                      }`}>
                      <p className="font-bold text-gray-900 dark:text-white">{s}×{s}</p>
                      <p className="text-xs text-gray-500 mt-1">{s === 4 ? '8 pairs · Easy' : '18 pairs · Hard'}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass rounded-xl p-5">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Theme</h3>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(EMOJI_SETS) as Array<keyof typeof EMOJI_SETS>).map(t => (
                    <button key={t} onClick={() => { playClick(); setTheme(t); }}
                      className={`p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                        theme === t ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-transparent glass'
                      }`}>
                      <p className="text-2xl mb-1">{EMOJI_SETS[t][0]}</p>
                      <p className="text-xs font-semibold capitalize text-gray-700 dark:text-gray-300">{t}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={startGame} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 rounded-xl transition hover:scale-[1.02]">
                Start Game
              </button>
            </div>
          )}

          {gameState?.status === 'active' && (
            <div className="space-y-5">
              <div className="flex justify-around">
                {[
                  { icon: Trophy, label: 'Pairs',  value: playerData.score, color: 'text-yellow-500' },
                  { icon: Users,  label: 'Moves',  value: playerData.moves, color: 'text-pink-500' },
                  { icon: Brain,  label: 'Left',   value: ((gameState.gridSize * gameState.gridSize) / 2) - playerData.score, color: 'text-purple-500' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="text-center glass rounded-xl px-5 py-3">
                    <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>

              <div className={`grid gap-3 ${gameState.gridSize === 4 ? 'grid-cols-4' : 'grid-cols-6'}`}>
                {safeCards.map((card: Card) => (
                  <button key={card.id} onClick={() => handleCardClick(card.id)}
                    disabled={card.isFlipped || card.isMatched}
                    className={`aspect-square rounded-xl transition-all duration-300 ${
                      card.isMatched
                        ? 'bg-green-100 dark:bg-green-900/30 scale-90 opacity-60'
                        : card.isFlipped
                        ? 'glass scale-105 ring-2 ring-pink-400'
                        : 'bg-gradient-to-br from-pink-400 to-purple-500 hover:scale-105 hover:shadow-lg shadow-pink-200/30'
                    }`}>
                    <span className={`text-3xl ${card.isFlipped || card.isMatched ? 'opacity-100' : 'opacity-0'}`}>{card.symbol}</span>
                    {!card.isFlipped && !card.isMatched && <span className="text-2xl text-white">?</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameState?.status === 'finished' && (
            <div className="text-center space-y-5">
              <div className="text-6xl animate-bounce-subtle">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Congratulations!</h2>
              <div className="glass rounded-xl p-6 space-y-3">
                <div><p className="text-gray-500 text-sm">Pairs Found</p><p className="text-4xl font-bold text-pink-600">{playerData.score}</p></div>
                <div><p className="text-gray-500 text-sm">Total Moves</p><p className="text-3xl font-bold text-purple-600">{playerData.moves}</p></div>
                {playerData.moves > 0 && <div><p className="text-gray-500 text-sm">Accuracy</p><p className="text-2xl font-bold text-green-600">{((playerData.score / playerData.moves) * 100).toFixed(1)}%</p></div>}
              </div>
              <button onClick={resetGame} className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-4 rounded-xl transition hover:scale-[1.02]">Play Again 💕</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
