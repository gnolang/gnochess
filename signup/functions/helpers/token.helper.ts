import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a random token
 */
const getRandomToken = (): string => {
  return uuidv4().substring(0, 8);
};

export default getRandomToken;
