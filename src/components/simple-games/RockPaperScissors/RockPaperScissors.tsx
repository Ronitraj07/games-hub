import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeGame, sanitizeFirebasePath } from '@/hooks/firebase/useRealtimeGame';
import { GameLobby } from '@/components/shared/GameLobby';
import { GameModeBadge } from '@/components/shared/GameModeBadge';
import { playCorrect, playWrong, playClick } from '@/utils/sounds';
import { RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRPSAIMove } from '@/lib/rps-ai';
import type { RPSChoice, RPSDifficulty } from '@/lib/rps-ai';
import type { AIDifficulty, GameMode } from '@/components/shared/GameLobby';

const CHOICES: { value: RPSChoice; emoji: string; label: string; beats: RPSChoice }[] = [
  { value: 'rock',     emoji: '✊', label: 'Rock',     beats: 'scissors' },
  { value: 'paper',   emoji: '✋', label: 'Paper',    beats: 'rock'     },
  { value: 'scissors',emoji: '✌️', label: 'Scissors', beats: 'paper'    },
];

const TOTAL_ROUNDS = 5;

type Result = 'win' | 'lose' | 'draw';
const getResult = (p: RPSChoice, ai: RPSChoice): Result => {
  if (p === ai) return 'draw';
  return CHOICES.find(c => c.value === p)!.beats === ai ? 'win' : 'lose';
};

// Firebase game state for vs-partner
interface RPSOnlineState {
  p1Email: string;
  p2Email: string | null;
  p1Choice: RPSChoice | null;
  p2Choice: RPSChoice | null;
  p1Score: number;
  p2Score: number;
  round: number;
  status: 'waiting' | 'picking' | 'reveal' | 'finished';
  mode: GameMode;
  aiDifficulty: AIDifficulty;
  history: { p1: RPSChoice; p2: RPSChoice }[];
}

export const RockPaperScissors: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const { user } = useAuth();
  const userKey  = user?.email ?? null;

  // ── Local (vs-AI / solo) state ──
  const [mode,        setMode]        = useState<GameMode | null>(null);
  const [aiDiff,      setAiDiff]      = useState<AIDifficulty>('medium');
  const [playerChoice, setPlayerChoice] = useState<RPSChoice | null>(null);
  const [aiChoice,    setAiChoice]    = useState<RPSChoice | null>(null);
  const [result,      setResult]      = useState<Result | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore,     setAiScore]     = useState(0);
  const [round,       setRound]       = useState(1);
  const [gameOver,    setGameOver]    = useState(false);
  const [animating,   setAnimating]   = useState(false);
  const [history,     setHistory]     = useState<{ player: RPSChoice; cpu: RPSChoice; result: Result }[]>([]);
  const [aiHistory,   setAiHistory]   = useState<RPSChoice[]>([]);

  // ── Online (vs-partner) state ──
  const safeSession = sessionId
    ? sanitizeFirebasePath(sessionId)
    : `rps-${userKey ? sanitizeFirebasePath(userKey) : 'guest'}`;

  const initialOnline: RPSOnlineState = {
    p1Email: userKey ?? '', p2Email: null,
    p1Choice: null, p2Choice: null,
    p1Score: 0, p2Score: 0, round: 1,
    status: 'waiting', mode: 'vs-partner',
    aiDifficulty: 'medium', history: [],
  };

  const { gameState, updateGameState, loading } =
    useRealtimeGame<RPSOnlineState>(safeSession, 'rps', initialOnline);

  const isP1Online = gameState?.p1Email === userKey;
  const myOnlineChoice = isP1Online ? gameState?.p1Choice : gameState?.p2Choice;
  const oppOnlineChoice = isP1Online ? gameState?.p2Choice : gameState?.p1Choice;

  // ─── AI mode handlers ───
  const handleAIChoice = (choice: RPSChoice) => {
    if (animating || gameOver) return;
    setAnimating(true);
    setPlayerChoice(choice);
    setAiChoice(null); setResult(null);
    setTimeout(() => {
      const cpu = getRPSAIMove(aiHistory, aiDiff as RPSDifficulty);
      const res = getResult(choice, cpu);
      setAiChoice(cpu); setResult(res);
      setAiHistory(h => [...h, choice]);
      setHistory(h => [...h, { player: choice, cpu, result: res }]);
      if (res === 'win')       { setPlayerScore(s => s+1); playCorrect(); }
      else if (res === 'lose') { setAiScore(s => s+1);     playWrong(); }
      else                     { playClick(); }
      if (round >= TOTAL_ROUNDS) setGameOver(true);
      else setRound(r => r+1);
      setAnimating(false);
    }, 800);
  };

  const resetAI = () => {
    setPlayerChoice(null); setAiChoice(null); setResult(null);
    setPlayerScore(0); setAiScore(0); setRound(1);
    setGameOver(false); setHistory([]); setAiHistory([]);
  };

  // ─── Online mode handlers ───
  const pickOnline = (choice: RPSChoice) => {
    if (!gameState || gameState.status !== 'picking') return;
    if (myOnlineChoice) return; // already picked
    const update = isP1Online
      ? { ...gameState, p1Choice: choice }
      : { ...gameState, p2Choice: choice };
    // Both picked → reveal
    const bothPicked = isP1Online ? (gameState.p2Choice !== null) : (gameState.p1Choice !== null);
    if (bothPicked) {
      const p1c = isP1Online ? choice : gameState.p1Choice!;
      const p2c = isP1Online ? gameState.p2Choice! : choice;
      const res1 = getResult(p1c, p2c);
      updateGameState({
        ...update,
        p2Choice: isP1Online ? gameState.p2Choice : choice,
        p1Choice: isP1Online ? choice : gameState.p1Choice,
        p1Score: gameState.p1Score + (res1 === 'win' ? 1 : 0),
        p2Score: gameState.p2Score + (res1 === 'lose' ? 1 : 0),
        history: [...(gameState.history || []), { p1: p1c, p2: p2c }],
        status: gameState.round >= TOTAL_ROUNDS ? 'finished' : 'reveal',
      });
    } else {
      updateGameState(update);
    }
  };

  const nextRoundOnline = () => {
    if (!gameState) return;
    updateGameState({
      ...gameState,
      p1Choice: null, p2Choice: null,
      round: gameState.round + 1,
      status: 'picking',
    });
  };

  const startOnlineGame = () => {
    updateGameState({
      ...initialOnline,
      p1Email: userKey ?? '',
      p2Email: 'opponent',
      status: 'picking',
      mode: 'vs-partner',
    });
  };

  const resetOnline = () => updateGameState(initialOnline);

  // ─── Lobby callbacks ───
  const handleStartVsAI = (diff: AIDifficulty) => {
    setAiDiff(diff); setMode('vs-ai');
    resetAI();
  };
  const handleStartVsPartner = (_roomId: string, _isHost: boolean) => {
    setMode('vs-partner');
    startOnlineGame();
  };

  const resultColors = {
    win:  'text-green-600 dark:text-green-400',
    lose: 'text-red-600 dark:text-red-400',
    draw: 'text-yellow-600 dark:text-yellow-400',
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;

  // ─────────────── LOBBY ───────────────
  if (!mode) return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">✊ Rock Paper Scissors</h1>
          <div className="w-10" />
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <GameLobby
            gameName="Rock Paper Scissors"
            gameIcon="✊"
            gradient="from-orange-500 to-pink-500"
            description="5 rounds — best score wins!"
            supportsAI
            aiLabels={{
              easy:   'pure random — unpredictable',
              medium: '50% chance to counter your last move',
              hard:   'analyses your pattern — adapts',
            }}
            gameType="RPS"
            onStartVsAI={handleStartVsAI}
            onStartVsPartner={handleStartVsPartner}
          />
        </div>
      </div>
    </div>
  );

  // ─────────────── VS AI ───────────────
  if (mode === 'vs-ai') return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setMode(null)} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">✊ Rock Paper Scissors</h1>
          <button onClick={resetAI} className="glass-btn p-2 rounded-xl text-gray-600 dark:text-gray-400"><RefreshCw size={20} /></button>
        </div>

        <div className="flex justify-center mb-4">
          <GameModeBadge mode="vs-ai" difficulty={aiDiff} />
        </div>

        {/* Score */}
        <div className="glass-card p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <p className="text-sm text-gray-500">{user?.displayName || 'You'}</p>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{playerScore}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-xs text-gray-400">Round {Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</p>
              <p className="text-2xl font-bold text-gray-400">VS</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-sm text-gray-500">AI 🤖</p>
              <p className="text-4xl font-bold text-red-600 dark:text-red-400">{aiScore}</p>
            </div>
          </div>
        </div>

        {/* Battle */}
        <div className="glass-card p-6 mb-4">
          <div className="flex justify-between items-center mb-6">
            <div className="text-center flex-1">
              <div className={`text-8xl transition-all duration-300 ${animating ? 'animate-bounce' : ''}`}>
                {playerChoice ? CHOICES.find(c => c.value === playerChoice)!.emoji : '❓'}
              </div>
              <p className="text-sm text-gray-500 mt-2">Your choice</p>
            </div>
            <div className="text-3xl">⚔️</div>
            <div className="text-center flex-1">
              <div className={`text-8xl transition-all duration-300 ${animating ? 'animate-bounce' : ''}`}>
                {animating ? '🤔' : aiChoice ? CHOICES.find(c => c.value === aiChoice)!.emoji : '❓'}
              </div>
              <p className="text-sm text-gray-500 mt-2">AI choice</p>
            </div>
          </div>
          {result && !gameOver && (
            <div className={`text-center text-2xl font-bold mb-4 ${resultColors[result]}`}>
              {result === 'win' ? '🎉 You Win!' : result === 'lose' ? '😅 AI Wins!' : '🤝 Draw!'}
            </div>
          )}
          {!gameOver && (
            <div className="grid grid-cols-3 gap-3">
              {CHOICES.map(c => (
                <button key={c.value} onClick={() => handleAIChoice(c.value)} disabled={animating}
                  className="glass-btn rounded-xl p-4 text-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
                  <div className="text-4xl mb-1">{c.emoji}</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{c.label}</div>
                </button>
              ))}
            </div>
          )}
          {gameOver && (
            <div className="text-center">
              <div className="text-5xl mb-3">{playerScore > aiScore ? '🏆' : playerScore < aiScore ? '🤖' : '🤝'}</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {playerScore > aiScore ? 'You Win! 🏆' : playerScore < aiScore ? 'AI Wins! 🤖' : "It's a Tie! 🤝"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{playerScore} – {aiScore} after {TOTAL_ROUNDS} rounds</p>
              <button onClick={resetAI}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold px-8 py-3 rounded-xl transition flex items-center gap-2 mx-auto">
                <RefreshCw size={18} /> Play Again
              </button>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Round History</h3>
            <div className="flex gap-2 flex-wrap">
              {history.map((h, i) => (
                <div key={i} className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  h.result==='win'  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                  h.result==='lose' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                }`}>
                  {CHOICES.find(c=>c.value===h.player)!.emoji} vs {CHOICES.find(c=>c.value===h.cpu)!.emoji}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ─────────────── VS PARTNER (online) ───────────────
  const myScore  = isP1Online ? gameState?.p1Score ?? 0 : gameState?.p2Score ?? 0;
  const oppScore = isP1Online ? gameState?.p2Score ?? 0 : gameState?.p1Score ?? 0;
  const bothRevealed = gameState?.status === 'reveal' || gameState?.status === 'finished';

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { resetOnline(); setMode(null); }}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">✊ Rock Paper Scissors</h1>
          <button onClick={resetOnline} className="glass-btn p-2 rounded-xl text-gray-600 dark:text-gray-400"><RefreshCw size={20} /></button>
        </div>

        <div className="flex justify-center mb-4">
          <GameModeBadge mode="vs-partner" />
        </div>

        {/* Score */}
        <div className="glass-card p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <p className="text-sm text-gray-500">You</p>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{myScore}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-xs text-gray-400">Round {gameState?.round ?? 1}/{TOTAL_ROUNDS}</p>
              <p className="text-2xl font-bold text-gray-400">VS</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-sm text-gray-500">Partner</p>
              <p className="text-4xl font-bold text-red-600 dark:text-red-400">{oppScore}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 mb-4">
          {gameState?.status === 'picking' && (
            <>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                {myOnlineChoice ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin text-purple-400" />
                    Waiting for partner…
                  </span>
                ) : 'Pick your move — partner won\'t see until both have chosen!'}
              </p>
              {!myOnlineChoice && (
                <div className="grid grid-cols-3 gap-3">
                  {CHOICES.map(c => (
                    <button key={c.value} onClick={() => pickOnline(c.value)}
                      className="glass-btn rounded-xl p-4 text-center transition-all hover:scale-105 active:scale-95">
                      <div className="text-4xl mb-1">{c.emoji}</div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{c.label}</div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {bothRevealed && gameState?.status !== 'finished' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="text-center flex-1">
                  <div className="text-8xl">{myOnlineChoice ? CHOICES.find(c=>c.value===myOnlineChoice)!.emoji : '❓'}</div>
                  <p className="text-sm text-gray-500 mt-2">You</p>
                </div>
                <div className="text-3xl">⚔️</div>
                <div className="text-center flex-1">
                  <div className="text-8xl">{oppOnlineChoice ? CHOICES.find(c=>c.value===oppOnlineChoice)!.emoji : '❓'}</div>
                  <p className="text-sm text-gray-500 mt-2">Partner</p>
                </div>
              </div>
              <button onClick={nextRoundOnline}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-3 rounded-xl transition hover:scale-[1.02]">
                Next Round →
              </button>
            </>
          )}

          {gameState?.status === 'finished' && (
            <div className="text-center">
              <div className="text-5xl mb-3">{myScore > oppScore ? '🏆' : myScore < oppScore ? '💔' : '🤝'}</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {myScore > oppScore ? 'You Win! 🏆' : myScore < oppScore ? 'Partner Wins!' : "It's a Tie! 🤝"}
              </h2>
              <button onClick={resetOnline}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold px-8 py-3 rounded-xl transition">
                <RefreshCw size={18} className="inline mr-2" /> Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
