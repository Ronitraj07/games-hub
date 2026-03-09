// Supabase Database Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      allowed_emails: {
        Row: {
          email: string;
          name: string;
          added_at: string;
        };
        Insert: {
          email: string;
          name: string;
          added_at?: string;
        };
        Update: {
          email?: string;
          name?: string;
          added_at?: string;
        };
      };
      characters: {
        Row: {
          id: string;
          user_id: string;
          user_email: string;
          name: string;
          class: string;
          level: number;
          experience: number;
          health: number;
          max_health: number;
          mana: number;
          max_mana: number;
          stamina: number;
          max_stamina: number;
          gold: number;
          stats: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_email: string;
          name: string;
          class: string;
          level?: number;
          experience?: number;
          health?: number;
          max_health?: number;
          mana?: number;
          max_mana?: number;
          stamina?: number;
          max_stamina?: number;
          gold?: number;
          stats?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_email?: string;
          name?: string;
          class?: string;
          level?: number;
          experience?: number;
          health?: number;
          max_health?: number;
          mana?: number;
          max_mana?: number;
          stamina?: number;
          max_stamina?: number;
          gold?: number;
          stats?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      game_history: {
        Row: {
          id: string;
          game_type: string;
          player_1_email: string;
          player_2_email: string;
          winner_email: string | null;
          game_data: Json | null;
          duration_seconds: number | null;
          played_at: string;
        };
        Insert: {
          id?: string;
          game_type: string;
          player_1_email: string;
          player_2_email: string;
          winner_email?: string | null;
          game_data?: Json | null;
          duration_seconds?: number | null;
          played_at?: string;
        };
        Update: {
          id?: string;
          game_type?: string;
          player_1_email?: string;
          player_2_email?: string;
          winner_email?: string | null;
          game_data?: Json | null;
          duration_seconds?: number | null;
          played_at?: string;
        };
      };
      player_stats: {
        Row: {
          user_email: string;
          total_games_played: number;
          total_wins: number;
          total_losses: number;
          total_draws: number;
          favorite_game: string | null;
          total_playtime_seconds: number;
          achievements: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_email: string;
          total_games_played?: number;
          total_wins?: number;
          total_losses?: number;
          total_draws?: number;
          favorite_game?: string | null;
          total_playtime_seconds?: number;
          achievements?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_email?: string;
          total_games_played?: number;
          total_wins?: number;
          total_losses?: number;
          total_draws?: number;
          favorite_game?: string | null;
          total_playtime_seconds?: number;
          achievements?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      leaderboard: {
        Row: {
          user_email: string;
          total_games_played: number;
          total_wins: number;
          total_losses: number;
          total_draws: number;
          win_rate: number;
          favorite_game: string | null;
          total_playtime_seconds: number;
        };
      };
    };
    Functions: {
      is_allowed_user: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      current_user_email: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
  };
}