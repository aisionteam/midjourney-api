import Task, { TaskInterface } from "../models/task.model";
import { Midjourney } from "..";

export const processTask = async (task: TaskInterface) => {
    const client = new Midjourney({
        ServerId: <string>process.env.SERVER_ID,
        ChannelId: <string>process.env.CHANNEL_ID,
        SalaiToken: <string>process.env.SALAI_TOKEN,
        HuggingFaceToken: <string>process.env.HUGGINGFACE_TOKEN,
        Debug: true,
        Ws: true,
    });

    const update = (msg: any) => {
        const re_pat = /(\d+%)/;
        if (msg.d.content) {
            const percentage = msg.d.content.match(re_pat);
            if (percentage && parseFloat(percentage[0]) > parseFloat(task.percentage ? task.percentage : '0')) {
                task.percentage = percentage[0];
                task.save();
            }
        }
    }

    await client.Connect(update);
    if (task.command === "imagine") {
        const Imagine = await client.Imagine(
            task.prompt,
            (uri: string, progress: string) => {
                // console.log("***** Imagine.loading", uri, "progress", progress);
            }
        ).catch((err) => {
            console.error(`imagine error ${err}`)
            return;
        });

        task.result = Imagine ? Imagine : {};
        task.percentage = "100%";
        task.status = "completed";
    } else if (task.command === "describe") {
        const Describe = await client.Describe(task.prompt).catch((err) => {
            console.error(`imagine error ${err}`)
            return;
        });

        task.result = Describe ? Describe : {};
        task.percentage = '100%';
        task.status = "completed";
    } else if (task.command === "upscale") {
        try {
            const req_prompt = JSON.parse(task.prompt);
            const req_task: any = (await Task.findOne({ uuid: req_prompt.taskId }).lean())
            const Imagine = req_task.result;
            const Upscale = await client.Upscale({
                index: req_prompt.position,
                msgId: <string>Imagine.id,
                hash: <string>Imagine.hash,
                flags: Imagine.flags,
                loading: (uri: string, progress: string) => {
                    // console.log("loading", uri, "progress", progress);
                },
            }).catch((err) => {
                console.error(`Upscale error ${err}`)
                return;
            });

            task.result = Upscale ? Upscale : {};
            task.percentage = '100%';
            task.status = "completed";
        } catch (err) {
            console.error(`upscale error ${err}`)
            return;
        }
    } else if (task.command === "variation") {
        try {
            const req_prompt = JSON.parse(task.prompt);
            const req_task: any = (await Task.findOne({ uuid: req_prompt.taskId }).lean())
            const Imagine = req_task.result;
            const Variation = await client.Variation({
                index: req_prompt.position,
                msgId: <string>Imagine.id,
                hash: <string>Imagine.hash,
                flags: Imagine.flags,
                loading: (uri: string, progress: string) => {
                    // console.log("loading", uri, "progress", progress);
                },
            }).catch((err) => {
                console.error(`Variation error ${err}`)
                return;
            });

            task.result = Variation ? Variation : {};
            task.percentage = '100%';
            task.status = "completed";
        } catch (err) {
            console.error(`Variation error ${err}`)
            return;
        }
    } else if (task.command === "zoomout") {
        try {
            const req_prompt = JSON.parse(task.prompt);
            const req_task: any = (await Task.findOne({ uuid: req_prompt.taskId }).lean())
            const Upscale = req_task.result;
            const Zoomout = await client.ZoomOut({
                level: req_prompt.zx,
                msgId: <string>Upscale.id,
                hash: <string>Upscale.hash,
                flags: Upscale.flags,
                loading: (uri: string, progress: string) => {
                    // console.log("Zoomout loading", uri, "progress", progress);
                },
            }).catch((err) => {
                console.error(`Zoomout error ${err}`)
                return;
            });

            task.result = Zoomout ? Zoomout : {};
            task.percentage = '100%';
            task.status = "completed";
        } catch (err) {
            console.error(`Zoomout error ${err}`)
            return;
        }
    }

    await task.save();
};

