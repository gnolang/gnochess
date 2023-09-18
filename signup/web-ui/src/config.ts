export const {
  VITE_TOKEN_LIST,
  VITE_MAILCHIMP_API_KEY,
  VITE_MAILCHIMP_SERVER
} = import.meta.env;

if (!VITE_TOKEN_LIST) {
  throw Error('VITE_TOKEN_LIST property not found in .env');
}

if (!VITE_MAILCHIMP_API_KEY) {
  throw Error('VITE_MAILCHIMP_API_KEY property not found in .env');
}

if (!VITE_MAILCHIMP_SERVER) {
  throw Error('VITE_MAILCHIMP_SERVER property not found in .env');
}

export default {
  TOKEN_LIST: VITE_TOKEN_LIST,
  MAILCHIMP_API_KEY: VITE_MAILCHIMP_API_KEY,
  MAILCHIMP_SERVER: VITE_MAILCHIMP_SERVER
};
