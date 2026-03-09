import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!user?.email) return;

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.email]);

  const addGameToHistory = async (
    gameType: string,
    player2Email: string,
    winnerEmail: string | null,
    gameData: any,
    durationSeconds: number | null = null
  ) => {
    if (!user?.email) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('game_history')
      .insert([{
        game_type: gameType,
        player_1_email: user.email,
        player_2_email: player2Email,
        winner_email: winnerEmail,
        game_data: gameData,
        duration_seconds: durationSeconds
      }] as any) as any;

    if (error) throw error;

    await updatePlayerStats(winnerEmail);
    await fetchHistory();
  };

  const updatePlayerStats = async (winnerEmail: string | null) => {
    if (!user?.email) return;

    const { data: existingStats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('email', user.email)
      .single() as any;

    const isWin = winnerEmail === user.email;
    const isDraw = winnerEmail === null;

    const updatedStats: any = {
      total_games_played: (existingStats?.total_games_played || 0) + 1,
      total_wins: (existingStats?.total_wins || 0) + (isWin ? 1 : 0),
      total_losses: (existingStats?.total_losses || 0) + (!isWin && !isDraw ? 1 : 0),
      total_draws: (existingStats?.total_draws || 0) + (isDraw ? 1 : 0),
      favorite_game: 'TicTacToe',
      updated_at: new Date().toISOString()
    };

    if (existingStats) {
      await supabase
        .from('player_stats')
        .update(updatedStats as any)
        .eq('email', user.email) as any;
    } else {
      await supabase
        .from('player_stats')
        .insert([{ email: user.email, ...updatedStats }]);
    }
  };

  return {
    history,
    loading,
    error,
    addGameToHistory,
    refetch: fetchHistory
  };
};