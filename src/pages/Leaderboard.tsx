import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, RefreshCw, Loader2, Swords, Brain, Grid3x3, Hash, Gamepad2, HelpCircle, Flame, Zap, Image, Calculator, Dices } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ALLOWED_EMAILS, getDisplayNameFromEmail, getPlayerEmoji } from '@/lib/auth-config';

// ─── types ──────────────────────────────────────────────────────────────────
type GameType =
  | 'tictactoe' | 'wordscramble' | 'memorymatch' | 'connect4'
  | 'trivia'    | 'rps'          | 'pictionary'  | 'mathduel' | 'truthordare';

interface PlayerStat {
  email:       string;
  name:        string;
  emoji:       string;
  wins:        number;
  losses:      number;
  draws:       number;
  totalGames:  number;
  winRate:     number;
  totalScore:  number;
  byGame:      Record<GameType, { wins: number; losses: number; draws: number }>;
}

// Fix: added created_at so getWinStreak sort works correctly
interface Row {
  player_email:   string;
  opponent_email: string | null;
  result:         string;
  score:          number;
  game_type:      GameType;
  created_at:     string | null;
}

// ─── game metadata ─────────────────────────────────────────────────────────────────
const GAME_META: Record<GameType, { label: string; icon: React.ReactNode; color: string }> = {
  tictactoe:   { label: 'Tic Tac Toe',        icon: <Hash size={16}/>,       color: 'text-green-500'  },
  wordscramble:{ label: 'Word Scramble',        icon: <Gamepad2 size={16}/>,   color: 'text-purple-500' },
  memorymatch: { label: 'Memory Match',         icon: <Brain size={16}/>,      color: 'text-blue-500'   },
  connect4:    { label: 'Connect 4',            icon: <Grid3x3 size={16}/>,    color: 'text-yellow-500' },
  trivia:      { label: 'Trivia Quiz',          icon: <HelpCircle size={16}/>, color: 'text-pink-500'   },
  rps:         { label: 'Rock Paper Scissors',  icon: <Swords size={16}/>,     color: 'text-orange-500' },
  pictionary:  { label: 'Pictionary',           icon: <Image size={16}/>,      color: 'text-rose-500'   },
  mathduel:    { label: 'Math Duel',            icon: <Calculator size={16}/>, color: 'text-lime-500'   },
  truthordare: { label: 'Truth or Dare',        icon: <Flame size={16}/>,      color: 'text-red-500'    },
};

const GAME_TYPES = Object.keys(GAME_META) as GameType[];

const emptyByGame = (): Record<GameType, { wins: number; losses: number; draws: number }> =>
  Object.fromEntries(GAME_TYPES.map(g => [g, { wins: 0, losses: 0, draws: 0 }])) as any;

// ─── build stats from raw rows ─────────────────────────────────────────────────────────
const buildStats = (rows: Row[]): PlayerStat[] => {
  const map: Record<string, PlayerStat> = {};

  ALLOWED_EMAILS.forEach(email => {
    map[email] = {
      email, name: getDisplayNameFromEmail(email), emoji: getPlayerEmoji(email),
      wins: 0, losses: 0, draws: 0, totalGames: 0, winRate: 0, totalScore: 0,
      byGame: emptyByGame(),
    };
  });

  rows.forEach(r => {
    const p = map[r.player_email];
    if (!p) return;
    p.totalGames++;
    p.totalScore += r.score ?? 0;
    if (r.result === 'win')  { p.wins++;   p.byGame[r.game_type].wins++;   }
    if (r.result === 'loss') { p.losses++; p.byGame[r.game_type].losses++; }
    if (r.result === 'draw') { p.draws++;  p.byGame[r.game_type].draws++;  }
  });

  Object.values(map).forEach(p => {
    p.winRate = p.totalGames > 0 ? Math.round((p.wins / p.totalGames) * 100) : 0;
  });

  return Object.values(map).sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
};

// ─── compute head-to-head wins ────────────────────────────────────────────────────────────
const getH2HWins = (rows: Row[], myEmail: string, opponentEmail: string): number =>
  rows.filter(r => r.player_email === myEmail && r.opponent_email === opponentEmail && r.result === 'win').length;

// ─── compute current win streak ───────────────────────────────────────────────────────────────
const getWinStreak = (rows: Row[], email: string): number => {
  // Fix: created_at is now properly typed so the sort compares real timestamps
  const mine = rows
    .filter(r => r.player_email === email)
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
  let streak = 0;
  for (const r of mine) {
    if (r.result === 'win') streak++;
    else break;
  }
  return streak;
};

// ─── component ─────────────────────────────────────────────────────────────────────────────
export const Leaderboard: React.FC = () => {
  const [stats,   setStats]   = useState<PlayerStat[]>([]);
  const [rawRows, setRawRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [tab,     setTab]     = useState<'overall' | GameType>('overall');

  const fetchStats = async () => {
    setLoading(true); setError('');
    if (!isSupabaseConfigured()) {
      setError('Supabase not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Vercel env vars.');
      setLoading(false);
      return;
    }
    const { data, error: err } = await supabase
      .from('game_results')
      .select('player_email, opponent_email, result, score, game_type, created_at')
      .order('created_at', { ascending: false })
      .limit(2000);
    if (err) { setError(err.message); setLoading(false); return; }
    const rows = (data ?? []) as Row[];
    setRawRows(rows);
    setStats(buildStats(rows));
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  const displayed = stats.map(p => ({
    ...p,
    w: tab === 'overall' ? p.wins   : p.byGame[tab as GameType].wins,
    l: tab === 'overall' ? p.losses : p.byGame[tab as GameType].losses,
    d: tab === 'overall' ? p.draws  : p.byGame[tab as GameType].draws,
    g: tab === 'overall' ? p.totalGames
       : p.byGame[tab as GameType].wins + p.byGame[tab as GameType].losses + p.byGame[tab as GameType].draws,
  })).sort((a, b) => b.w - a.w);

  const medals = ['🥇','🥈','🥉'];

  // Head-to-head: Ronit vs Radhika
  const ronit   = stats.find(p => p.email === 'sinharonitraj@gmail.com');
  const radhika = stats.find(p => p.email === 'radhikadidwania567@gmail.com');
  const ronitH2H   = ronit   ? getH2HWins(rawRows, ronit.email,   radhika?.email ?? '') : 0;
  const radhikaH2H = radhika ? getH2HWins(rawRows, radhika.email, ronit?.email   ?? '') : 0;
  const totalDraws = rawRows.filter(
    r => r.result === 'draw' &&
         ((r.player_email === ronit?.email   && r.opponent_email === radhika?.email) ||
          (r.player_email === radhika?.email && r.opponent_email === ronit?.email))
  ).length;
  const ronitStreak   = getWinStreak(rawRows, ronit?.email   ?? '');
  const radhikaStreak = getWinStreak(rawRows, radhika?.email ?? '');

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
            <ArrowLeft size={20}/> Back
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            🏆 Leaderboard
          </h1>
          <button onClick={fetchStats} className="glass-btn p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-yellow-500 transition">
            <RefreshCw size={18}/>
          </button>
        </div>

        {/* Game filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          <button onClick={() => setTab('overall')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              tab === 'overall'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md'
                : 'glass text-gray-600 dark:text-gray-400'
            }`}>⭐ Overall</button>
          {GAME_TYPES.map(g => (
            <button key={g} onClick={() => setTab(g)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                tab === g
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md'
                  : 'glass text-gray-600 dark:text-gray-400'
              }`}>
              <span className={GAME_META[g].color}>{GAME_META[g].icon}</span>
              {GAME_META[g].label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-yellow-500"/>
          </div>
        )}
        {error && <div className="glass-card p-4 text-sm text-red-500 text-center">{error}</div>}

        {!loading && !error && (
          <div className="space-y-3">

            {/* Player ranking cards */}
            {displayed.map((p, i) => (
              <div key={p.email} className={`glass-card p-4 flex items-center gap-4 ${
                i === 0 && p.w > 0 ? 'ring-2 ring-yellow-400/60' : ''
              }`}>
                <div className="text-2xl w-8 text-center shrink-0">
                  {i < 3 && p.g > 0 ? medals[i] : <span className="text-gray-400 text-sm font-bold">#{i+1}</span>}
                </div>
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-xl shrink-0">
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white">{p.name}</p>
                  <div className="flex gap-3 text-xs mt-0.5">
                    <span className="text-green-500 font-semibold">{p.w}W</span>
                    <span className="text-red-400">{p.l}L</span>
                    <span className="text-gray-400">{p.d}D</span>
                    <span className="text-gray-400">{p.g} games</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-yellow-500">
                    {p.g > 0 ? `${Math.round((p.w / p.g) * 100)}%` : '—'}
                  </p>
                  <p className="text-xs text-gray-400">win rate</p>
                </div>
              </div>
            ))}

            {/* ─── Head-to-Head ─── */}
            {tab === 'overall' && ronit && radhika && (
              <div className="glass-card p-5 mt-2">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 text-center">⚔️ Head-to-Head: Ronit vs Radhika</h3>
                <div className="flex items-center justify-between">

                  <div className="text-center">
                    <p className="text-3xl mb-1">{ronit.emoji}</p>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">Ronit</p>
                    <p className="text-3xl font-bold text-green-500 mt-1">{ronitH2H}</p>
                    <p className="text-xs text-gray-400">wins vs her</p>
                    {ronitStreak > 1 && (
                      <div className="mt-1 flex items-center justify-center gap-1 text-xs text-orange-500 font-semibold">
                        <Flame size={11}/> {ronitStreak} streak
                      </div>
                    )}
                  </div>

                  <div className="text-center px-4">
                    <p className="text-gray-400 font-bold text-2xl">VS</p>
                    <p className="text-xs text-gray-400 mt-2">{totalDraws} draw{totalDraws !== 1 ? 's' : ''}</p>
                    <div className="mt-2 flex items-center justify-center gap-1 text-xs text-pink-400">
                      <Zap size={11}/> {ronitH2H + radhikaH2H + totalDraws} played
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-3xl mb-1">{radhika.emoji}</p>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">Radhika</p>
                    <p className="text-3xl font-bold text-green-500 mt-1">{radhikaH2H}</p>
                    <p className="text-xs text-gray-400">wins vs him</p>
                    {radhikaStreak > 1 && (
                      <div className="mt-1 flex items-center justify-center gap-1 text-xs text-orange-500 font-semibold">
                        <Flame size={11}/> {radhikaStreak} streak
                      </div>
                    )}
                  </div>

                </div>

                {(ronitH2H + radhikaH2H) > 0 && (
                  <div className="mt-4">
                    <div className="h-2 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-full transition-all"
                        style={{ width: `${(ronitH2H / (ronitH2H + radhikaH2H)) * 100}%` }} />
                      <div className="bg-gradient-to-r from-pink-400 to-pink-500 h-full transition-all"
                        style={{ width: `${(radhikaH2H / (ronitH2H + radhikaH2H)) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span className="text-blue-400">👨‍💻 Ronit {Math.round((ronitH2H / (ronitH2H + radhikaH2H)) * 100)}%</span>
                      <span className="text-pink-400">Radhika {Math.round((radhikaH2H / (ronitH2H + radhikaH2H)) * 100)}% 👩‍🎤</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── Game Breakdown ─── */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">📊 Game Breakdown</h3>
              <div className="space-y-2">
                {GAME_TYPES.map(g => (
                  <div key={g} className="flex items-center gap-3">
                    <span className={`${GAME_META[g].color} shrink-0`}>{GAME_META[g].icon}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 w-36 shrink-0">{GAME_META[g].label}</span>
                    <div className="flex-1 flex gap-3">
                      {displayed.map(p => (
                        <div key={p.email} className="flex items-center gap-1">
                          <span className="text-xs">{p.emoji}</span>
                          <span className="text-xs font-semibold text-green-500">{p.byGame[g].wins}W</span>
                          <span className="text-xs text-red-400">{p.byGame[g].losses}L</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
