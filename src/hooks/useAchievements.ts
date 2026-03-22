import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { EarnedAchievement, ACHIEVEMENTS } from '@/types/achievements.types';

export const useAchievements = () => {
  const { user } = useAuth();
  const [earned, setEarned] = useState<EarnedAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetchAchievements = async () => {
      try {
        const { data: userResults } = await supabase
          .from('game_results')
          .select('*')
          .eq('player_email', user.email);

        if (!userResults) {
          setEarned([]);
          setLoading(false);
          return;
        }

        const earnedAchievements: EarnedAchievement[] = [];

        // Calculate each achievement
        ACHIEVEMENTS.forEach((achievement) => {
          let isEarned = false;
          let earnDate = '';

          switch (achievement.id) {
            // Milestones
            case 'first-victory':
              if (userResults.some((r: any) => r.result === 'win')) {
                isEarned = true;
                earnDate = new Date(
                  Math.min(...userResults
                    .filter((r: any) => r.result === 'win')
                    .map((r: any) => new Date(r.created_at).getTime()))
                ).toISOString();
              }
              break;

            case 'ten-wins':
              if (userResults.filter((r: any) => r.result === 'win').length >= 10) {
                isEarned = true;
              }
              break;

            case 'fifty-wins':
              if (userResults.filter((r: any) => r.result === 'win').length >= 50) {
                isEarned = true;
              }
              break;

            case 'hundred-games':
              if (userResults.length >= 100) {
                isEarned = true;
              }
              break;

            // Streaks (calculate longest win streak)
            case 'three-streak': {
              const streak = calculateLongestStreak(userResults);
              if (streak >= 3) {
                isEarned = true;
              }
              break;
            }

            case 'five-streak': {
              const streak = calculateLongestStreak(userResults);
              if (streak >= 5) {
                isEarned = true;
              }
              break;
            }

            case 'ten-streak': {
              const streak = calculateLongestStreak(userResults);
              if (streak >= 10) {
                isEarned = true;
              }
              break;
            }

            // Game Mastery
            case 'game-master-trivia':
              if (userResults.filter((r: any) => r.game_type === 'trivia' && r.result === 'win').length >= 10) {
                isEarned = true;
              }
              break;

            case 'game-master-connect4':
              if (userResults.filter((r: any) => r.game_type === 'connect4' && r.result === 'win').length >= 10) {
                isEarned = true;
              }
              break;

            case 'game-master-pictionary':
              if (userResults.filter((r: any) => r.game_type === 'pictionary' && r.result === 'win').length >= 10) {
                isEarned = true;
              }
              break;

            case 'all-games-played': {
              const gameTypes = new Set(userResults.map((r: any) => r.game_type));
              if (gameTypes.size >= 9) {
                isEarned = true;
              }
              break;
            }

            // Special
            case 'perfect-trivia':
              if (userResults.some((r: any) => r.game_type === 'trivia' && r.score === 150)) {
                isEarned = true;
                earnDate = new Date(
                  Math.min(...userResults
                    .filter((r: any) => r.game_type === 'trivia' && r.score === 150)
                    .map((r: any) => new Date(r.created_at).getTime()))
                ).toISOString();
              }
              break;

            case 'speed-demon':
              // Placeholder: could track game duration from results
              break;

            case 'love-expert':
              if (userResults.filter((r: any) => r.game_type === 'truthordare' && r.result === 'win').length >= 5) {
                isEarned = true;
              }
              break;

            case 'balanced-player': {
              const winTypes = new Set(
                userResults
                  .filter((r: any) => r.result === 'win')
                  .map((r: any) => r.game_type)
              );
              if (winTypes.size >= 5) {
                isEarned = true;
              }
              break;
            }
          }

          if (isEarned) {
            earnedAchievements.push({
              ...achievement,
              earnedDate: earnDate || new Date().toISOString(),
            });
          }
        });

        setEarned(earnedAchievements);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching achievements:', error);
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [user?.email]);

  return { earned, loading, allAchievements: ACHIEVEMENTS };
};

// Helper: Calculate longest consecutive win streak
const calculateLongestStreak = (results: any[]): number => {
  if (results.length === 0) return 0;

  // Sort by date descending (newest first)
  const sorted = [...results].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  let maxStreak = 0;
  let currentStreak = 0;

  for (const result of sorted) {
    if (result.result === 'win') {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
};

