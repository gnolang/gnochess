/**
 * Saves the data to local storage
 * @param key the key associated with the data
 * @param data the data to be saved
 */
const saveToLocalStorage = (key: string, data: string) => {
  localStorage.setItem(key, data);
};

/**
 * Fetches the data from local storage
 * @param key the key associated with the data
 */
const getFromLocalStorage = (key: string): string => {
  return localStorage.getItem(key) ?? '';
};

export { saveToLocalStorage, getFromLocalStorage };
