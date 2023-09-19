import { entropyToMnemonic } from '@cosmjs/crypto/build/bip39';

/**
 * Generates a random bip39 mnemonic
 */
export const generateMnemonic = (): string => {
  const array = new Uint8Array(32);
  self.crypto.getRandomValues(array);

  return entropyToMnemonic(array);
};
