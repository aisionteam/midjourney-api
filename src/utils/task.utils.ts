import axios from 'axios';

import Task, { TaskInterface } from "../models/task.model";
import { Midjourney } from "..";
import { redisClient as redis } from "../configs/redis.config";
import configs from "../configs/env.configs";


export const processTask = async (task: TaskInterface,
    salaiToken: string | undefined = undefined,
    channel: string | undefined = undefined) => {
    const client = new Midjourney({
        ServerId: <string>process.env.SERVER_ID,
        ChannelId: channel ? channel : <string>process.env.CHANNEL_ID,
        SalaiToken: salaiToken ? salaiToken : <string>process.env.SALAI_TOKEN,
        HuggingFaceToken: <string>process.env.HUGGINGFACE_TOKEN,
        Debug: false,
        Ws: true,
    });

    const foundtask = await Task.findOne({ uuid: task.uuid });
    if (!foundtask) {
        console.error(`task not found ${task.uuid}`);
        return;
    }
    task = foundtask;

    const update = (uri: string, percentage: string) => {
        redis.get(`${task.uuid}`).then((processingTask) => {
            // console.log(`updatde on ${task.command} ${task.prompt.substring(0, 20)} ${uri} ${percentage} ${task.percentage} ${task.status}`)
            const currentPercent = parseInt((processingTask ? JSON.parse(processingTask).percentage : undefined) || "0");
            if (parseInt(percentage) > currentPercent) {
                task.status = "running";
                task.percentage = percentage;
                task.temp_uri = processingTask ? [uri, ...JSON.parse(processingTask).temp_uri, uri] : [uri];

                redis.set(`${task.uuid}`, JSON.stringify(task), 'EX', configs.redis.task_expire).then(() => {
                    if (task.callback_url) {
                        axios.get(task.callback_url).catch(err => { console.error(err) });
                    }
                });
            }
        });
    };

    await client.Connect(); //update);
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
                midAction = client.Imagine(task.prompt, update)
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
                    loading: update,
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
                    loading: update,
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
                    loading: update,
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
        // console.log(`task completed ${task.command} ${task.prompt.substring(0, 20)} ${task.uuid}`)
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
        try {
            await task.save();
        } catch (err: any) { }
        return;
    }
};

