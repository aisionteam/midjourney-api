import axios from 'axios';

import WebSocket from 'isomorphic-ws';
import { HttpsProxyAgent } from 'https-proxy-agent';
import Task, { TaskInterface } from "../models/task.model";
import { Midjourney } from "..";
// import { Midjourney } from "freezer-midjourney-api";
import { redisClient as redis } from "../configs/redis.config";
import configs, { DiscordConfig } from "../configs/env.configs";
import { getRandomChoice } from '../utils/random.utils';


export const processor = async (msg: string) => {
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
        try {
            discordConfig = configs.discord.dicords.filter((config) => config.name === req_task.account)[0];
        } catch (error) {
            discordConfig = getRandomChoice(configs.discord.paid);
        }
    }
    // console.log(token)
    return await processTask(task, discordConfig);
};

export const processTask = async (
    task: TaskInterface,
    discordConfig: DiscordConfig | undefined = undefined,
) => {
    const agent = new HttpsProxyAgent(configs.proxy);

    const client = new Midjourney({
        ServerId: discordConfig ? <string>discordConfig.server : <string>process.env.SERVER_ID,
        ChannelId: discordConfig ? <string>discordConfig.channel : <string>process.env.CHANNEL_ID,
        SalaiToken: discordConfig ? <string>discordConfig.token : <string>process.env.SALAI_TOKEN,
        HuggingFaceToken: <string>process.env.HUGGINGFACE_TOKEN,
        Debug: false,
        Ws: true,
        agent: agent,
    });

    const foundtask = await Task.findOne({ uuid: task.uuid });
    if (!foundtask) {
        console.error(`task not found ${task.uuid}`);
        return;
    }
    task = foundtask;
    task.account = discordConfig?.name;
    await task.save();

    const update_redis = (task: TaskInterface) => {
        redis.set(`${task.uuid}`, JSON.stringify(task), 'EX', configs.redis.task_expire).then(() => {
            if (task.callback_url) {
                axios.post(task.callback_url, task).catch(err => { console.error(err) });
            }
        }).catch(err => { console.error(err) });
    }

    const update = (uri: string, percentage: string) => {
        redis.get(`${task.uuid}`).then(processingTask => {
            const currentPercent = parseInt((processingTask ? JSON.parse(processingTask).percentage : undefined) || "0");
            if (parseInt(percentage) > currentPercent) {
                task.status = "running";
                task.percentage = percentage;
                task.temp_uri = processingTask ? [uri, ...JSON.parse(processingTask).temp_uri, uri] : [uri];

                update_redis(task);
            }
        });
    };

    try {
        await client.Connect();
        const timeoutPromise = new Promise<void>((resolve, reject) => {
            setTimeout(() => {
                if (task.status === "completed" || task.status === "error") {
                    resolve();
                } else {
                    client.Close()
                    console.error(`timeout on task ${task.uuid}`);
                    reject(new Error(`timeout on task ${task.uuid}`));
                }
            }, configs.midjourney.timeout * 1000)
            // }, 5 * 1000)
        });
        task.status = "waiting";
        update_redis(task);


        let midAction: Promise<any>;
        switch (task.command) {
            case 'imagine':
                midAction = client.Imagine(task.prompt, update).catch((err) => { throw err });
                break;
            case 'describe':
                midAction = client.Describe(task.prompt).catch((err) => { throw err });
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
                }).catch((err) => { throw err });
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
                }).catch((err) => { throw err });
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
                }).catch((err) => { throw err });
                break;
            case 'faceswap':
                const req_prompt_f = JSON.parse(task.prompt);
                midAction = client.FaceSwap(req_prompt_f.target, req_prompt_f.source);
                break;
            default:
                throw new Error('Invalid value of t');
        }
        const result: any = await Promise.race([timeoutPromise.catch((err) => { throw err }), midAction.catch((err) => { throw err })])

        task.result = result ? result : {};
        task.percentage = "100%";
        task.status = "completed";
        task.account = discordConfig?.name;
        await task.save();
        update_redis(task);
    } catch (err: any) {
        console.error(`task error ${task} -> ${err}`);
        try {
            task.status = "error";
            task.error = err;
            update_redis(task);
            await task.save();

        } catch (err: any) { console.error(`task save error ${task} -> ${err}`); }
        return;
    }
};

