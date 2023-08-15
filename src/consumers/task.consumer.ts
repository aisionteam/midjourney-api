import Task, { TaskInterface } from "../models/task.model";
import { processTask } from '../utils/task.utils';
import { consumeFromQueue } from '../configs/rabbitmq.config'
import configs, { DiscordConfig } from '../configs/env.configs';
import { getRandomChoice } from '../utils/random.utils';

export async function startTaskReceiver() {
    const processor = async (msg: string) => {
        const task = JSON.parse(msg);
        let discordConfig: DiscordConfig | undefined;
        if (task.command === "imagine" || task.command === "describe") {
            if (task.free) {
                discordConfig = getRandomChoice(configs.discord.free);
            } else {
                discordConfig = getRandomChoice(configs.discord.paid);
            }
        } else {
            const req_prompt = JSON.parse(task.prompt);
            const req_task: any = (await Task.findOne({ uuid: req_prompt.taskId }).lean())

            discordConfig = configs.discord.dicords.filter((config) => config.name === req_task.account)[0];
        }
        // console.log(token)
        return await processTask(task, discordConfig);
    };

    const tasksConsumer = consumeFromQueue("tasks", configs.rabbitmq.concurrent_consumers, configs.rabbitmq.timeout, processor);
    const freeTasksConsumer = consumeFromQueue("free_tasks", configs.rabbitmq.concurrent_consumers_free, configs.rabbitmq.timeout_free, processor);

    await Promise.all([tasksConsumer, freeTasksConsumer])
}
