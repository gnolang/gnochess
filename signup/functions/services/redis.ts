import { Redis } from 'ioredis';

export class RedisClient {
  TOKEN_PREFIX = 'TOKEN';

  private client: Redis;

  constructor(redis_url: string) {
    this.client = new Redis(redis_url);
  }

  async getUserByAddress(address: string) {
    const ret = await this.client.hgetall(`GNO:${address}`);
    return ret;
  }

  async storeUserToken(email: string, token: string) {
    await this.client
      .multi()
      .hset(`${this.TOKEN_PREFIX}:${token}`, 'email', email)
      .hset(`${this.TOKEN_PREFIX}:${token}`, 'used', 'false')
      .exec();
  }
}
