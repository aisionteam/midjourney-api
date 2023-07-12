import express, { Request, Response } from 'express';

import { client as redis } from '../configs/redis.config';
import { sendToQueue } from '../configs/rabbitmq.config';
import Task, { TaskInterface } from '../models/task.model';
import User, { UserInterface } from '../models/user.model';
import { processTask } from "../utils/task.utils"
import { AuthenticatedRequest, authenticateToken } from "../middlewares/auth.middlewares"

const router = express.Router();

router.post("/", authenticateToken, async (req: any, res: Response) => {
    /*
    * Create a new task
    * @param {string} prompt - The prompt to be used for the task
    * @param {string} command - The command to be used for the task
    * 
    */

    // Here I want to create a new task and add it to the database, 
    // redis, and to the message queue.
    const prompt = req.body.prompt ? req.body.prompt : '';
    const command = req.body.command ? req.body.command : 'imagine';
    const user: UserInterface = req.user;
    const newTask: TaskInterface = new Task({
        prompt: prompt,
        command: command,
        status: "queue",
        user: user,
    });

    await newTask.save();
    await redis.set(`${newTask.uuid}`, JSON.stringify(newTask));
    await sendToQueue("tasks", JSON.stringify(newTask))
    res.json(newTask);
});

router.get("/:uuid", async (req: Request, res: Response) => {
    try {
        const uuid = req.params.uuid;
        const redistask: string | null = await redis.get(uuid);
        const task: any = JSON.parse(redistask as string) ? redistask : await Task.findOne({ uuid }).lean();

        if (!task) {
            return res.status(404).json({ message: "Not found" });
        }

        if (task.result) {
            if (task.command == "describe") {
                task.descriptions = task.result.descriptions;
                delete task.result;
            } else {
                const { uri } = task.result
                task.uri = uri;
                delete task.result;
            }
        }
        return res.json(task);
    } catch (error) {
        console.error("server error", error)
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default router;