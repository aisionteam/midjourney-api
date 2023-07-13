import { processTask } from '../utils/task.utils';
import { consumeFromQueue } from '../configs/rabbitmq.config'
import config from '../configs/env.configs';
import { getRandomChoice } from '../utils/random.utils';

export async function startTaskReceiver() {
    await consumeFromQueue("tasks", async (msg: string) => {
        const task = JSON.parse(msg);
        let token;
        if (task.freemode) {
            token = getRandomChoice(config.discord.salali_free);
        } else {
            token = getRandomChoice(config.discord.salali_tokens);
        }
        await processTask(task, token);
    });
}
