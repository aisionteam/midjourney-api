import axios from 'axios';

import Task, { TaskInterface } from "../models/task.model";
import { Midjourney } from "..";
import { redisClient as redis } from "../configs/redis.config";
import configs from "../configs/env.configs";


export const processTask = async (task: TaskInterface, SalaiToken: string | null = null) => {
    const client = new Midjourney({
        ServerId: <string>process.env.SERVER_ID,
        ChannelId: <string>process.env.CHANNEL_ID,
        SalaiToken: SalaiToken ? SalaiToken : <string>process.env.SALAI_TOKEN,
        HuggingFaceToken: <string>process.env.HUGGINGFACE_TOKEN,
        Debug: true,
        Ws: true,
    });

    const foundtask = await Task.findOne({ uuid: task.uuid });
    if (!foundtask) {
        console.error(`task not found ${task.uuid}`);
        return;
    }
    task = foundtask;

    const update = (msg: any) => {
        try {
            const re_pat = /(\d+%)/;
            if (msg.d.content) {
                const percentage = msg.d.content.match(re_pat);
                if (percentage && parseFloat(percentage[0]) > parseFloat(task.percentage ? task.percentage : '0')) {
                    task.status = "running";
                    task.percentage = percentage[0];
                    redis.set(`${task.uuid}`, JSON.stringify(task), 'EX', configs.redis.task_expire).then(() => {
                        if (task.callback_url) {
                            axios.get(task.callback_url).catch(err => { console.error(err) });
                        }
                    });
                }
            }
        } catch (err: any) {
            console.error(`update error ${err}`)
            return;
        }
    }

    await client.Connect(update);
    try {
        task.status = "waiting";
        redis.set(`${task.uuid}`, JSON.stringify(task), 'EX', configs.redis.task_expire).then(() => {
            if (task.callback_url) {
                axios.get(task.callback_url).catch(err => { console.error(err) });
            }
        });
        let midAction: Promise<any>;
        switch (task.command) {
            case 'imagine':
                midAction = client.Imagine(task.prompt)
                break;
            case 'describe':
                midAction = client.Describe(task.prompt)
                break;
            case 'upscale':
                const req_prompt_u = JSON.parse(task.prompt);
                const req_task_u: any = (await Task.findOne({ uuid: req_prompt_u.taskId }).lean())
                const Imagine_u = req_task_u.result;
                midAction = client.Upscale({
                    index: req_prompt_u.position,
                    msgId: <string>Imagine_u.id,
                    hash: <string>Imagine_u.hash,
                    flags: Imagine_u.flags,
                })
                break;
            case 'variation':
                const req_prompt_v = JSON.parse(task.prompt);
                const req_task_v: any = (await Task.findOne({ uuid: req_prompt_v.taskId }).lean())
                const Imagine_v = req_task_v.result;
                midAction = client.Variation({
                    index: req_prompt_v.position,
                    msgId: <string>Imagine_v.id,
                    hash: <string>Imagine_v.hash,
                    flags: Imagine_v.flags,
                })
                break;
            case 'zoomout':
                const req_prompt_z = JSON.parse(task.prompt);
                const req_task_z: any = (await Task.findOne({ uuid: req_prompt_z.taskId }).lean())
                const Upscale_z = req_task_z.result;
                midAction = client.ZoomOut({
                    level: req_prompt_z.zx,
                    msgId: <string>Upscale_z.id,
                    hash: <string>Upscale_z.hash,
                    flags: Upscale_z.flags,
                })
                break;
            default:
                throw new Error('Invalid value of t');
        }
        const result: any = await midAction.catch((err) => {
            task.error = err;
            redis.set(`${task.uuid}`, JSON.stringify(task), 'EX', configs.redis.task_expire).then(() => {
                if (task.callback_url) {
                    axios.get(task.callback_url).catch(err => { console.error(err) });
                }
            });
        });

        task.result = result ? result : {};
        task.percentage = "100%";
        task.status = "completed";
        redis.set(`${task.uuid}`, JSON.stringify(task), 'EX', configs.redis.task_expire).then(() => {
            if (task.callback_url) {
                axios.get(task.callback_url).catch(err => { console.error(err) });
            }
        });
        await task.save();
    } catch (err: any) {
        console.error(`task error ${task} -> ${err}`);
        redis.set(`${task.uuid}`, JSON.stringify(task), 'EX', configs.redis.task_expire)
            .catch((error) => {
                console.error('Error setting key:', task.uuid, error);
            });
        return;
    }
};

