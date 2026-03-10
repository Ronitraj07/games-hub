import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, RefreshCw, Loader2, Swords, Brain, Grid3x3, Hash, Gamepad2, HelpCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ALLOWED_EMAILS, getDisplayNameFromEmail, getPlayerEmoji } from '@/lib/auth-config';

// ─── types ───
type GameType = 'trivia' | 'rps' | 'memorymatch' | 'tictactoe' | 'connect4' | 'wordguess';

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

interface Row {
  player_email: string;
  result:       string;
  score:        number;
  game_type:    GameType;
}

const GAME_META: Record<GameType, { label: string; icon: React.ReactNode; color: string }> = {
  trivia:      { label: 'Trivia',        icon: <HelpCircle size={16}/>,  color: 'text-pink-500'   },
  rps:         { label: 'Rock Paper ✂',  icon: <Swords size={16}/>,      color: 'text-orange-500' },
  memorymatch: { label: 'Memory Match',  icon: <Brain size={16}/>,       color: 'text-blue-500'   },
  tictactoe:   { label: 'Tic-Tac-Toe',  icon: <Hash size={16}/>,         color: 'text-green-500'  },
  connect4:    { label: 'Connect 4',     icon: <Grid3x3 size={16}/>,     color: 'text-yellow-500' },
  wordguess:   { label: 'Word Guess',    icon: <Gamepad2 size={16}/>,    color: 'text-purple-500' },
};

const GAME_TYPES = Object.keys(GAME_META) as GameType[];

const emptyByGame = (): Record<GameType, { wins: number; losses: number; draws: number }> =>
  Object.fromEntries(GAME_TYPES.map(g => [g, { wins: 0, losses: 0, draws: 0 }])) as any;

const buildStats = (rows: Row[]): PlayerStat[] => {
  const map: Record<string, PlayerStat> = {};

  // seed all known players even with 0 games
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

export const Leaderboard: React.FC = () => {
  const [stats,   setStats]   = useState<PlayerStat[]>([]);
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
      .select('player_email, result, score, game_type')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (err) { setError(err.message); setLoading(false); return; }
    setStats(buildStats((data ?? []) as Row[]));
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

        {error && (
          <div className="glass-card p-4 text-sm text-red-500 text-center">{error}</div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {displayed.map((p, i) => (
              <div key={p.email} className={`glass-card p-4 flex items-center gap-4 ${
                i === 0 && p.w > 0 ? 'ring-2 ring-yellow-400/60' : ''
              }`}>
                {/* Rank */}
                <div className="text-2xl w-8 text-center shrink-0">
                  {i < 3 && p.g > 0 ? medals[i] : <span className="text-gray-400 text-sm font-bold">#{i+1}</span>}
                </div>

                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-xl shrink-0">
                  {p.emoji}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white">{p.name}</p>
                  <div className="flex gap-3 text-xs mt-0.5">
                    <span className="text-green-500 font-semibold">{p.w}W</span>
                    <span className="text-red-400">{p.l}L</span>
                    <span className="text-gray-400">{p.d}D</span>
                    <span className="text-gray-400">{p.g} games</span>
                  </div>
                </div>

                {/* Win rate */}
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-yellow-500">
                    {p.g > 0 ? `${p.g > 0 ? Math.round((p.w / p.g) * 100) : 0}%` : '—'}
                  </p>
                  <p className="text-xs text-gray-400">win rate</p>
                </div>
              </div>
            ))}

            {/* Head-to-head summary */}
            {tab === 'overall' && stats.length >= 2 && (() => {
              const [p1, p2] = stats;
              const h2h = [p1, p2].map(p => ({
                ...p,
                vsWins: stats.find(x => x.email !== p.email)
                  ? 0 : 0, // placeholder — wins vs specific opponent
              }));
              return (
                <div className="glass-card p-4 mt-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 text-center">⚔️ Head-to-Head</h3>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-2xl">{p1.emoji}</p>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{p1.name}</p>
                      <p className="text-2xl font-bold text-green-500">{p1.wins}</p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-xs text-gray-400 mb-1">Total Wins</p>
                      <p className="text-gray-400 font-bold text-xl">VS</p>
                      <p className="text-xs text-gray-400 mt-1">{p1.draws} draws</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl">{p2.emoji}</p>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{p2.name}</p>
                      <p className="text-2xl font-bold text-green-500">{p2.wins}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Score breakdown by game */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">📊 Game Breakdown</h3>
              <div className="space-y-2">
                {GAME_TYPES.map(g => {
                  const row = displayed;
                  return (
                    <div key={g} className="flex items-center gap-3">
                      <span className={`${GAME_META[g].color} shrink-0`}>{GAME_META[g].icon}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 w-28 shrink-0">{GAME_META[g].label}</span>
                      <div className="flex-1 flex gap-2">
                        {row.map(p => (
                          <div key={p.email} className="flex items-center gap-1">
                            <span className="text-xs">{p.emoji}</span>
                            <span className="text-xs font-semibold text-green-500">{p.byGame[g].wins}W</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
