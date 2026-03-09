import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from './useAuth';

interface PlayerStats {
  user_email: string;
  total_games_played: number;
  total_wins: number;
  total_losses: number;
  total_draws: number;
  favorite_game: string | null;
  total_playtime_seconds: number;
  achievements: any[];
  created_at: string;
  updated_at: string;
}

export const usePlayerStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_email', user.email)
        .single();

      if (fetchError) throw fetchError;
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch player stats');
      console.error('Player stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.email]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};
