import configs from "./env.configs";
import IORedis from 'ioredis';

class RedisSingleton {
    private static instance: RedisSingleton;
    private client: IORedis;

    private constructor() {
        // Create a Redis client
        this.client = new IORedis({
            host: configs.redis.redisUri,
        });

        // Handle client connection events
        this.client.on('connect', () => {
            console.log('Connected to Redis');
        });

        this.client.on('error', (error) => {
            console.error('Redis error:', error);
        });
    }

    public static getInstance(): RedisSingleton {
        if (!RedisSingleton.instance) {
            RedisSingleton.instance = new RedisSingleton();
        }

        return RedisSingleton.instance;
    }

    public async connect(): Promise<void> {
        if (this.client.status === 'connecting' || this.client.status === 'connect') {
            return;
        }

        await this.client.connect();
    }

    public getClient(): IORedis {
        return this.client;
    }
}

export const redisClient = RedisSingleton.getInstance().getClient();
