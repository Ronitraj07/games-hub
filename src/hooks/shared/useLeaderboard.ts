import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface LeaderboardEntry {
  user_email: string;
  total_games_played: number;
  total_wins: number;
  total_losses: number;
  total_draws: number;
  win_rate: number;
  favorite_game: string | null;
  total_playtime_seconds: number;
}

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('leaderboard')
        .select('*');

      if (fetchError) throw fetchError;
      setLeaderboard(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return {
    leaderboard,
    loading,
    error,
    refetch: fetchLeaderboard,
  };
};
