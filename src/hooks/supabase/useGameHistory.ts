import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface GameHistoryEntry {
  id: string;
  game_type: string;
  player_1_email: string;
  player_2_email: string;
  winner_email: string | null;
  game_data: any;
  duration_seconds: number | null;
  created_at: string;
}

export const useGameHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchHistory = async () => {
    // Guard: skip if Supabase not configured or user not logged in
    if (!user?.email || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('game_history')
        .select('*')
        .or(`player_1_email.eq.${user.email},player_2_email.eq.${user.email}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;
      setHistory(data || []);
    } catch (err: any) {
      setError(err.message);
      console.warn('[useGameHistory] fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [user?.email]);

  const addGameToHistory = async (
    gameType: string,
    player2Email: string,
    winnerEmail: string | null,
    gameData: any,
    durationSeconds: number | null = null
  ) => {
    if (!user?.email || !isSupabaseConfigured()) return;

    const { error } = await supabase
      .from('game_history')
      .insert([{
        game_type:        gameType,
        player_1_email:   user.email,
        player_2_email:   player2Email,
        winner_email:     winnerEmail,
        game_data:        gameData,
        duration_seconds: durationSeconds,
      }] as any) as any;

    if (error) throw error;
    await updatePlayerStats(winnerEmail, gameType);
    await fetchHistory();
  };

  const updatePlayerStats = async (winnerEmail: string | null, gameType = 'Unknown') => {
    if (!user?.email || !isSupabaseConfigured()) return;

    // Use .maybeSingle() — .single() throws 404 when no row exists yet
    const { data: existing } = await supabase
      .from('player_stats')
      .select('*')
      .eq('email', user.email)
      .maybeSingle() as any;

    const isWin  = winnerEmail === user.email;
    const isDraw = winnerEmail === null;

    const updatedStats: any = {
      total_games_played: (existing?.total_games_played || 0) + 1,
      total_wins:         (existing?.total_wins         || 0) + (isWin  ? 1 : 0),
      total_losses:       (existing?.total_losses       || 0) + (!isWin && !isDraw ? 1 : 0),
      total_draws:        (existing?.total_draws        || 0) + (isDraw ? 1 : 0),
      favorite_game:      gameType,
      updated_at:         new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from('player_stats')
        .update(updatedStats)
        .eq('email', user.email);
    } else {
      await supabase
        .from('player_stats')
        .insert([{ email: user.email, ...updatedStats }]);
    }
  };

  return { history, loading, error, addGameToHistory, refetch: fetchHistory };
};
