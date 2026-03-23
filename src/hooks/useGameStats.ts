import { useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getDisplayNameFromEmail } from '@/lib/auth-config';

// Fix: added 'truthordare' so TruthOrDare games are persisted correctly
export type GameType   = 'trivia' | 'rps' | 'memorymatch' | 'tictactoe' | 'connect4' | 'wordscramble' | 'pictionary' | 'mathduel' | 'truthordare' | 'scrabble' | 'storybuilder' | 'kissingwheel';
export type GameResult = 'win' | 'loss' | 'draw';
export type GameMode   = 'solo' | 'vs-partner' | 'vs-ai';

export interface RecordGameParams {
  gameType:       GameType;
  playerEmail:    string;
  result:         GameResult;
  score?:         number;
  opponentEmail?: string;
  mode?:          GameMode;
}

/** Call this once at the end of every game to persist the result to Supabase. */
export const useGameStats = () => {
  const recordGame = useCallback(async (params: RecordGameParams) => {
    if (!isSupabaseConfigured()) return;
    const { gameType, playerEmail, result, score = 0, opponentEmail, mode = 'solo' } = params;
    try {
      await supabase.from('game_results').insert({
        game_type:      gameType,
        player_email:   playerEmail,
        player_name:    getDisplayNameFromEmail(playerEmail),
        result,
        score,
        opponent_email: opponentEmail ?? null,
        opponent_name:  opponentEmail ? getDisplayNameFromEmail(opponentEmail) : null,
        mode,
      });
    } catch (e) {
      console.warn('[useGameStats] Failed to record:', e);
    }
  }, []);

  return { recordGame };
};
