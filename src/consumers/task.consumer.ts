import { processTask } from '../utils/task.utils';
import { consumeFromQueue } from '../configs/rabbitmq.config'
import configs from '../configs/env.configs';
import { getRandomChoice } from '../utils/random.utils';

export async function startTaskReceiver() {
    const processor = async (msg: string) => {
        const task = JSON.parse(msg);
        let token;
        let channel;
        if (task.free) {
            token = getRandomChoice(configs.discord.salali_frees);
            channel = getRandomChoice(configs.discord.channels_free);
        } else {
            token = getRandomChoice(configs.discord.salali_tokens);
            channel = getRandomChoice(configs.discord.channels);
        }
        // console.log(token)
        await processTask(task, token, channel);
    };

    const tasksConsumer = consumeFromQueue("tasks", configs.rabbitmq.concurrent_consumers, configs.rabbitmq.timeout, processor);
    const freeTasksConsumer = consumeFromQueue("free_tasks", configs.rabbitmq.concurrent_consumers_free, configs.rabbitmq.timeout_free, processor);

    await Promise.all([tasksConsumer, freeTasksConsumer])
}
