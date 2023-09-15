export type Colors = "w" | "b";
export type GameoverType = "checkmate" | "timeout" | "draw" | "stalemate" | "threefoldRepetition" | "insufficientMaterial";
export type Move = {
  from: string;
  to: string;
  promotion: string | number;
};
