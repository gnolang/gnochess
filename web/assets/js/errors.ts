import { TM2Error } from '@gnolang/tm2-js-client';

// ErrorTransform takes in a TM2 error and converts it into
// a type of expected error if possible
export const ErrorTransform = (err: TM2Error): Error => {
  const parts = err.log?.match(/VM call panic: (.*)$/m);
  if (parts === null || typeof parts === 'undefined') {
    return err;
  }

  const panic = parts[1];

  for (const [k, v] of Object.entries(msgTypes)) {
    if (k.split(',').every((val) => panic.includes(val))) {
      return new v(panic, err);
    }
  }

  // No specific error found, panic with generic PanicError.
  return new PanicError(panic, err);
};

export class PanicError extends Error {
  public err: TM2Error;

  constructor(message: string, err: TM2Error) {
    super('VM call panic: ' + message);
    this.err = err;
  }
}

export class GameNotFoundError extends PanicError {
  constructor(msg: string, tm2: TM2Error) {
    super(msg, tm2);
  }
}

export class GameFinishedError extends PanicError {
  constructor(msg: string, tm2: TM2Error) {
    super(msg, tm2);
  }
}
export class BadTurnError extends PanicError {
  constructor(msg: string, tm2: TM2Error) {
    super(msg, tm2);
  }
}

export class IllegalMoveError extends PanicError {
  constructor(msg: string, tm2: TM2Error) {
    super(msg, tm2);
  }
}

export class CannotAbortError extends PanicError {
  constructor(msg: string, tm2: TM2Error) {
    super(msg, tm2);
  }
}

export class DrawOfferExistError extends PanicError {
  constructor(msg: string, tm2: TM2Error) {
    super(msg, tm2);
  }
}

export class DrawOfferNotExistError extends PanicError {
  constructor(msg: string, tm2: TM2Error) {
    super(msg, tm2);
  }
}

export class NotDrawableError extends PanicError {
  constructor(msg: string, tm2: TM2Error) {
    super(msg, tm2);
  }
}

export class PlayerNotFoundError extends PanicError {
  constructor(msg: string, tm2: TM2Error) {
    super(msg, tm2);
  }
}

export class AlreadyInLobbyError extends PanicError {
  constructor(msg: string, tm2: TM2Error) {
    super(msg, tm2);
  }
}

export class NotInLobbyError extends PanicError {
  constructor(msg: string, tm2: TM2Error) {
    super(msg, tm2);
  }
}

const msgTypes: { [messageContains: string]: typeof PanicError } = {
  'game not found': GameNotFoundError,
  'game is already finished': GameFinishedError,
  'not allowed,make a move': BadTurnError,
  'illegal move': IllegalMoveError,
  'game can no longer be aborted': CannotAbortError,
  'draw offer,already exists': DrawOfferExistError,
  'no draw offer present': DrawOfferNotExistError,
  "can't be automatically drawn": NotDrawableError,
  'player not found': PlayerNotFoundError,
  'already in the lobby': AlreadyInLobbyError,
  'not in the lobby': NotInLobbyError
};
