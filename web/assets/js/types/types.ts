export type Colors = "w" | "b";
export type GameoverType =
    "checkmate"
    | "timeout"
    | "draw"
    | "stalemate"
    | "threefoldRepetition"
    | "insufficientMaterial";
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
    increment: number
}

export const defaultMnemonicKey = "private-key-mnemonic"
export const defaultFaucetTokenKey = "faucet-token"
