import express, { Request, Response } from 'express';
import axios from 'axios';
import configs from '../configs/env.configs';
import { redisClient as redis } from '../configs/redis.config';
import Task, { TaskInterface } from '../models/task.model';
import User, { UserInterface } from '../models/user.model';
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
    const prompt_req = req.body.prompt ? req.body.prompt : '';
    const command = req.body.command ? req.body.command : 'imagine';
    const free = req.body.free ? req.body.free : false;
    const sender_data = req.body.sender_data ? req.body.sender_data : undefined;
    const callback_url = req.body.callback ? req.body.callback : undefined;
    const prompt = prompt_req.replace(/--relax/gm, "").replace(/--turbo/gm, "").replace(/--fast/gm, "") + ((free && command == "imagine") ? " --relax" : "");
    const user: UserInterface = req.user;
    let newTask: TaskInterface = new Task({
        prompt,
        command,
        user,
        free,
        callback_url,
        status: "queue",
        sender_data,
    });

    await newTask.save();
    // const turn = await sendToQueue(free ? "free_tasks" : "tasks", JSON.stringify(newTask));
    const turn = await redis.rpush(free ? "free_tasks" : "tasks", JSON.stringify(newTask));
    newTask.turn = turn;
    redis.set(`${newTask.uuid}`, JSON.stringify(newTask), 'EX', configs.redis.task_expire).then(() => {
        if (newTask.callback_url) {
            axios.post(newTask.callback_url, newTask).catch(err => { console.error(err) });
        }
    });
    await newTask.save();
    res.json(newTask);
});

router.get("/:uuid", async (req: Request, res: Response) => {
    try {
        const uuid = req.params.uuid;
        const redistask: string | null = await redis.get(uuid);
        const task: any = redistask ? JSON.parse(redistask) : await Task.findOne({ uuid }).lean();

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