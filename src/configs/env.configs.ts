import fs from 'fs';

const filePath = './src/configs/secrets.json';

export interface DiscordConfig {
    name: string,
    buyer: string,
    token: string,
    server: string,
    channel: string,
    modes: string[],
}
interface Secrets {
    discords: DiscordConfig[];
    salali_tokens: string[];
    salali_frees: string[];
    channels: string[];
    channels_free: string[];
}

const secret: Secrets = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const paid = secret.discords.filter(discord => discord.modes.indexOf('paid') > -1);
const free = secret.discords.filter(discord => discord.modes.indexOf('free') > -1);

const secrets: Secrets = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const mongodbUri = process.env.MONGODB_URL ? process.env.MONGODB_URL : 'mongodb://localhost:27017';
const rabbitmqUri = process.env.RABBITMQ_URL ? process.env.RABBITMQ_URL : 'amqp://localhost:5672';
const redisUri = 'redis';

const configs = {
    mongo: { mongodbUri },
    rabbitmq: {
        rabbitmqUri,
        concurrent_consumers: 9,
        timeout: 5 * 60 * 1000,
        concurrent_consumers_free: 3,
        timeout_free: 5 * 60 * 1000,
    },
    redis: { redisUri, task_expire: 60 * 15 },
    discord: {
        dicords: secret.discords,
        paid,
        free,
    },
    midjourney: { concurrent_tasks: 5, concurrent_tasks_free: 1, },
}


export default configs;
