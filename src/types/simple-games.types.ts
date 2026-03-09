// Tic-Tac-Toe Types
export type CellValue = 'X' | 'O' | null;
export type Board = CellValue[];

export interface TicTacToeState {
  board: Board;
  currentPlayer: 'X' | 'O';
  winner: 'X' | 'O' | 'draw' | null;
  winningLine: number[] | null;
}

export interface TicTacToeSession {
  id: string;
  board: Board;
  currentPlayer: 'X' | 'O';
  playerX: string;
  playerO: string;
  winner: string | null;
  status: 'waiting' | 'active' | 'finished';
  createdAt: number;
}

// Word Scramble Types
export interface WordScrambleState {
  originalWord: string;
  scrambledWord: string;
  userGuess: string;
  score: number;
  hintsUsed: number;
}

// Memory Match Types
export interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface MemoryMatchState {
  cards: Card[];
  flippedCards: number[];
  matchedPairs: number;
  moves: number;
  score: number;
}

// Trivia Quiz Types
export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

export interface TriviaState {
  currentQuestion: number;
  score: number;
  questions: Question[];
  userAnswers: (number | null)[];
}

// Connect 4 Types
export type Connect4Cell = 'R' | 'Y' | null;
export type Connect4Board = Connect4Cell[][];

export interface Connect4State {
  board: Connect4Board;
  currentPlayer: 'R' | 'Y';
  winner: 'R' | 'Y' | 'draw' | null;
  lastMove: { row: number; col: number } | null;
}

// Rock Paper Scissors Types
export type RPS = 'rock' | 'paper' | 'scissors';

export interface RPSState {
  player1Choice: RPS | null;
  player2Choice: RPS | null;
  winner: string | null;
  scores: {
    player1: number;
    player2: number;
  };
}

// Pictionary Types
export interface DrawingData {
  x: number;
  y: number;
  color: string;
  size: number;
  tool: 'pen' | 'eraser';
}

export interface PictionaryState {
  word: string;
  drawer: string;
  guesser: string;
  drawing: DrawingData[];
  guesses: string[];
  timeLeft: number;
  score: number;
}

// Math Duel Types
export interface MathProblem {
  question: string;
  answer: number;
  options: number[];
}

export interface MathDuelState {
  player1Score: number;
  player2Score: number;
  currentProblem: MathProblem;
  round: number;
  maxRounds: number;
}