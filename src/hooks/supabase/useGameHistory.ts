import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../shared/useAuth';

interface GameHistoryEntry {
  id: string;
  game_type: string;
  player_1_email: string;
  player_2_email: string;
  winner_email: string | null;
  game_data: any;
  duration_seconds: number | null;
  played_at: string;
}

export const useGameHistory = (gameType?: string) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('game_history')
        .select('*')
        .or(`player_1_email.eq.${user.email},player_2_email.eq.${user.email}`)
        .order('played_at', { ascending: false })
        .limit(50);

      if (gameType) {
        query = query.eq('game_type', gameType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setHistory(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch game history');
      console.error('Game history fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.email, gameType]);

  const saveGame = async (
    gameType: string,
    player1Email: string,
    player2Email: string,
    winnerEmail: string | null,
    gameData: any,
    durationSeconds?: number
  ) => {
    const { data, error: saveError } = await supabase
      .from('game_history')
      .insert({
        game_type: gameType,
        player_1_email: player1Email,
        player_2_email: player2Email,
        winner_email: winnerEmail,
        game_data: gameData,
        duration_seconds: durationSeconds || null,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Update player stats
    await updatePlayerStats(player1Email, gameType, winnerEmail === player1Email, winnerEmail === null);
    await updatePlayerStats(player2Email, gameType, winnerEmail === player2Email, winnerEmail === null);

    await fetchHistory();
    return data;
  };

  const updatePlayerStats = async (
    playerEmail: string,
    gameType: string,
    isWinner: boolean,
    isDraw: boolean
  ) => {
    // Fetch current stats
    const { data: currentStats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_email', playerEmail)
      .single();

    if (!currentStats) return;

    // Calculate updates
    const updates = {
      total_games_played: currentStats.total_games_played + 1,
      total_wins: currentStats.total_wins + (isWinner ? 1 : 0),
      total_losses: currentStats.total_losses + (!isWinner && !isDraw ? 1 : 0),
      total_draws: currentStats.total_draws + (isDraw ? 1 : 0),
      favorite_game: gameType, // Simplified: last played game
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from('player_stats')
      .update(updates)
      .eq('user_email', playerEmail);
  };

  return {
    history,
    loading,
    error,
    saveGame,
    refetch: fetchHistory,
  };
};
