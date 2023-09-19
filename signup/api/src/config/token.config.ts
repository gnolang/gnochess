import { CONFIG } from './index';

/**
 * Parses the token list
 */
const readTokenList = (): string[] => {
  // Read the list
  const list: string = CONFIG.TOKEN_LIST;

  return list.split(' ');
};

const tokenList: string[] = readTokenList();


export default tokenList;