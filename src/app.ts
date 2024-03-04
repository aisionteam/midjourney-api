import { redisClient as redis } from "./configs/redis.config";
import { processor } from './consumers/task.consumer';
import configs from './configs/env.configs';
import mongoConn from "./configs/mongodb.configs";


//(queue: string, timeout: number, callback: (msg: string) => Promise<void>, abort ?: () => void)
async function TaskReceiver(queue: string, timeout: number, callback: (msg: string) => Promise<void>, abort?: () => void) {
    while (true) {
        try {
            const result = await redis.blpop(queue, 0);
            if (!result) {
                console.log(`No task received within the timeout period.`);
                await (new Promise(resolve => setTimeout(resolve, 1000)));
                continue;
            }
            const [key, msg] = result;

            if (msg === 'KILL') {
                break;
            }

            const timeoutTimer = new Promise<void>((resolve, reject) => {
                setTimeout(() => {
                    if (abort) {
                        abort();
                    }
                    resolve();
                }, timeout);
            });
            await Promise.race([callback(msg), timeoutTimer]);
        } catch (error) {
            console.error(`Error receiving msg: ${error}`);
        }
    }
}

async function main() {
    await mongoConn;

    const tasksConsumer = Array.from({ length: configs.rabbitmq.concurrent_consumers }, (_, i) =>
        TaskReceiver("tasks", configs.rabbitmq.timeout, processor));

    const freeTasksConsumer = Array.from({ length: configs.rabbitmq.concurrent_consumers }, (_, i) =>
        TaskReceiver("free_tasks", configs.rabbitmq.timeout, processor));
    await Promise.all([...tasksConsumer, ...freeTasksConsumer])
}

main().catch(console.error);
