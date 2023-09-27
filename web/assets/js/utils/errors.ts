import {
  FaucetError,
  InvalidTokenError,
  UserFundedError
} from '../types/errors.ts';

export const constructFaucetError = (message: string): FaucetError => {
  switch (message.trim()) {
    case 'User is funded':
      return new UserFundedError();
    case 'Invalid faucet token':
      return new InvalidTokenError();
    default:
      return new FaucetError(message);
  }
};
