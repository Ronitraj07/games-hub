/**
 * useRivalryStats
 * ---------------
 * Fetches head-to-head rivalry data between the logged-in player and their partner.
 * Uses game_results table (same as Leaderboard).
 *
 * Returns:
 *   - h2h:         per-player wins/losses/draws against each other
 *   - currentStreak: { player, count } — who is on a streak right now and how long
 *   - bestStreak:    { player, count } — best all-time streak
 *   - lastPlayed:    Record<gameType, Date> — most recent game per type (for Home cards)
 *   - totalH2HGames: total games played between the two
 */

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getPartnerEmail, getDisplayNameFromEmail } from '@/lib/auth-config';

export interface H2HRecord {
  email:    string;
  name:     string;
  wins:     number;
  losses:   number;
  draws:    number;
}

export interface StreakInfo {
  email: string;
  name:  string;
  count: number;
}

export interface RivalryStats {
  me:              H2HRecord;
  partner:         H2HRecord | null;
  currentStreak:   StreakInfo | null;   // who has active streak RIGHT NOW
  bestStreak:      StreakInfo | null;   // all-time best streak (either player)
  lastPlayed:      Record<string, Date | null>;
  totalH2HGames:   number;
  loading:         boolean;
  error:           string | null;
  refetch:         () => void;
}

interface RawRow {
  player_email:   string;
  opponent_email: string | null;
  result:         string;
  game_type:      string;
  created_at:     string;
  score?:         number;
}

/** Compute current win streak for email from newest-first sorted rows */
const computeCurrentStreak = (rows: RawRow[], email: string): number => {
  const mine = rows.filter(r => r.player_email === email);
  let streak = 0;
  for (const r of mine) {
    if (r.result === 'win') streak++;
    else break;
  }
  return streak;
};

/** Compute best ever win streak for email from newest-first sorted rows */
const computeBestStreak = (rows: RawRow[], email: string): number => {
  const mine = rows.filter(r => r.player_email === email);
  // reverse to oldest-first for best-streak scan
  const asc = [...mine].reverse();
  let best = 0, cur = 0;
  for (const r of asc) {
    if (r.result === 'win') { cur++; best = Math.max(best, cur); }
    else cur = 0;
  }
  return best;
};

export const useRivalryStats = (): RivalryStats => {
  const { user } = useAuth();

  const myEmail      = user?.email ?? '';
  const partnerEmail = getPartnerEmail(myEmail);
  const myName       = getDisplayNameFromEmail(myEmail);
  const partnerName  = partnerEmail ? getDisplayNameFromEmail(partnerEmail) : null;

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [rows,    setRows]    = useState<RawRow[]>([]);

  const fetchRows = async () => {
    if (!myEmail || !isSupabaseConfigured()) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const emails = [myEmail, ...(partnerEmail ? [partnerEmail] : [])];
      const { data, error: err } = await supabase
        .from('game_results')
        .select('player_email, opponent_email, result, game_type, created_at, score')
        .in('player_email', emails)
        .order('created_at', { ascending: false })
        .limit(500);
      if (err) throw err;
      setRows((data ?? []) as RawRow[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(); }, [myEmail]);

  // ── Derive all stats from raw rows ──

  // H2H: only rows where the two played AGAINST each other
  const h2hRows = partnerEmail
    ? rows.filter(r =>
        (r.player_email === myEmail      && r.opponent_email === partnerEmail) ||
        (r.player_email === partnerEmail && r.opponent_email === myEmail)
      )
    : [];

  const myH2HWins    = h2hRows.filter(r => r.player_email === myEmail      && r.result === 'win').length;
  const myH2HLosses  = h2hRows.filter(r => r.player_email === myEmail      && r.result === 'loss').length;
  const myH2HDraws   = h2hRows.filter(r => r.player_email === myEmail      && r.result === 'draw').length;
  const ptnH2HWins   = h2hRows.filter(r => r.player_email === partnerEmail && r.result === 'win').length;
  const ptnH2HLosses = h2hRows.filter(r => r.player_email === partnerEmail && r.result === 'loss').length;
  const ptnH2HDraws  = h2hRows.filter(r => r.player_email === partnerEmail && r.result === 'draw').length;

  const me: H2HRecord = {
    email: myEmail, name: myName,
    wins: myH2HWins, losses: myH2HLosses, draws: myH2HDraws,
  };

  const partner: H2HRecord | null = partnerEmail && partnerName ? {
    email: partnerEmail, name: partnerName,
    wins: ptnH2HWins, losses: ptnH2HLosses, draws: ptnH2HDraws,
  } : null;

  // Streaks (overall, not just H2H)
  const myCurrentStreak  = computeCurrentStreak(rows, myEmail);
  const ptnCurrentStreak = partnerEmail ? computeCurrentStreak(rows, partnerEmail) : 0;
  const myBestStreak     = computeBestStreak(rows, myEmail);
  const ptnBestStreak    = partnerEmail ? computeBestStreak(rows, partnerEmail) : 0;

  const currentStreak: StreakInfo | null =
    myCurrentStreak > 0 || ptnCurrentStreak > 0
      ? myCurrentStreak >= ptnCurrentStreak
        ? { email: myEmail,      name: myName,           count: myCurrentStreak  }
        : { email: partnerEmail!, name: partnerName!,     count: ptnCurrentStreak }
      : null;

  const bestStreak: StreakInfo | null =
    myBestStreak > 0 || ptnBestStreak > 0
      ? myBestStreak >= ptnBestStreak
        ? { email: myEmail,      name: myName,           count: myBestStreak  }
        : { email: partnerEmail!, name: partnerName!,     count: ptnBestStreak }
      : null;

  // Last played per game type (all my games, not just H2H)
  const lastPlayed: Record<string, Date | null> = {};
  for (const r of rows) {
    if (r.player_email !== myEmail) continue;
    if (!lastPlayed[r.game_type]) {
      lastPlayed[r.game_type] = new Date(r.created_at);
    }
  }

  return {
    me, partner,
    currentStreak, bestStreak,
    lastPlayed,
    totalH2HGames: h2hRows.length / 2, // each game produces 2 rows (one per player)
    loading, error,
    refetch: fetchRows,
  };
};
