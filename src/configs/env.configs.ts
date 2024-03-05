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
const redisUri = process.env.REDIS_URL ? process.env.REDIS_URL : 'redis';

const configs = {
    mongo: { mongodbUri },
    redis: { redisUri, task_expire: 60 * 15 },
    discord: {
        dicords: secret.discords,
        paid,
        free,
    },
    midjourney: { concurrent_tasks: 2, concurrent_tasks_free: 1, timeout: 5 * 60, },
}


export default configs;
