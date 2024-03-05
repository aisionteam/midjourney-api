import { redisClient as redis } from "./configs/redis.config";
// import Redis from 'ioredis';
import { processor } from './utils/task.utils';
import configs from './configs/env.configs';
import mongoConn from "./configs/mongodb.configs";

// const redis = new Redis({
//     host: configs.redis.redisUri,
// });

//(queue: string, timeout: number, callback: (msg: string) => Promise<void>, abort ?: () => void)
async function TaskReceiver(queue: string, timeout: number, callback: (msg: string) => Promise<void>, abort?: () => void) {
    while (true) {
        try {
            const result = await redis.duplicate().blpop(queue, 0);
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
                }, timeout * 1000);
            });
            await Promise.race([callback(msg), timeoutTimer]);
        } catch (error) {
            console.error(`Error receiving msg: ${error}`);
        }
    }
}

async function main() {
    await mongoConn;
    // await redisClient;

    const tasksConsumer = Array.from({ length: configs.midjourney.concurrent_tasks }, (_, i) =>
        TaskReceiver("tasks", configs.midjourney.timeout, processor, () => console.log("timeout")));

    const freeTasksConsumer = Array.from({ length: configs.midjourney.concurrent_tasks_free }, (_, i) =>
        TaskReceiver("free_tasks", configs.midjourney.timeout, processor, () => console.log("timeout")));
    await Promise.all([...tasksConsumer, ...freeTasksConsumer])
}

main().catch(console.error);
