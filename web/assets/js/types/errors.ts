class FaucetError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class UserFundedError extends FaucetError {
  constructor() {
    super('User is already funded');
  }
}

class InvalidTokenError extends FaucetError {
  constructor() {
    super('Invalid faucet token');
  }
}

class TokenAlreadyBoundError extends FaucetError {
  constructor() {
    super('Faucet token already bound to an other address');
  }
}

export {
  FaucetError,
  UserFundedError,
  InvalidTokenError,
  TokenAlreadyBoundError
};
