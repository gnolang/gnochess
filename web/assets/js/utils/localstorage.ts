const saveToLocalStorage = (data: string, key: string) => {
  localStorage.setItem(key, data);
};

const getFromLocalStorage = (key: string): string => {
  // Fetch it from local storage and parse

  return localStorage.getItem(key) ?? "";
};

export { saveToLocalStorage, getFromLocalStorage };
