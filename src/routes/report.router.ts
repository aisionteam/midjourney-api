import User from '../models/user.model';
import Task from '../models/task.model';
import express from 'express';
import config from '../configs/env.configs';
import { redisClient as redis } from "../configs/redis.config";


const router = express.Router();

router.get("/", async (req, res) => {
    const data = {
        configs: config.midjourney,
        users: await User.find().count(),
        tasks_queue_len: await redis.llen("tasks"),
        free_tasks_queue_len: await redis.llen("free_tasks"),
        total_tasks: await Task.find().count(),
        completed_tasks: await Task.find({ status: "completed" }).count(),
        failed_tasks: await Task.find({ status: "error" }).count(),
        daily_tasks: await Task.find({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }).count(),
        daily_completed_tasks: await Task.find({ status: "completed", createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }).count(),
        daily_failed_tasks: await Task.find({ status: "error", createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }).count(),
    };

    console.log(req.ip, 'GET /report');

    res.json(data);
});


export default router;