import configs from "./env.configs";
import amqb from 'amqplib';

export async function sendToQueue(queue: string, msg: string) {
    const connection = await amqb.connect(configs.rabbitmq.rabbitmqUri);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue);
    await channel.sendToQueue(queue, Buffer.from(msg));
    await channel.close();
    await connection.close();
}

export async function consumeFromQueue(queue: string, timeout: number, callback: (msg: string) => Promise<void>) {
    const connection = await amqb.connect(configs.rabbitmq.rabbitmqUri);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue);
    channel.prefetch(configs.rabbitmq.concurrent_consumers);
    await channel.consume(queue, async (msg) => {
        if (msg) {
            const timeoutTimer = new Promise((resolve, reject) => {
                setTimeout(resolve, timeout, 'two');
            });
            await Promise.race([callback(msg.content.toString()), timeoutTimer]);
            // await callback(msg.content.toString());
            channel.ack(msg);
        }
    });
}