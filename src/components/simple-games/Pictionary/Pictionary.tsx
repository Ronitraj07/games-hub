import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeGame, sanitizeFirebasePath } from '@/hooks/firebase/useRealtimeGame';
import { useGameStats } from '@/hooks/useGameStats';
import { GameLobby } from '@/components/shared/GameLobby';
import { GameModeBadge } from '@/components/shared/GameModeBadge';
import { playCorrect, playWrong } from '@/utils/sounds';
import { RefreshCw, ArrowLeft, Eraser, Trash2, Download, Trophy, Loader2, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { GameMode } from '@/components/shared/GameLobby';
import type { Difficulty, SeriesFormat, PictionarySeriesState, RoundResult } from './types';
import { DifficultySelector } from './DifficultySelector';
import { SeriesTracker } from './SeriesTracker';
import { RoundSummary } from './RoundSummary';
import { SeriesFinal } from './SeriesFinal';
import { getWordPool, selectRandomWord, NORMAL_WORDS } from './wordPools';

const COLORS = ['#1a1a1a','#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899','#ffffff'];
const BRUSH_SIZES = [3, 6, 10, 16];
const DRAW_TIME   = 90;
const GUESS_TIME  = 30;

// Internal canvas resolution (fixed, high quality)
const CANVAS_W = 600;
const CANVAS_H = 400;

export const Pictionary: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const { user }       = useAuth();
  const { recordGame } = useGameStats();
  const userKey        = user?.email ?? null;
  const location       = useLocation();

  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [seriesFormat, setSeriesFormat] = useState<SeriesFormat>('best-of-3');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  const [activeRoomId,     setActiveRoomId]     = useState<string | null>(null);
  const [isHost,           setIsHost]           = useState(false);
  const [shouldHostStart,  setShouldHostStart]  = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const room   = params.get('room');
    if (room && !activeRoomId) {
      setActiveRoomId(room.toUpperCase());
      setIsHost(false);
      setGameMode('vs-partner');
    }
  }, [location.search, activeRoomId]);

  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const lastPos        = useRef<{ x: number; y: number } | null>(null);
  const syncTimer      = useRef<ReturnType<typeof setInterval> | null>(null);

  // Solo mode state
  const [drawing,       setDrawing]       = useState(false);
  const [color,         setColor]         = useState('#1a1a1a');
  const [brushSize,     setBrushSize]     = useState(6);
  const [erasing,       setErasing]       = useState(false);
  const [timeLeft,      setTimeLeft]      = useState(DRAW_TIME);
  const [localRecorded, setLocalRecorded] = useState(false);

  // Series state (for vs-partner mode)
  const [seriesPhase, setSeriesPhase] = useState<'lobby' | 'format-select' | 'difficulty-select' | 'series-active' | 'round-summary' | 'series-complete'>('lobby');
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [player1SeriesScore, setPlayer1SeriesScore] = useState(0);
  const [player2SeriesScore, setPlayer2SeriesScore] = useState(0);

  // Solo mode only
  const [soloPhase, setSoloPhase] = useState<'idle' | 'drawing' | 'guessing' | 'result'>('idle');
  const [soloWord, setSoloWord] = useState('');
  const [soloGuess, setSoloGuess] = useState('');
  const [soloResult, setSoloResult] = useState<'correct' | 'timeout' | null>(null);
  const [soloScore, setSoloScore] = useState(0);
  const [soloRound, setSoloRound] = useState(1);
  const [soloUsedWords, setSoloUsedWords] = useState<string[]>([]);

  const safeSession = activeRoomId
    ? `pictionary-room-${sanitizeFirebasePath(activeRoomId)}`
    : sessionId
    ? sanitizeFirebasePath(sessionId)
    : `pictionary-${userKey ? sanitizeFirebasePath(userKey) : 'guest'}`;

  const initialOnline: PictionarySeriesState = {
    seriesFormat: 'best-of-3',
    difficulty: 'normal',
    seriesPhase: 'lobby',
    player1Email: userKey ?? '',
    player2Email: '',
    currentRound: 1,
    totalRounds: 3,
    player1SeriesScore: 0,
    player2SeriesScore: 0,
    roundResults: [],
    word: '',
    drawerEmail: userKey ?? '',
    guesserEmail: '',
    canvasData: '',
    guess: '',
    phase: 'waiting',
    result: null,
    drawerReady: false,
    guesserReady: false,
    status: 'waiting',
    recorded: false,
  };

  const { gameState, updateGameState, patchGameState, loading } =
    useRealtimeGame<PictionarySeriesState>(safeSession, 'pictionary', initialOnline);

  const isDrawer  = gameState?.drawerEmail  === userKey;
  const isGuesser = gameState?.guesserEmail === userKey;

  useEffect(() => {
    if (!gameState || gameMode !== 'vs-partner' || !userKey) return;
    if (gameState.status === 'waiting') return;
    if (gameState.drawerEmail === userKey) return;
    if (gameState.guesserEmail === userKey) return;
    if (gameState.guesserEmail !== '') return;
    patchGameState({ guesserEmail: userKey } as any);
  }, [gameState?.status, gameState?.drawerEmail, gameState?.guesserEmail, userKey, gameMode]);

  useEffect(() => {
    if (!gameState || gameState.status !== 'finished' || gameState.recorded || !userKey) return;
    const myScore = gameState.player1Email === userKey ? gameState.player1SeriesScore : gameState.player2SeriesScore;
    const oppScore = gameState.player1Email === userKey ? gameState.player2SeriesScore : gameState.player1SeriesScore;
    const res = myScore > oppScore ? 'win' : myScore < oppScore ? 'loss' : 'draw';
    const opp = gameState.player1Email === userKey ? gameState.player2Email : gameState.player1Email;
    recordGame({
      gameType: 'pictionary',
      playerEmail: userKey,
      result: res,
      score: myScore,
      mode: 'vs-partner',
      opponentEmail: opp || undefined,
    });
    updateGameState({ ...gameState, recorded: true });
  }, [gameState?.status, gameState?.recorded]);

  const getCanvas = () => canvasRef.current;
  const getCtx    = () => getCanvas()?.getContext('2d');

  const clearCanvas = useCallback(() => {
    const c = getCanvas(); if (!c) return;
    const ctx = getCtx()!; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  useEffect(() => { clearCanvas(); }, [soloPhase]);

  useEffect(() => {
    if (gameMode !== 'vs-partner' || !isDrawer || gameState?.phase !== 'drawing') return;
    syncTimer.current = setInterval(() => {
      const c = getCanvas(); if (!c) return;
      const data = c.toDataURL('image/jpeg', 0.4);
      patchGameState({ canvasData: data } as any);
    }, 2000);
    return () => { if (syncTimer.current) clearInterval(syncTimer.current); };
  }, [gameMode, isDrawer, gameState?.phase]);

  useEffect(() => {
    if (!isGuesser || !gameState?.canvasData || gameMode !== 'vs-partner') return;
    const img    = new Image();
    img.onload   = () => { const ctx = getCtx(); if (!ctx) return; ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H); };
    img.src      = gameState.canvasData;
  }, [gameState?.canvasData]);

  useEffect(() => {
    if (gameMode !== 'solo' || soloPhase !== 'drawing') return;
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(t);
          setSoloPhase('guessing');
          setTimeLeft(GUESS_TIME);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [soloPhase, gameMode]);

  useEffect(() => {
    if (gameMode !== 'solo' || soloPhase !== 'guessing') return;
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(t);
          setSoloResult('timeout');
          setSoloPhase('result');
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [soloPhase, gameMode]);

  useEffect(() => {
    if (gameMode !== 'vs-partner' || !isDrawer || gameState?.phase !== 'drawing') return;
    setTimeLeft(DRAW_TIME);
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(t);
          const c = getCanvas();
          const finalData = c ? c.toDataURL('image/jpeg', 0.4) : '';
          updateGameState({ ...gameState!, phase: 'guessing', canvasData: finalData });
          setTimeLeft(GUESS_TIME);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameState?.phase, isDrawer, gameMode]);

  useEffect(() => {
    if (gameMode !== 'vs-partner' || !isGuesser || gameState?.phase !== 'guessing') return;
    setTimeLeft(GUESS_TIME);
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(t);
          updateGameState({
            ...gameState!,
            result: 'timeout',
            phase: 'result',
            seriesPhase: gameState!.currentRound >= gameState!.totalRounds ? 'series-complete' : 'round-summary',
            status: gameState!.currentRound >= gameState!.totalRounds ? 'finished' : 'active',
          });
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameState?.phase, isGuesser, gameMode]);

  const startSolo = () => {
    const wordPool = getWordPool(difficulty);
    const available = wordPool.filter(w => !soloUsedWords.includes(w));
    const newWord   = available[Math.floor(Math.random() * available.length)];
    setSoloWord(newWord);
    setSoloUsedWords(u => [...u, newWord]);
    setTimeLeft(DRAW_TIME);
    setSoloGuess('');
    setSoloResult(null);
    setSoloPhase('drawing');
  };

  const handleSoloGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    if (normalize(soloGuess) === normalize(soloWord)) {
      const pts = timeLeft > 20 ? 20 : timeLeft > 10 ? 15 : 10;
      setSoloScore(s => s + pts);
      setSoloResult('correct');
      setSoloPhase('result');
      playCorrect();
    } else playWrong();
  };

  useEffect(() => {
    if (soloPhase !== 'result' || localRecorded || !userKey || gameMode !== 'solo') return;
    setLocalRecorded(true);
    recordGame({
      gameType: 'pictionary',
      playerEmail: userKey,
      result: soloResult === 'correct' ? 'win' : 'loss',
      score: soloScore,
      mode: 'solo',
    });
  }, [soloPhase]);

  const nextSoloRound = () => {
    setSoloRound(r => r + 1);
    clearCanvas();
    startSolo();
    setLocalRecorded(false);
  };

  const startOnlineRound = useCallback(() => {
    if (!gameState || !userKey) return;

    const wordPool = getWordPool(gameState.difficulty);
    const newWord = selectRandomWord(wordPool, gameState.roundResults.map(r => r.word));

    updateGameState({
      ...gameState,
      word: newWord,
      canvasData: '',
      drawerEmail: gameState.currentRound % 2 === 1 ? gameState.player1Email : gameState.player2Email,
      guesserEmail: gameState.currentRound % 2 === 1 ? gameState.player2Email : gameState.player1Email,
      phase: 'drawing',
      result: null,
      guess: '',
    });
    setTimeLeft(DRAW_TIME);
  }, [gameState, userKey]);

  const startSeriesHost = useCallback(() => {
    if (!isHost || !activeRoomId || !userKey) return;

    const totalRounds = {
      'best-of-1': 1,
      'best-of-3': 3,
      'best-of-5': 5,
    }[seriesFormat];

    updateGameState({
      ...initialOnline,
      seriesFormat,
      difficulty,
      seriesPhase: 'series-active',
      player1Email: userKey,
      player2Email: '',
      currentRound: 1,
      totalRounds,
      status: 'active',
      phase: 'waiting',
    });

    setShouldHostStart(false);
  }, [isHost, activeRoomId, userKey, seriesFormat, difficulty]);

  useEffect(() => {
    if (!shouldHostStart || !activeRoomId || !isHost) return;
    startSeriesHost();
  }, [shouldHostStart, activeRoomId, isHost]);

  const handleOnlineGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameState) return;

    const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    const ok = normalize(gameState.guess) === normalize(gameState.word);

    if (ok) {
      const drawerScore = 10;
      const guesserScore = timeLeft;

      // Create round result
      const roundResult: RoundResult = {
        roundNumber: gameState.currentRound,
        drawer: gameState.drawerEmail,
        guesser: gameState.guesserEmail,
        word: gameState.word,
        result: 'correct',
        drawerScore,
        guesserScore,
        timeRemaining: timeLeft,
      };

      const updatedRoundResults = [...gameState.roundResults, roundResult];
      const p1Score = gameState.player1Email === gameState.drawerEmail
        ? gameState.player1SeriesScore + drawerScore
        : gameState.player1SeriesScore + guesserScore;
      const p2Score = gameState.player2Email === gameState.guesserEmail
        ? gameState.player2SeriesScore + guesserScore
        : gameState.player2SeriesScore + drawerScore;

      const isSeriesComplete = gameState.currentRound >= gameState.totalRounds;

      updateGameState({
        ...gameState,
        result: 'correct',
        phase: isSeriesComplete ? 'result' : 'result',
        player1SeriesScore: p1Score,
        player2SeriesScore: p2Score,
        roundResults: updatedRoundResults,
        seriesPhase: isSeriesComplete ? 'series-complete' : 'round-summary',
        status: isSeriesComplete ? 'finished' : 'active',
      });

      playCorrect();
    } else {
      playWrong();
    }
  };

  const nextOnlineRound = () => {
    if (!gameState) return;

    const isSeriesComplete = gameState.currentRound >= gameState.totalRounds;

    if (isSeriesComplete) {
      return; // Series is complete, show final results screen
    }

    // Move to next round
    startOnlineRound();
    updateGameState({
      ...gameState,
      currentRound: gameState.currentRound + 1,
      seriesPhase: 'series-active',
    });
  };

  // ── Draw helpers ──
  // Maps pointer position to internal canvas coordinates
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = getCanvas()!;
    const rect = c.getBoundingClientRect();
    // Scale from display size to internal canvas resolution
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    if ('touches' in e) return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top)  * scaleY,
    };
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  };

  const canDraw = gameMode === 'solo'
    ? soloPhase === 'drawing'
    : (gameMode === 'vs-partner' && isDrawer && gameState?.phase === 'drawing');

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canDraw) return;
    setDrawing(true);
    const pos = getPos(e); lastPos.current = pos;
    const ctx = getCtx()!;
    ctx.beginPath(); ctx.arc(pos.x, pos.y, (erasing ? brushSize * 3 : brushSize) / 2, 0, Math.PI * 2);
    ctx.fillStyle = erasing ? '#ffffff' : color; ctx.fill();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !canDraw) return;
    e.preventDefault();
    const ctx = getCtx()!; const pos = getPos(e);
    ctx.beginPath(); ctx.moveTo(lastPos.current!.x, lastPos.current!.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = erasing ? '#ffffff' : color;
    ctx.lineWidth   = erasing ? brushSize * 3 : brushSize;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => setDrawing(false);

  const downloadDrawing = () => {
    const c = getCanvas(); if (!c) return;
    const a = document.createElement('a');
    a.download = `pictionary-${soloWord || gameState?.word}.png`; a.href = c.toDataURL(); a.click();
  };

  const timerColor = timeLeft > 30 ? 'text-green-500' : timeLeft > 15 ? 'text-yellow-500' : 'text-red-500 animate-pulse';

  const resetToLobby = () => {
    setGameMode(null);
    setSoloPhase('idle');
    setSeriesPhase('lobby');
    setActiveRoomId(null);
    setIsHost(false);
    setSoloScore(0);
    setSoloRound(1);
    setSoloUsedWords([]);
    setPlayer1SeriesScore(0);
    setPlayer2SeriesScore(0);
    setRoundResults([]);
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" size={32} /></div>;

  // ── MAIN VIEW LOGIC ──
  const isSoloLobby = !gameMode || soloPhase === 'idle';
  const isSeriesLobby = gameMode === 'vs-partner' && seriesPhase === 'lobby';
  const isFormatSelect = gameMode === 'vs-partner' && seriesPhase === 'format-select';
  const isDifficultySelect = gameMode === 'vs-partner' && seriesPhase === 'difficulty-select';
  const isSeriesActive = gameMode === 'vs-partner' && (seriesPhase === 'series-active' || gameState?.seriesPhase === 'series-active');
  const isRoundSummary = gameMode === 'vs-partner' && (seriesPhase === 'round-summary' || gameState?.seriesPhase === 'round-summary');
  const isSeriesComplete = gameMode === 'vs-partner' && (seriesPhase === 'series-complete' || gameState?.seriesPhase === 'series-complete');

  // ─── SOLO LOBBY VIEW ─────────────────────────────
  if (isSoloLobby) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-4 pb-8">
            <div className="flex items-center justify-between mb-4">
              <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition"><ArrowLeft size={20} /> Back</Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">🎨 Pictionary</h1>
              <div className="flex items-center gap-1 text-yellow-600"><Trophy size={18} /><span className="font-bold">{soloScore}</span></div>
            </div>
            <div className="flex items-center justify-center min-h-[60vh]">
              <GameLobby
                gameName="Pictionary"
                gameIcon="🎨"
                gradient="from-pink-500 to-rose-500"
                description="Draw the word — your partner guesses!"
                supportsSolo
                supportsAI={false}
                gameType="Pictionary"
                onStartSolo={() => { setGameMode('solo'); startSolo(); }}
                onStartVsPartner={(roomId, hostFlag) => {
                  setGameMode('vs-partner');
                  setActiveRoomId(roomId);
                  setIsHost(hostFlag);
                  setSeriesPhase('format-select');
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── SERIES FORMAT SELECT VIEW ──────────────────
  if (isFormatSelect) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-4 pb-8">
            <div className="flex items-center justify-between mb-6">
              <button onClick={resetToLobby} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition"><ArrowLeft size={20} /> Back</button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">🎨 Pictionary</h1>
              <div className="w-20"></div>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Choose Series Format</h2>
                <p className="text-gray-600 dark:text-gray-400">How many rounds will you play?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['best-of-1', 'best-of-3', 'best-of-5'] as const).map((format) => {
                  const roundCount = format === 'best-of-1' ? 1 : format === 'best-of-3' ? 3 : 5;
                  const isSelected = seriesFormat === format;
                  return (
                    <button
                      key={format}
                      onClick={() => {
                        setSeriesFormat(format);
                        setSeriesPhase('difficulty-select');
                      }}
                      className={`glass-card p-6 text-center transition duration-300 cursor-pointer transform ${
                        isSelected ? 'scale-105 ring-2 ring-pink-500' : 'hover:scale-105'
                      }`}
                    >
                      <div className="text-4xl mb-3 font-bold text-pink-600 dark:text-pink-400">{roundCount}</div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{format.replace('best-of-', 'Best of ')}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {roundCount === 1 ? 'Quick match' : roundCount === 3 ? 'Standard competition' : 'Ultimate marathon'}
                      </p>
                    </button>
                  );
                })}
              </div>

              {isHost && (
                <div className="glass-card p-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                  💡 When your partner joins, you'll select difficulty together
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── DIFFICULTY SELECT VIEW ────────────────────
  if (isDifficultySelect) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-4 pb-8">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setSeriesPhase('format-select')} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition"><ArrowLeft size={20} /> Back</button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">🎨 Pictionary</h1>
              <div className="w-20"></div>
            </div>

            <DifficultySelector
              seriesFormat={seriesFormat}
              onSelect={(selectedDifficulty) => {
                setDifficulty(selectedDifficulty);
                setSeriesPhase('series-active');
                if (isHost) {
                  setShouldHostStart(true);
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── SERIES ACTIVE / ROUND SUMMARY / COMPLETE ──
  if (isSeriesActive || isRoundSummary || isSeriesComplete) {
    // Show round summary between rounds
    if (isRoundSummary && gameState && gameState.roundResults.length > 0) {
      const lastResult = gameState.roundResults[gameState.roundResults.length - 1];
      const player1Name = gameState.player1Email.split('@')[0];
      const player2Name = gameState.player2Email.split('@')[0];

      return (
        <div className="h-screen flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-4 pb-8">
              <div className="flex items-center justify-between mb-4">
                <button onClick={resetToLobby} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition"><ArrowLeft size={20} /> Back</button>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">🎨 Pictionary</h1>
                <div className="w-20"></div>
              </div>

              <RoundSummary
                round={lastResult}
                player1Name={player1Name}
                player2Name={player2Name}
                player1SeriesScore={gameState.player1SeriesScore}
                player2SeriesScore={gameState.player2SeriesScore}
                isLastRound={gameState.currentRound >= gameState.totalRounds}
                onContinue={() => {
                  if (gameState.currentRound < gameState.totalRounds) {
                    setSeriesPhase('series-active');
                    nextOnlineRound();
                  } else {
                    setSeriesPhase('series-complete');
                  }
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    // Show final results
    if (isSeriesComplete && gameState) {
      const player1Name = gameState.player1Email.split('@')[0];
      const player2Name = gameState.player2Email.split('@')[0];

      return (
        <div className="h-screen flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-4 pb-8">
              <SeriesFinal
                player1Name={player1Name}
                player1Score={gameState.player1SeriesScore}
                player2Name={player2Name}
                player2Score={gameState.player2SeriesScore}
                onPlayAgain={() => {
                  resetToLobby();
                  setGameMode('vs-partner');
                  setSeriesPhase('format-select');
                }}
                onBack={resetToLobby}
              />
            </div>
          </div>
        </div>
      );
    }

    // Active round gameplay
    if (isSeriesActive && gameState) {
      const activePhase = gameState.phase;
      const activeWord = gameState.word;
      const activeResult = gameState.result;
      const isOnlineWaiting = gameState.phase === 'waiting';

      return (
        <div className="h-screen flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-4 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={resetToLobby} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition"><ArrowLeft size={20} /> Back</button>
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">🎨 Pictionary</h1>
                <div className="flex items-center gap-1 text-yellow-600"><Trophy size={18} /></div>
              </div>

              <div className="flex justify-center gap-2 flex-wrap mb-3">
                <GameModeBadge mode="vs-partner" />
                {activeRoomId && (
                  <span className="glass px-3 py-1 rounded-full text-xs font-mono font-bold text-purple-400 tracking-widest">
                    Room: {activeRoomId}
                  </span>
                )}
                <span className="glass px-3 py-1 rounded-full text-xs font-semibold text-pink-400">
                  {gameState.seriesFormat.replace('best-of-', '')} Series
                </span>
              </div>

              {/* Series Tracker */}
              <SeriesTracker
                seriesFormat={gameState.seriesFormat}
                currentRound={gameState.currentRound}
                player1Name={gameState.player1Email.split('@')[0]}
                player1Score={gameState.player1SeriesScore}
                player2Name={gameState.player2Email.split('@')[0]}
                player2Score={gameState.player2SeriesScore}
                difficulty={gameState.difficulty}
              />

              {isOnlineWaiting && (
                <div className="glass-card p-8 text-center mt-4">
                  <Loader2 size={32} className="animate-spin text-pink-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Waiting for partner to connect…</p>
                </div>
              )}

              {(activePhase === 'drawing' || activePhase === 'guessing') && !isOnlineWaiting && (
                <div className="space-y-2 mt-4">
                  {/* Info bar */}
                  <div className="glass-card p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-600 dark:text-gray-400 text-sm">
                        {activePhase === 'drawing'
                          ? (isDrawer ? ' 🎨 Draw!' : ' Waiting for drawer…')
                          : (isGuesser ? ' 👀 Guess!' : ' Guesser is typing…')}
                      </span>
                      {isDrawer && activePhase === 'drawing' &&
                        <span className="text-sm font-bold text-pink-600 dark:text-pink-400">{activeWord}</span>}
                      <span className={`font-bold ${timerColor}`}>{timeLeft}s</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                      <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${activePhase === 'drawing' ? (timeLeft / DRAW_TIME) * 100 : (timeLeft / GUESS_TIME) * 100}%` }} />
                    </div>
                  </div>

                  {/* Canvas */}
                  <div ref={containerRef} className="glass-card overflow-hidden w-full">
                    <canvas
                      ref={canvasRef}
                      width={CANVAS_W}
                      height={CANVAS_H}
                      className={`w-full touch-none block ${canDraw ? 'cursor-crosshair' : 'cursor-default'}`}
                      style={{ background: '#ffffff', aspectRatio: '3/2' }}
                      onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                      onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                    />
                  </div>

                  {/* Drawing toolbar */}
                  {canDraw && (
                    <div className="glass-card p-3">
                      <div className="flex gap-1.5 mb-2 flex-wrap items-center">
                        {COLORS.map(c => (
                          <button key={c} onClick={() => { setColor(c); setErasing(false); }}
                            className={`w-7 h-7 rounded-full border-2 transition hover:scale-110 ${
                              color === c && !erasing ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300'
                            }`} style={{ backgroundColor: c }} />
                        ))}
                        <button onClick={() => setErasing(e => !e)}
                          className={`p-1.5 rounded-lg transition ${erasing ? 'bg-blue-500 text-white' : 'glass-btn text-gray-700 dark:text-gray-300'}`}>
                          <Eraser size={15} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Size:</span>
                        {BRUSH_SIZES.map(s => (
                          <button key={s} onClick={() => setBrushSize(s)}
                            className={`rounded-full bg-gray-800 dark:bg-white transition ${brushSize === s ? 'ring-2 ring-pink-500 ring-offset-2' : ''}`}
                            style={{ width: s * 2 + 6, height: s * 2 + 6 }} />
                        ))}
                        <div className="flex-1" />
                        <button onClick={clearCanvas} className="p-1.5 text-gray-500 hover:text-red-500 transition"><Trash2 size={16} /></button>
                        <button onClick={downloadDrawing} className="p-1.5 text-gray-500 hover:text-blue-500 transition"><Download size={16} /></button>
                      </div>
                    </div>
                  )}

                  {/* Guess input */}
                  {(activePhase === 'guessing' && isGuesser) && (
                    <div className="glass-card p-3">
                      <p className="text-gray-600 dark:text-gray-400 mb-2 text-center text-sm">What did they draw?</p>
                      <form onSubmit={handleOnlineGuessSubmit} className="flex gap-2">
                        <input type="text" value={gameState.guess} onChange={e => patchGameState({ guess: e.target.value } as any)}
                          placeholder="Your guess…" autoFocus
                          className="flex-1 glass border-0 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400" />
                        <button type="submit" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-5 py-2 rounded-xl transition">
                          Guess!
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* Result screen */}
              {activePhase === 'result' && (
                <div className="glass-card p-8 text-center mt-4">
                  <div className="text-6xl mb-4">{activeResult === 'correct' ? '🎉' : '⏰'}</div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {activeResult === 'correct' ? 'Correct!' : "Time's Up!"}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    The word was: <strong className="text-pink-600 dark:text-pink-400">{activeWord}</strong>
                  </p>
                  <button
                    onClick={() => {
                      if (gameState.currentRound < gameState.totalRounds) {
                        setSeriesPhase('round-summary');
                      } else {
                        setSeriesPhase('series-complete');
                      }
                    }}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 mx-auto">
                    <RefreshCw size={18} />
                    {gameState.currentRound >= gameState.totalRounds ? 'View Series Results' : 'See Round Summary'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  }

  // ─── SOLO MODE GAMEPLAY ─────────────────────────
  const activePhase = soloPhase;
  const activeWord = soloWord;
  const activeResult = soloResult;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={resetToLobby} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition"><ArrowLeft size={20} /> Back</button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">🎨 Pictionary</h1>
            <div className="flex items-center gap-1 text-yellow-600"><Trophy size={18} /><span className="font-bold">{soloScore}</span></div>
          </div>

          <div className="flex justify-center gap-2 flex-wrap mb-3">
            <GameModeBadge mode="solo" />
            <span className="glass px-3 py-1 rounded-full text-xs font-semibold text-blue-400">
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} · Round {soloRound}
            </span>
          </div>

          {(activePhase === 'drawing' || activePhase === 'guessing') && (
            <div className="space-y-2">
              {/* Info bar */}
              <div className="glass-card p-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600 dark:text-gray-400 text-sm">
                    {activePhase === 'drawing' ? '🎨 Draw!' : '👀 Guess!'}
                  </span>
                  {activePhase === 'drawing' && <span className="text-sm font-bold text-pink-600 dark:text-pink-400">{activeWord}</span>}
                  <span className={`font-bold ${timerColor}`}>{timeLeft}s</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                  <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${activePhase === 'drawing' ? (timeLeft / DRAW_TIME) * 100 : (timeLeft / GUESS_TIME) * 100}%` }} />
                </div>
              </div>

              {/* Canvas */}
              <div ref={containerRef} className="glass-card overflow-hidden w-full">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  className={`w-full touch-none block ${canDraw ? 'cursor-crosshair' : 'cursor-default'}`}
                  style={{ background: '#ffffff', aspectRatio: '3/2' }}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                />
              </div>

              {/* Drawing toolbar */}
              {canDraw && (
                <div className="glass-card p-3">
                  <div className="flex gap-1.5 mb-2 flex-wrap items-center">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => { setColor(c); setErasing(false); }}
                        className={`w-7 h-7 rounded-full border-2 transition hover:scale-110 ${
                          color === c && !erasing ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300'
                        }`} style={{ backgroundColor: c }} />
                    ))}
                    <button onClick={() => setErasing(e => !e)}
                      className={`p-1.5 rounded-lg transition ${erasing ? 'bg-blue-500 text-white' : 'glass-btn text-gray-700 dark:text-gray-300'}`}>
                      <Eraser size={15} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Size:</span>
                    {BRUSH_SIZES.map(s => (
                      <button key={s} onClick={() => setBrushSize(s)}
                        className={`rounded-full bg-gray-800 dark:bg-white transition ${brushSize === s ? 'ring-2 ring-pink-500 ring-offset-2' : ''}`}
                        style={{ width: s * 2 + 6, height: s * 2 + 6 }} />
                    ))}
                    <div className="flex-1" />
                    <button onClick={clearCanvas} className="p-1.5 text-gray-500 hover:text-red-500 transition"><Trash2 size={16} /></button>
                    <button onClick={downloadDrawing} className="p-1.5 text-gray-500 hover:text-blue-500 transition"><Download size={16} /></button>
                  </div>
                </div>
              )}

              {/* Guess input */}
              {(activePhase === 'guessing') && (
                <div className="glass-card p-3">
                  <p className="text-gray-600 dark:text-gray-400 mb-2 text-center text-sm">What did you draw?</p>
                  <form onSubmit={handleSoloGuess} className="flex gap-2">
                    <input type="text" value={soloGuess} onChange={e => setSoloGuess(e.target.value)}
                      placeholder="Your guess…" autoFocus
                      className="flex-1 glass border-0 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400" />
                    <button type="submit" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-5 py-2 rounded-xl transition">
                      Guess!
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {activePhase === 'result' && (
            <div className="glass-card p-8 text-center">
              <div className="text-6xl mb-4">{activeResult === 'correct' ? '🎉' : '⏰'}</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {activeResult === 'correct' ? 'Correct!' : "Time's Up!"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The word was: <strong className="text-pink-600 dark:text-pink-400">{activeWord}</strong>
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={nextSoloRound}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2">
                  <RefreshCw size={18} /> Next Round
                </button>
                <button onClick={resetToLobby}
                  className="glass-btn text-gray-700 dark:text-gray-300 font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2">
                  <ArrowLeft size={18} /> Lobby
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
