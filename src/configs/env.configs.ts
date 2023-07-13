const mongodbUri = process.env.MONGODB_URL ? process.env.MONGODB_URL : 'mongodb://localhost:27017';
const rabbitmqUri = process.env.RABBITMQ_URL ? process.env.RABBITMQ_URL : 'amqp://localhost:5672';
const redisUri = 'redis';
const salali_tokens = process.env.SALAI_TOKENS ? process.env.SALAI_TOKENS.split(',') : process.env.SALAI_TOKEN ? [process.env.SALAI_TOKEN] : [];
const salali_free = process.env.SALAI_FREE ? process.env.SALAI_FREE.split(',') : salali_tokens;

const configs = {
    mongo: { mongodbUri },
    rabbitmq: { rabbitmqUri, concurrent_consumers: 12 },
    redis: { redisUri, task_expire: 60 * 15 },
    discord: { salali_tokens, salali_free },
}


export default configs;