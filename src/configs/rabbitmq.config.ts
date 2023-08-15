import configs from "./env.configs";
import amqb from 'amqplib';

export async function sendToQueue(queue: string, msg: string) {
    const connection = await amqb.connect(configs.rabbitmq.rabbitmqUri);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue);
    await channel.sendToQueue(queue, Buffer.from(msg));
    const queueInfo = await channel.assertQueue(queue);
    await channel.close();
    await connection.close();
    return queueInfo.messageCount;
}

export async function consumeFromQueue(queue: string, concurrent: number, timeout: number, callback: (msg: string) => Promise<void>, abort?: () => void) {
    const connection = await amqb.connect(configs.rabbitmq.rabbitmqUri);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue);
    channel.prefetch(concurrent);
    await channel.consume(queue, async (msg) => {
        if (msg) {
            const timeoutTimer = new Promise<void>((resolve, reject) => {
                setTimeout(() => {
                    if (abort) {
                        abort();
                    }
                    resolve();
                }, timeout);
            });
            await Promise.race([callback(msg.content.toString()), timeoutTimer]);
            // await callback(msg.content.toString());
            channel.ack(msg);
        }
    });
}