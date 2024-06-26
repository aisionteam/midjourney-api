import express from "express";
import cors from "cors"; // Import the cors middleware

import mongoConn from "./configs/mongodb.configs";
import { redisClient as redis } from "./configs/redis.config";

import authRouter from "./routes/auth.router";
import taskRouter from "./routes/task.router";
import reportRouter from "./routes/report.router";
// import { startTaskReceiver } from "./consumers/task.consumer";

(async () => {
  await mongoConn;
  // await redis.connect();
})();

// startTaskReceiver();

const app = express();

app.use(express.json());
app.use('/auth', authRouter);
app.use('/task', taskRouter);
app.use('/', reportRouter);


app.listen(3000, () => console.log("Listening on port 3000"));
