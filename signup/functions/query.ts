import type { Handler, HandlerEvent } from '@netlify/functions';

import { CONFIG } from './config';
import { RedisClient } from './services/redis';

// Login to redis
const redisClient = new RedisClient(CONFIG.REDIS_URL);

interface QueryRequest {
  address: string;
}

export async function handler(event: HandlerEvent) {
  const queryReq: QueryRequest = JSON.parse(event.body || '{}');

  if (
    CONFIG.AUTHORIZATION_PASS &&
    event.headers['Authorization'] !== CONFIG.AUTHORIZATION_PASS
  ) {
    return {
      statusCode: 401
    };
  } else if (!queryReq.address) {
    return {
      statusCode: 400
    };
  }

  let user = {};
  user = await redisClient.getUserByAddress(queryReq.address);

  return {
    statusCode: 200,
    body: JSON.stringify(user)
  };
}
