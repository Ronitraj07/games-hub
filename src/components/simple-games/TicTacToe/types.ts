export type CellValue = 'X' | 'O' | null;
export type BoardState = CellValue[];
export type GameStatus = 'waiting' | 'active' | 'finished';
export type Player = 'X' | 'O';

export interface TicTacToeGameState {
  board: BoardState;
  currentTurn: Player;
  winner: Player | 'draw' | null;
  status: GameStatus;
}

export interface CellProps {
  value: CellValue;
  onClick: () => void;
  disabled: boolean;
  winning?: boolean;
}

export interface BoardProps {
  board: BoardState;
  onCellClick: (index: number) => void;
  disabled: boolean;
  winningCells?: number[];
}

export interface TicTacToeProps {
  sessionId?: string;
}