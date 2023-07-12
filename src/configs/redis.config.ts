import configs from "../configs/env.configs";
import redis, { createClient, RedisClientOptions } from 'redis';

export const client = createClient({
    host: configs.redis.redisUri,
} as RedisClientOptions);

client.on('connect', () => {
    console.log('Connected to Redis');
});

client.on('error', (error) => {
    console.error('Redis error:', error);
});