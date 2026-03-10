export type RPSDifficulty = 'easy' | 'medium' | 'hard';
export type RPSChoice = 'rock' | 'paper' | 'scissors';

const CHOICES: RPSChoice[] = ['rock', 'paper', 'scissors'];
const COUNTER: Record<RPSChoice, RPSChoice> = {
  rock: 'paper', paper: 'scissors', scissors: 'rock',
};

/**
 * Returns the AI's choice given the player's history.
 * - easy:   purely random
 * - medium: 50% chance to counter your last move
 * - hard:   finds your most-played choice and counters it 80% of the time
 */
export const getRPSAIMove = (
  history: RPSChoice[],
  difficulty: RPSDifficulty
): RPSChoice => {
  const random = () => CHOICES[Math.floor(Math.random() * 3)];

  if (difficulty === 'easy' || history.length === 0) return random();

  if (difficulty === 'medium') {
    if (Math.random() < 0.5) return random();
    return COUNTER[history[history.length - 1]];
  }

  // hard: find most frequent player choice
  const freq: Record<RPSChoice, number> = { rock: 0, paper: 0, scissors: 0 };
  for (const c of history) freq[c]++;
  const mostPlayed = (Object.keys(freq) as RPSChoice[]).reduce((a, b) => freq[a] >= freq[b] ? a : b);
  if (Math.random() < 0.8) return COUNTER[mostPlayed];
  return random();
};
