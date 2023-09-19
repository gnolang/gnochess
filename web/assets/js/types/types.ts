export type Colors = 'w' | 'b';
export type GameoverType =
  | 'checkmate'
  | 'timeout'
  | 'draw'
  | 'stalemate'
  | 'threefoldRepetition'
  | 'insufficientMaterial';
export type Move = {
  from: string;
  to: string;
  promotion: string | number;
};
export type UserSettings = {
  color: Colors;
  id: string;
};
export type GameSettings = {
  me: UserSettings;
  rival: UserSettings;
};

export interface GamePromise {
  id: number;

  // TODO something else...?
}

export interface GameTime {
  time: number;
  increment: number;
}

export enum Promotion {
  NO_PROMOTION = 0,
  QUEEN = 'Q',
  BISHOP = 'B',
  KNIGHT = 'N',
  ROOK = 'R'
}

export enum Winner {
  NONE = 'none',
  WHITE = 'white',
  BLACK = 'black',
  DRAW = 'draw'
}

export enum GameState {
  INVALID = 'invalid',
  OPEN = 'open',
  CHECKMATED = 'checkmated',
  STALEMATE = 'stalemate',
  DRAWN_75_MOVE = 'drawn_75_move',
  DRAWN_5_FOLD = 'drawn_5_fold',
  DRAWN_50_MOVE = 'drawn_50_move',
  DRAWN_3_FOLD = 'drawn_3_fold',
  DRAWN_INSUFFICIENT = 'drawn_insufficient',
  TIMEOUT = 'timeout',
  ABORTED = 'aborted',
  RESIGNED = 'resigned',
  DRAWN_BY_AGREEMENT = 'drawn_by_agreement'
}

export type GameDrawnType =
  | GameState.DRAWN_5_FOLD
  | GameState.DRAWN_75_MOVE
  | GameState.DRAWN_50_MOVE
  | GameState.DRAWN_3_FOLD
  | GameState.DRAWN_BY_AGREEMENT;

export interface Game {
  id: string;

  white: string; // address
  black: string; // address
  position: Position;
  state: GameState;
  winner: Winner;

  creator: string; // address
  created_at: number; // formatted time (RFC3339)
  draw_offerer: string | null; // address
  concluder: string | null; // address

  time: TimeControl | null;
}

export interface Position {
  fen: string; // Encoded moves
  moves: string[];
}

export interface TimeControl {
  seconds: number;
  increment: number;
  started_at: string; // formatted time (RFC3339)
  move_timestamps: string[];
  white_time: number;
  black_time: number;
}

export const defaultMnemonicKey = 'private-key-mnemonic';
export const defaultFaucetTokenKey = 'faucet-token';

export interface Player {
  address: string;
  username: string | null;
  wins: number;
  loses: number;
  draws: number;
  score: number;
  position: number; // leaderboard position
}
