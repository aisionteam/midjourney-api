import express from "express";

import mongoConn from "./configs/mongodb.configs";
import { redisClient as redis } from "./configs/redis.config";

import authRouter from "./routes/auth.router";
import taskRouter from "./routes/task.router";
import { startTaskReceiver } from "./consumers/task.consumer";

(async () => {
  await mongoConn;
  // await redis.connect();
})();

startTaskReceiver();

const app = express();

app.use(express.json());
app.use('/auth', authRouter);
app.use('/task', taskRouter);

app.listen(3000, () => console.log("Listening on port 3000"));
