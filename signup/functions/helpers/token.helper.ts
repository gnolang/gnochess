import tokenList from "../config/token.config";

/**
 * Fetches a random token from the token list
 */
const getRandomToken = (): string => {
  const randomTokenIndex = Math.floor(Math.random() * tokenList.length);

  return tokenList[randomTokenIndex];
};

export default getRandomToken;
