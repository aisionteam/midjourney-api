import express, { Request, Response } from 'express';

import Task, { TaskInterface } from '../models/task.model';
import User, { UserInterface } from '../models/user.model';
import { processTask } from "../utils/task.utils"
import { AuthenticatedRequest, authenticateToken } from "../middlewares/auth.middlewares"

const router = express.Router();

router.post("/", authenticateToken, async (req: any, res: Response) => {
    const prompt = req.body.prompt ? req.body.prompt : '';
    const command = req.body.command ? req.body.command : 'imagine';
    const user: UserInterface = req.user;
    const newTask: TaskInterface = new Task({
        prompt: prompt,
        command: command,
        status: "waiting",
        user: user,
    });

    await newTask.save();
    processTask(newTask);
    res.json(newTask);
});

router.get("/:uuid", async (req: Request, res: Response) => {
    try {
        const uuid = req.params.uuid;
        const task: any = await Task.findOne({ uuid }).lean();

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