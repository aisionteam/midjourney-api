import fs from 'fs';

const filePath = './src/configs/secrets.json';
interface Secrets {
    salali_tokens: string[];
    salali_frees: string[];
    channels: string[];
    channels_free: string[];
}

const secrets: Secrets = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const mongodbUri = process.env.MONGODB_URL ? process.env.MONGODB_URL : 'mongodb://localhost:27017';
const rabbitmqUri = process.env.RABBITMQ_URL ? process.env.RABBITMQ_URL : 'amqp://localhost:5672';
const redisUri = 'redis';

const configs = {
    mongo: { mongodbUri },
    rabbitmq: { rabbitmqUri, concurrent_consumers: 40, timeout: 5 * 60 * 1000 },
    redis: { redisUri, task_expire: 60 * 15 },
    discord: {
        salali_tokens: secrets.salali_tokens,
        salali_frees: secrets.salali_frees,
        channels: secrets.channels,
        channels_free: secrets.channels_free,
    },
    midjourney: { concurrent_tasks: 10 },
}


export default configs;
