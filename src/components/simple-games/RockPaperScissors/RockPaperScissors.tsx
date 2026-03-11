import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeGame, sanitizeFirebasePath } from '@/hooks/firebase/useRealtimeGame';
import { useGameStats } from '@/hooks/useGameStats';
import { GameLobby } from '@/components/shared/GameLobby';
import { GameModeBadge } from '@/components/shared/GameModeBadge';
import { playCorrect, playWrong, playClick } from '@/utils/sounds';
import { RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
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
const getResult = (p: RPSChoice, opp: RPSChoice): Result => {
  if (p === opp) return 'draw';
  return CHOICES.find(c => c.value === p)!.beats === opp ? 'win' : 'lose';
};

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
  recorded?: boolean;
}

export const RockPaperScissors: React.FC<{ sessionId?: string }> = ({ sessionId: propSession }) => {
  const { user }       = useAuth();
  const { recordGame } = useGameStats();
  const location       = useLocation();
  const userKey        = user?.email ?? null;

  // AI-mode local state (no Firebase needed for AI)
  const [aiDiff,       setAiDiff]       = useState<AIDifficulty>('medium');
  const [playerChoice, setPlayerChoice] = useState<RPSChoice | null>(null);
  const [aiChoice,     setAiChoice]     = useState<RPSChoice | null>(null);
  const [result,       setResult]       = useState<Result | null>(null);
  const [playerScore,  setPlayerScore]  = useState(0);
  const [aiScore,      setAiScore]      = useState(0);
  const [round,        setRound]        = useState(1);
  const [gameOver,     setGameOver]     = useState(false);
  const [animating,    setAnimating]    = useState(false);
  const [history,      setHistory]      = useState<{ player: RPSChoice; cpu: RPSChoice; result: Result }[]>([]);
  const [aiHistory,    setAiHistory]    = useState<RPSChoice[]>([]);
  const [aiRecorded,   setAiRecorded]   = useState(false);

  // Online-mode room state
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isHost,       setIsHost]       = useState(false);
  const [mode,         setMode]         = useState<GameMode | null>(null);

  // Read ?room= from invite link
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const room   = params.get('room');
    if (room && !activeRoomId) {
      setActiveRoomId(room.toUpperCase());
      setIsHost(false);
      setMode('vs-partner');
    }
  }, [location.search]);

  const safeSession = activeRoomId
    ? `rps-room-${sanitizeFirebasePath(activeRoomId)}`
    : propSession
    ? sanitizeFirebasePath(propSession)
    : `rps-ai-${userKey ? sanitizeFirebasePath(userKey) : 'guest'}`;

  const makeInitial = (p1: string): RPSOnlineState => ({
    p1Email: p1, p2Email: null,
    p1Choice: null, p2Choice: null,
    p1Score: 0, p2Score: 0, round: 1,
    status: 'picking', mode: 'vs-partner',
    aiDifficulty: 'medium', history: [], recorded: false,
  });

  const { gameState, updateGameState, patchGameState, loading } =
    useRealtimeGame<RPSOnlineState>(safeSession, 'rps', makeInitial(userKey ?? ''));

  const isP1Online = gameState?.p1Email === userKey;

  // Player 2 registration
  useEffect(() => {
    if (!gameState || !userKey) return;
    if (gameState.p1Email === userKey) return;
    if (gameState.p2Email === userKey) return;
    patchGameState({ p2Email: userKey } as any);
  }, [gameState?.p1Email, gameState?.p2Email, userKey]);

  const myOnlineChoice  = isP1Online ? gameState?.p1Choice : gameState?.p2Choice;
  const oppOnlineChoice = isP1Online ? gameState?.p2Choice : gameState?.p1Choice;
  const myScore         = isP1Online ? (gameState?.p1Score ?? 0) : (gameState?.p2Score ?? 0);
  const oppScore        = isP1Online ? (gameState?.p2Score ?? 0) : (gameState?.p1Score ?? 0);
  const bothRevealed    = gameState?.status === 'reveal' || gameState?.status === 'finished';

  // ── AI helpers ──
  const recordAIResult = (pScore: number, aScore: number) => {
    if (aiRecorded || !userKey) return;
    setAiRecorded(true);
    const res = pScore > aScore ? 'win' : pScore < aScore ? 'loss' : 'draw';
    recordGame({ gameType: 'rps', playerEmail: userKey, result: res, score: pScore, mode: 'vs-ai' });
  };

  const handleAIChoice = (choice: RPSChoice) => {
    if (animating || gameOver) return;
    setAnimating(true);
    setPlayerChoice(choice); setAiChoice(null); setResult(null);
    setTimeout(() => {
      const cpu = getRPSAIMove(aiHistory, aiDiff as RPSDifficulty);
      const res = getResult(choice, cpu);
      setAiChoice(cpu); setResult(res);
      setAiHistory(h => [...h, choice]);
      setHistory(h => [...h, { player: choice, cpu, result: res }]);
      const newP = res === 'win'  ? playerScore + 1 : playerScore;
      const newA = res === 'lose' ? aiScore + 1     : aiScore;
      if (res === 'win')       { setPlayerScore(newP); playCorrect(); }
      else if (res === 'lose') { setAiScore(newA);     playWrong(); }
      else                     { playClick(); }
      if (round >= TOTAL_ROUNDS) { setGameOver(true); recordAIResult(newP, newA); }
      else setRound(r => r + 1);
      setAnimating(false);
    }, 800);
  };

  const resetAI = () => {
    setPlayerChoice(null); setAiChoice(null); setResult(null);
    setPlayerScore(0); setAiScore(0); setRound(1);
    setGameOver(false); setHistory([]); setAiHistory([]); setAiRecorded(false);
  };

  // ── Online helpers ──
  const recordOnlineResult = (gs: RPSOnlineState) => {
    if (gs.recorded || !userKey) return;
    const myS   = isP1Online ? gs.p1Score : gs.p2Score;
    const oppS  = isP1Online ? gs.p2Score : gs.p1Score;
    const res   = myS > oppS ? 'win' : myS < oppS ? 'loss' : 'draw';
    const opp   = isP1Online ? (gs.p2Email ?? undefined) : gs.p1Email;
    recordGame({ gameType: 'rps', playerEmail: userKey, result: res, score: myS, mode: 'vs-partner', opponentEmail: opp });
    updateGameState({ ...gs, recorded: true });
  };

  const pickOnline = (choice: RPSChoice) => {
    if (!gameState || gameState.status !== 'picking') return;
    if (myOnlineChoice) return;
    const bothPicked = isP1Online ? (gameState.p2Choice !== null) : (gameState.p1Choice !== null);
    const updated = isP1Online
      ? { ...gameState, p1Choice: choice }
      : { ...gameState, p2Choice: choice };
    if (bothPicked) {
      const p1c = isP1Online ? choice : gameState.p1Choice!;
      const p2c = isP1Online ? gameState.p2Choice! : choice;
      const res1 = getResult(p1c, p2c);
      const newState: RPSOnlineState = {
        ...updated,
        p1Choice: isP1Online ? choice : gameState.p1Choice,
        p2Choice: isP1Online ? gameState.p2Choice : choice,
        p1Score: gameState.p1Score + (res1 === 'win'  ? 1 : 0),
        p2Score: gameState.p2Score + (res1 === 'lose' ? 1 : 0),
        history: [...(gameState.history || []), { p1: p1c, p2: p2c }],
        status:  gameState.round >= TOTAL_ROUNDS ? 'finished' : 'reveal',
        recorded: false,
      };
      if (newState.status === 'finished') recordOnlineResult(newState);
      else updateGameState(newState);
    } else {
      updateGameState(updated);
    }
  };

  const nextRoundOnline = () => {
    if (!gameState) return;
    updateGameState({ ...gameState, p1Choice: null, p2Choice: null, round: gameState.round + 1, status: 'picking' });
  };

  // Play Again — reset board, keep players & room
  const playAgainOnline = () => {
    if (!gameState) return;
    updateGameState({ ...makeInitial(gameState.p1Email), p2Email: gameState.p2Email, status: 'picking' });
  };

  // Leave — back to lobby
  const leaveOnline = () => {
    setActiveRoomId(null); setIsHost(false); setMode(null);
  };

  // Invite ready
  const handleStartVsPartner = (roomId: string, hostFlag: boolean) => {
    setIsHost(hostFlag);
    setActiveRoomId(roomId);
    setMode('vs-partner');
    if (hostFlag) {
      // host writes initial state after safeSession updates
      setTimeout(() => {
        updateGameState({ ...makeInitial(userKey ?? ''), status: 'picking' });
      }, 100);
    }
  };

  const handleStartVsAI = (diff: AIDifficulty) => {
    setAiDiff(diff); setMode('vs-ai'); resetAI();
  };

  const resultColors = {
    win:  'text-green-600 dark:text-green-400',
    lose: 'text-red-600 dark:text-red-400',
    draw: 'text-yellow-600 dark:text-yellow-400',
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={32} className="animate-spin text-pink-500" />
    </div>
  );

  // ── LOBBY ──
  if (!mode && !activeRoomId) return (
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
            gameName="Rock Paper Scissors" gameIcon="✊"
            gradient="from-orange-500 to-pink-500"
            description="5 rounds — best score wins!"
            supportsAI
            aiLabels={{ easy: 'pure random', medium: '50% chance to counter last move', hard: 'analyses your pattern' }}
            gameType="RPS"
            onStartVsAI={handleStartVsAI}
            onStartVsPartner={handleStartVsPartner}
          />
        </div>
      </div>
    </div>
  );

  // ── VS AI ──
  if (mode === 'vs-ai') return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setMode(null)} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">✊ Rock Paper Scissors</h1>
          <button onClick={resetAI} className="glass-btn p-2 rounded-xl"><RefreshCw size={20} /></button>
        </div>
        <div className="flex justify-center mb-4"><GameModeBadge mode="vs-ai" difficulty={aiDiff} /></div>
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
                  <div className="text-sm font-medium">{c.label}</div>
                </button>
              ))}
            </div>
          )}
          {gameOver && (
            <div className="text-center">
              <div className="text-5xl mb-3">{playerScore > aiScore ? '🏆' : playerScore < aiScore ? '🤖' : '🤝'}</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {playerScore > aiScore ? 'You Win! 🏆' : playerScore < aiScore ? 'AI Wins! 🤖' : "It's a Tie! 🤝"}
              </h2>
              <p className="text-gray-400 mb-6">{playerScore} – {aiScore} after {TOTAL_ROUNDS} rounds</p>
              <button onClick={resetAI} className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2 mx-auto">
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

  // ── VS PARTNER ──
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={leaveOnline} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">✊ Rock Paper Scissors</h1>
          <button onClick={playAgainOnline} className="glass-btn p-2 rounded-xl"><RefreshCw size={20} /></button>
        </div>
        <div className="flex justify-center gap-2 flex-wrap mb-4">
          <GameModeBadge mode="vs-partner" />
          {activeRoomId && (
            <span className="glass px-3 py-1 rounded-full text-xs font-mono font-bold text-purple-400 tracking-widest">
              Room: {activeRoomId}
            </span>
          )}
        </div>
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
          {!gameState?.p2Email && (
            <p className="text-center text-gray-400 py-4">Waiting for partner to join…</p>
          )}
          {gameState?.p2Email && gameState?.status === 'picking' && (
            <>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                {myOnlineChoice
                  ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin text-purple-400" />Waiting for partner…</span>
                  : "Pick your move — partner won't see until both have chosen!"}
              </p>
              {!myOnlineChoice && (
                <div className="grid grid-cols-3 gap-3">
                  {CHOICES.map(c => (
                    <button key={c.value} onClick={() => pickOnline(c.value)}
                      className="glass-btn rounded-xl p-4 text-center transition-all hover:scale-105 active:scale-95">
                      <div className="text-4xl mb-1">{c.emoji}</div>
                      <div className="text-sm font-medium">{c.label}</div>
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
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-3 rounded-xl hover:scale-[1.02] transition">
                Next Round →
              </button>
            </>
          )}
          {gameState?.status === 'finished' && (
            <div className="text-center">
              <div className="text-5xl mb-3">{myScore > oppScore ? '🏆' : myScore < oppScore ? '💔' : '🤝'}</div>
              <h2 className="text-3xl font-bold text-white mb-6">
                {myScore > oppScore ? 'You Win! 🏆' : myScore < oppScore ? 'Partner Wins!' : "It's a Tie! 🤝"}
              </h2>
              <div className="flex gap-3 justify-center">
                <button onClick={playAgainOnline}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2">
                  <RefreshCw size={18} /> Play Again
                </button>
                <button onClick={leaveOnline}
                  className="glass-btn px-5 py-3 rounded-xl text-gray-400 text-sm font-medium hover:text-red-400 transition">
                  Leave
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
