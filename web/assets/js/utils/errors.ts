import {
  FaucetError,
  InvalidTokenError,
  TokenAlreadyBoundError,
  UserFundedError
} from '../types/errors.ts';

export const constructFaucetError = (message: string): FaucetError => {
  switch (message) {
    case 'User is funded':
      return new UserFundedError();
    case 'Invalid faucet token':
      return new InvalidTokenError();
		case 'Faucet token already bound to an other address':
      return new TokenAlreadyBoundError();
    default:
      return new FaucetError(message);
  }
};
