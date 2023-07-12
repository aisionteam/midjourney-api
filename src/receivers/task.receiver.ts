import amqp from 'amqplib';
import { processTask } from '../utils/task.utils';
import { consumeFromQueue } from '../configs/rabbitmq.config'

export async function startTaskReceiver() {
    await consumeFromQueue("tasks", async (msg: string) => {
        const task = JSON.parse(msg);
        // await processTask(task);
        console.log(task);
    });
}
