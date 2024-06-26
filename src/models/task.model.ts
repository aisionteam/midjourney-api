import { model, Schema } from "mongoose";
import { BaseDocumentInterface, BaseDocumentSchema } from "./base.model";
import { v4 as uuid4 } from 'uuid';
import User from "./user.model";

export interface TaskInterface extends BaseDocumentInterface {
    uuid?: string,
    user?: Schema.Types.ObjectId, // Foreign key reference to the User model
    prompt: string,
    command: string,
    callback_url?: string,
    free: boolean,
    result: Object,
    status: string,
    error: Object,
    message: string,
    percentage?: string,
    turn?: number,
    temp_uri: string[],
    account?: string,
    sender_data?: Object,
}

const TaskSchema = new BaseDocumentSchema(
    {
        uuid: {
            type: String,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: User, // Reference to the User model
            // required: true,
        },
        prompt: {
            type: String,
            trim: true,
        },
        command: {
            type: String,
            required: true,
            default: "imagine",
            enum: ["imagine", "describe", "variation", "upscale", "zoomout", "faceswap"],
        },
        callback_url: {
            type: String,
            trim: true,
        },
        free: {
            type: Boolean,
            default: false,
        },
        result: {
            type: Object,
            trim: true,
        },
        status: {
            type: String,
            required: true,
            default: "initialized",
            enum: ["initialized", "queue", "waiting", "running", "completed", "error"],
        },
        error: {
            type: Object,
            trim: true,
        },
        message: {
            type: String,
            trim: true,
        },
        percentage: {
            type: String,
            trim: true,
            default: "0",
        },
        turn: {
            type: Number,
        },
        temp_uri: {
            type: [String],
            default: [],
        },
        account: {
            type: String,
            trim: true,
        },
        sender_data: {
            type: Object,
            trim: true,
        },
    },
    null,
);

TaskSchema.pre('save', async function (next) { // this line
    const task = this;
    if (task.$isEmpty('uuid')) {
        task.uuid = uuid4();
    }
    next();
});

const Task = model<TaskInterface>("Task", TaskSchema);
export default Task;
