const mongodbUri = process.env.MONGODB_URL ? process.env.MONGODB_URL : 'mongodb://localhost:27017';
const rabbitmqUri = process.env.RABBITMQ_URL ? process.env.RABBITMQ_URL : 'amqp://localhost:5672';
const redisUri = 'redis://redis';

const configs = {
    mongo: { mongodbUri },
    rabbitmq: { rabbitmqUri },
    redis: { redisUri },
}

export default configs;