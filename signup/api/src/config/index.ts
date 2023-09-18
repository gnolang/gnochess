import * as dotenv from 'dotenv';

const env = dotenv.config();

export enum ApplicationEnv {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
}

const {
  NODE_PORT,
  NODE_HOST,
  NODE_ENV,
  MAILCHIMP_API_KEY,
  MAILCHIMP_API_SERVER,
  MAILCHIMP_AUDIENCE_ID
} = process.env;

const ENV: ApplicationEnv =
  (NODE_ENV as ApplicationEnv) || ApplicationEnv.DEVELOPMENT;

export const CONFIG = {
  MAILCHIMP_API_KEY,
  MAILCHIMP_API_SERVER,
  MAILCHIMP_AUDIENCE_ID,
  NODE_PORT,
  NODE_HOST,
  NODE_ENV: ENV
};