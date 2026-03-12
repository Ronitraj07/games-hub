// ─────────────────────────────────────────────────────────────────────────────
// systems/achievementData.ts  —  All 40 achievement definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface Achievement {
  id:          string;
  title:       string;
  description: string;
  emoji:       string;
  xpReward:    number;
  secret:      boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── Exploration ──
  { id: 'first_steps',      title: 'First Steps',        description: 'Enter Meadow Haven for the first time',         emoji: '🌱', xpReward: 10,  secret: false },
  { id: 'island_2',         title: 'Ember Wanderer',     description: 'Discover Ember Hollow',                          emoji: '🍂', xpReward: 30,  secret: false },
  { id: 'island_3',         title: 'Petal Path',         description: 'Discover Sakura Drift',                          emoji: '🌸', xpReward: 30,  secret: false },
  { id: 'island_4',         title: 'Mountain Heart',     description: 'Discover Highland Reach',                        emoji: '⛰️',  xpReward: 30,  secret: false },
  { id: 'island_5',         title: 'Harbor Lights',      description: 'Discover Tidal Harbor',                          emoji: '🏮', xpReward: 30,  secret: false },
  { id: 'island_6',         title: 'Frostbound',         description: 'Discover Frostpeak Isle',                        emoji: '❄️',  xpReward: 30,  secret: false },
  { id: 'island_7',         title: 'Deep Treasure',      description: 'Discover Sunken Atoll',                          emoji: '🪸', xpReward: 30,  secret: false },
  { id: 'island_8',         title: 'Canopy Dancer',      description: 'Discover Verdant Canopy',                        emoji: '🌳', xpReward: 30,  secret: false },
  { id: 'island_9',         title: 'Through the Mist',   description: 'Discover Ashenveil Moor',                        emoji: '🌫️', xpReward: 30,  secret: false },
  { id: 'island_10',        title: 'Crystal Echo',       description: 'Discover Crystal Caverns',                       emoji: '💎', xpReward: 30,  secret: false },
  { id: 'island_11',        title: 'Storm Chasers',      description: 'Discover Stormwatch Bluff',                      emoji: '⚡', xpReward: 30,  secret: false },
  { id: 'all_islands',      title: 'World Explorers',    description: 'Visit all 12 islands together',                  emoji: '🗺️',  xpReward: 500, secret: false },
  { id: 'first_home',       title: 'Our Place',          description: 'Enter The Heartland for the first time',         emoji: '🏡', xpReward: 50,  secret: false },
  // ── Bond ──
  { id: 'bond_level_2',     title: 'Companions',         description: 'Reach Bond Level 2',                             emoji: '🤝', xpReward: 50,  secret: false },
  { id: 'bond_level_5',     title: 'Soulmates',          description: 'Reach Bond Level 5',                             emoji: '🦋', xpReward: 200, secret: false },
  { id: 'bond_level_10',    title: 'Heartbound Forever', description: 'Reach Bond Level 10',                            emoji: '⭐', xpReward: 500, secret: true  },
  // ── Couple interactions ──
  { id: 'first_hand_hold',  title: 'Linked Hearts',      description: 'Hold hands for the first time',                  emoji: '🫱', xpReward: 50,  secret: false },
  { id: 'walk_100m_hands',  title: 'Hand in Hand',       description: 'Walk 100 metres while holding hands',            emoji: '👫', xpReward: 75,  secret: false },
  { id: 'first_hug',        title: 'Warm Embrace',       description: 'Share your first hug',                           emoji: '🤗', xpReward: 40,  secret: false },
  { id: 'first_kiss',       title: 'First Kiss',         description: 'Share your first kiss',                          emoji: '💋', xpReward: 100, secret: false },
  { id: 'piggyback_100m',   title: 'Carried by Love',    description: 'Carry your partner 100 metres on your back',     emoji: '🫶', xpReward: 75,  secret: false },
  { id: 'dance_together',   title: 'Our Song',           description: 'Dance together for the first time',              emoji: '💃', xpReward: 60,  secret: false },
  { id: 'all_emotes',       title: 'Full Vocabulary',    description: 'Use every couple interaction at least once',     emoji: '🎭', xpReward: 150, secret: false },
  // ── Gathering ──
  { id: 'flower_10',        title: 'Budding Gardener',   description: 'Collect 10 flowers',                             emoji: '🌸', xpReward: 15,  secret: false },
  { id: 'flower_50',        title: 'Full Bloom',         description: 'Collect 50 flowers',                             emoji: '🌺', xpReward: 40,  secret: false },
  { id: 'first_crystal',    title: 'Gemstone Heart',     description: 'Collect your first crystal',                     emoji: '💎', xpReward: 25,  secret: false },
  { id: 'full_inventory',   title: 'Pack Rat',           description: 'Fill every inventory slot',                      emoji: '🎒', xpReward: 80,  secret: false },
  // ── Mini-games ──
  { id: 'first_fish',       title: 'Gone Fishing',       description: 'Catch your first fish',                          emoji: '🎣', xpReward: 20,  secret: false },
  { id: 'rare_fish',        title: 'Legendary Catch',    description: 'Catch a legendary fish',                         emoji: '🐟', xpReward: 100, secret: false },
  { id: 'first_meal',       title: 'Home-Cooked',        description: 'Cook your first meal together',                  emoji: '🍳', xpReward: 30,  secret: false },
  { id: 'stargaze',         title: 'Stargazers',         description: 'Complete a stargazing session together',         emoji: '🔭', xpReward: 50,  secret: false },
  { id: 'photo_10',         title: 'Memories Made',      description: 'Take 10 photos together',                        emoji: '📸', xpReward: 80,  secret: false },
  // ── Home ──
  { id: 'first_furniture',  title: 'Nesting',            description: 'Place your first piece of furniture',            emoji: '🪑', xpReward: 20,  secret: false },
  { id: 'furniture_20',     title: 'Interior Designers', description: 'Place 20 pieces of furniture',                  emoji: '🛋️',  xpReward: 60,  secret: false },
  // ── Daily ──
  { id: 'daily_7',          title: 'Consistent Love',    description: 'Complete daily challenges 7 days in a row',     emoji: '📅', xpReward: 120, secret: false },
  // ── Weather / world ──
  { id: 'watch_sunrise',    title: 'Golden Hour',        description: 'Watch a sunrise together',                       emoji: '🌅', xpReward: 40,  secret: true  },
  { id: 'survive_storm',    title: 'Storm Survivors',    description: 'Both players stay on Stormwatch Bluff for 5 min',emoji: '⛈️',  xpReward: 75,  secret: true  },
  { id: 'aurora_witness',   title: 'Northern Lights',    description: 'Watch the aurora together on Frostpeak Isle',   emoji: '🌌', xpReward: 60,  secret: true  },
  // ── Secret ──
  { id: 'night_swim',       title: 'Night Dippers',      description: 'Swim in the ocean at midnight',                  emoji: '🌙', xpReward: 50,  secret: true  },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a])
) as Record<string, Achievement>;
