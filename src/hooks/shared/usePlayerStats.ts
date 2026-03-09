import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  favoriteGame: string;
}

export const usePlayerStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlayerStats>({
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    favoriteGame: 'None'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('player_stats')
          .select('*')
          .eq('email', user.email)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (data) {
          setStats({
            totalGames: (data as any).total_games_played || 0,
            wins: (data as any).total_wins || 0,
            losses: (data as any).total_losses || 0,
            draws: (data as any).total_draws || 0,
            favoriteGame: (data as any).favorite_game || 'None'
          });
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.email]);

  return { stats, loading, error };
};
