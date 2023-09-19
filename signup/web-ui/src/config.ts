export const {
  VITE_API_BASE_URL
} = import.meta.env;

if (!VITE_API_BASE_URL) {
  throw Error('VITE_API_BASE_URL property not found in .env');
}

export default {
  API_BASE_URL: VITE_API_BASE_URL
};