import {entropyToMnemonic} from "@cosmjs/crypto/build/bip39";
import {generateEntropy} from "@gnolang/tm2-js-client";

/**
 * Generates a random bip39 mnemonic
 */
export const generateMnemonic = (): string => {
    return entropyToMnemonic(generateEntropy())
}