// Game History
export interface GameHistory {
  id: string;
  gameType: string;
  player1Email: string;
  player2Email: string;
  winnerEmail?: string;
  gameData?: Record<string, any>;
  durationSeconds?: number;
  playedAt: string;
}

// Player Stats
export interface PlayerStats {
  userEmail: string;
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  favoriteGame?: string;
  totalPlaytimeSeconds: number;
  achievements: string[];
  createdAt: string;
  updatedAt: string;
}

// Leaderboard
export interface LeaderboardEntry {
  userEmail: string;
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  winRate: number;
  favoriteGame?: string;
  totalPlaytimeSeconds: number;
}

// Game Card
export interface GameCard {
  id: string;
  title: string;
  description: string;
  category: 'simple' | 'heavy';
  players: '2';
  thumbnail: string;
  route: string;
}

// Presence
export interface UserPresence {
  userId: string;
  email: string;
  status: 'online' | 'offline' | 'in-game';
  lastSeen: number;
  currentGame?: string;
}