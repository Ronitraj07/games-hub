export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'streak' | 'mastery' | 'special';
  earnedDate?: string;
}

export interface EarnedAchievement extends Achievement {
  earnedDate: string;
  progress?: number; // 0-100 for progress-based achievements
}

// All available achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Early Milestones
  {
    id: 'first-victory',
    name: 'First Victory',
    description: 'Win your first game',
    icon: '🎖️',
    category: 'milestone',
  },
  {
    id: 'ten-wins',
    name: 'Rising Champion',
    description: 'Reach 10 wins',
    icon: '⭐',
    category: 'milestone',
  },
  {
    id: 'fifty-wins',
    name: 'Victory Master',
    description: 'Reach 50 wins',
    icon: '👑',
    category: 'milestone',
  },
  {
    id: 'hundred-games',
    name: 'Dedicated Player',
    description: 'Play 100 games',
    icon: '🎯',
    category: 'milestone',
  },

  // Streaks
  {
    id: 'three-streak',
    name: 'On Fire! 🔥',
    description: 'Get a 3-game win streak',
    icon: '🔥',
    category: 'streak',
  },
  {
    id: 'five-streak',
    name: 'Unstoppable',
    description: 'Get a 5-game win streak',
    icon: '⚡',
    category: 'streak',
  },
  {
    id: 'ten-streak',
    name: 'Legendary',
    description: 'Get a 10-game win streak',
    icon: '💫',
    category: 'streak',
  },

  // Game Mastery
  {
    id: 'game-master-trivia',
    name: 'Trivia Master',
    description: 'Win 10 Trivia games',
    icon: '🧠',
    category: 'mastery',
  },
  {
    id: 'game-master-connect4',
    name: 'Connect Master',
    description: 'Win 10 Connect4 games',
    icon: '🔵',
    category: 'mastery',
  },
  {
    id: 'game-master-pictionary',
    name: 'Artist',
    description: 'Win 10 Pictionary games',
    icon: '🎨',
    category: 'mastery',
  },
  {
    id: 'all-games-played',
    name: 'Game Connoisseur',
    description: 'Play all 9 games',
    icon: '🎮',
    category: 'mastery',
  },

  // Special Achievements
  {
    id: 'perfect-trivia',
    name: 'Perfect Score',
    description: 'Get 10/10 on Trivia',
    icon: '👌',
    category: 'special',
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete a game in under 1 minute',
    icon: '⚡',
    category: 'special',
  },
  {
    id: 'love-expert',
    name: 'Love Expert',
    description: 'Win 5 TruthOrDare games',
    icon: '💕',
    category: 'special',
  },
  {
    id: 'balanced-player',
    name: 'Balanced Player',
    description: 'Win in 5 different game types',
    icon: '⚖️',
    category: 'special',
  },

  // Scrabble
  {
    id: 'scrabble-master',
    name: 'Word Master',
    description: 'Win 5 Scrabble games',
    icon: '📝',
    category: 'mastery',
  },
  {
    id: 'high-scorer',
    name: 'High Scorer',
    description: 'Score over 500 points in Scrabble',
    icon: '🔥',
    category: 'special',
  },
  {
    id: 'couples-collaborator',
    name: 'Team Effort',
    description: 'Get 3+ couple bonuses in a Scrabble series',
    icon: '🤝',
    category: 'special',
  },

  // Pictionary Series
  {
    id: 'pictionary-perfectionist',
    name: 'Perfect Series',
    description: 'Win a perfect Pictionary series',
    icon: '🎨',
    category: 'mastery',
  },
  {
    id: 'quick-guesser',
    name: 'Speed Reader',
    description: 'Guess all Pictionary drawings in under 10 seconds each',
    icon: '👀',
    category: 'special',
  },
  {
    id: 'artist-streak',
    name: "Artist's Streak",
    description: 'Win 3+ rounds as the drawer in a series',
    icon: '✏️',
    category: 'streak',
  },

  // Story Builder
  {
    id: 'storyteller',
    name: 'First Tale',
    description: 'Complete your first collaborative story',
    icon: '📖',
    category: 'milestone',
  },
  {
    id: 'prolific-writer',
    name: 'Prolific Author',
    description: 'Complete 10 collaborative stories',
    icon: '📚',
    category: 'mastery',
  },
  {
    id: 'category-collector',
    name: 'Genre Master',
    description: 'Complete 1 story in each category (Romantic, Adventure, Mystery, Comedy)',
    icon: '🌈',
    category: 'special',
  },

  // Detective
  {
    id: 'detective',
    name: 'Case Detective',
    description: 'Solve your first mystery',
    icon: '🔎',
    category: 'milestone',
  },
  {
    id: 'case-closed',
    name: 'Master Detective',
    description: 'Solve 5 mysteries',
    icon: '🕵️',
    category: 'mastery',
  },
  {
    id: 'perfect-investigator',
    name: 'Flawless Investigation',
    description: 'Achieve 100% accuracy on a hard difficulty mystery',
    icon: '💎',
    category: 'special',
  },

  // Kissing Wheel
  {
    id: 'daredevil',
    name: 'Daredevil',
    description: 'Complete 10 dares from the wheel',
    icon: '😈',
    category: 'mastery',
  },
  {
    id: 'spice-lover',
    name: 'Adventure Seeker',
    description: 'Opt-in to spicy content and complete 5 spicy dares',
    icon: '🌶️',
    category: 'special',
  },
  {
    id: 'daily-player',
    name: 'Daily Devotion',
    description: 'Complete 7 daily challenges',
    icon: '🎯',
    category: 'streak',
  },
];

export const ACHIEVEMENT_BY_ID = ACHIEVEMENTS.reduce((acc, a) => {
  acc[a.id] = a;
  return acc;
}, {} as Record<string, Achievement>);
