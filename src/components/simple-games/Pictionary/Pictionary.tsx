import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { playSound } from '@/utils/sounds';
import { RefreshCw, ArrowLeft, Eraser, Trash2, Download, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

const WORDS = [
  'Sunset', 'Rainbow', 'Castle', 'Dragon', 'Mermaid', 'Volcano',
  'Spaceship', 'Dinosaur', 'Lighthouse', 'Butterfly', 'Snowman',
  'Penguin', 'Guitar', 'Pizza', 'Balloon', 'Treasure', 'Wizard',
  'Robot', 'Jungle', 'Waterfall', 'Campfire', 'Telescope', 'Cactus',
  'Crown', 'Candle', 'Compass', 'Dolphin', 'Umbrella', 'Lantern',
];

const COLORS = ['#1a1a1a', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff'];
const BRUSH_SIZES = [3, 6, 10, 16];
const TIMER = 90;

export const Pictionary: React.FC = () => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#1a1a1a');
  const [brushSize, setBrushSize] = useState(6);
  const [erasing, setErasing] = useState(false);
  const [word, setWord] = useState('');
  const [guess, setGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMER);
  const [phase, setPhase] = useState<'idle' | 'drawing' | 'guessing' | 'result'>('idle');
  const [result, setResult] = useState<'correct' | 'timeout' | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getCanvas = () => canvasRef.current;
  const getCtx = () => getCanvas()?.getContext('2d');

  useEffect(() => {
    const canvas = getCanvas();
    if (!canvas) return;
    const ctx = getCtx()!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'drawing') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('guessing');
          setTimeLeft(30);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'guessing') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setResult('timeout');
          setPhase('result');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const startGame = () => {
    const available = WORDS.filter(w => !usedWords.includes(w));
    const newWord = available[Math.floor(Math.random() * available.length)];
    setWord(newWord);
    setUsedWords(u => [...u, newWord]);
    setTimeLeft(TIMER);
    setGuess('');
    setResult(null);
    setPhase('drawing');
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim().toLowerCase() === word.toLowerCase()) {
      const pts = timeLeft > 20 ? 20 : timeLeft > 10 ? 15 : 10;
      setScore(s => s + pts);
      setResult('correct');
      setPhase('result');
      playSound('success');
    } else {
      playSound('error');
    }
  };

  const nextRound = () => {
    setRound(r => r + 1);
    const canvas = getCanvas();
    if (canvas) { const ctx = getCtx()!; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    startGame();
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = getCanvas()!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (phase !== 'drawing') return;
    setDrawing(true);
    const pos = getPos(e);
    lastPos.current = pos;
    const ctx = getCtx()!;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (erasing ? brushSize * 3 : brushSize) / 2, 0, Math.PI * 2);
    ctx.fillStyle = erasing ? '#ffffff' : color;
    ctx.fill();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || phase !== 'drawing') return;
    e.preventDefault();
    const ctx = getCtx()!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = erasing ? '#ffffff' : color;
    ctx.lineWidth = erasing ? brushSize * 3 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => setDrawing(false);

  const clearCanvas = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const ctx = getCtx()!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadDrawing = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `pictionary-${word}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const timerColor = timeLeft > 30 ? 'text-green-500' : timeLeft > 15 ? 'text-yellow-500' : 'text-red-500 animate-pulse';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-900 dark:to-pink-950 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🎨 Pictionary</h1>
          <div className="flex items-center gap-1 text-yellow-600">
            <Trophy size={18} />
            <span className="font-bold">{score}</span>
          </div>
        </div>

        {phase === 'idle' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">How to Play</h2>
            <div className="text-gray-600 dark:text-gray-400 mb-6 space-y-2 text-left bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <p>1. 🎨 <strong>Drawer</strong> sees a secret word and draws it (90 seconds)</p>
              <p>2. 👁️ <strong>Guesser</strong> then has 30 seconds to guess the word</p>
              <p>3. ⭐ <strong>Earn points</strong> based on how fast you guess correctly</p>
              <p>4. 🔄 <strong>Take turns</strong> drawing each round!</p>
            </div>
            <button onClick={startGame} className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-8 rounded-xl transition text-lg">
              Start Drawing!
            </button>
          </div>
        )}

        {(phase === 'drawing' || phase === 'guessing') && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  {phase === 'drawing' ? `Round ${round} • Draw:` : 'Round ' + round + ' • Guess the word!'}
                </span>
                {phase === 'drawing' && (
                  <span className="text-lg font-bold text-pink-600 dark:text-pink-400">{word}</span>
                )}
                <span className={`font-bold text-lg ${timerColor}`}>{timeLeft}s</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-pink-500 h-2 rounded-full transition-all" style={{ width: `${phase === 'drawing' ? (timeLeft / TIMER) * 100 : (timeLeft / 30) * 100}%` }} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                className="w-full cursor-crosshair touch-none"
                style={{ background: '#ffffff' }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
            </div>

            {phase === 'drawing' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4">
                <div className="flex gap-2 mb-3 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => { setColor(c); setErasing(false); }}
                      className={`w-8 h-8 rounded-full border-2 transition hover:scale-110 ${
                        color === c && !erasing ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <button
                    onClick={() => setErasing(e => !e)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      erasing ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Eraser size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Size:</span>
                  {BRUSH_SIZES.map(s => (
                    <button
                      key={s}
                      onClick={() => setBrushSize(s)}
                      className={`rounded-full bg-gray-800 dark:bg-white transition ${
                        brushSize === s ? 'ring-2 ring-pink-500 ring-offset-2' : ''
                      }`}
                      style={{ width: s * 2 + 8, height: s * 2 + 8 }}
                    />
                  ))}
                  <div className="flex-1" />
                  <button onClick={clearCanvas} className="p-2 text-gray-500 hover:text-red-500 transition"><Trash2 size={18} /></button>
                  <button onClick={downloadDrawing} className="p-2 text-gray-500 hover:text-blue-500 transition"><Download size={18} /></button>
                </div>
              </div>
            )}

            {phase === 'guessing' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4">
                <p className="text-gray-600 dark:text-gray-400 mb-3 text-center">What did they draw? Type your guess!</p>
                <form onSubmit={handleGuessSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={guess}
                    onChange={e => setGuess(e.target.value)}
                    placeholder="Your guess..."
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    autoFocus
                  />
                  <button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-6 py-3 rounded-xl transition">
                    Guess!
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {phase === 'result' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">{result === 'correct' ? '🎉' : '⏰'}</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {result === 'correct' ? 'Correct!' : 'Time\'s Up!'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">The word was: <strong className="text-pink-600 dark:text-pink-400">{word}</strong></p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Total Score: <strong>{score}</strong></p>
            <div className="flex gap-3 justify-center">
              <button onClick={nextRound} className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2">
                <RefreshCw size={18} /> Next Round
              </button>
              <Link to="/" className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2">
                <ArrowLeft size={18} /> Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
