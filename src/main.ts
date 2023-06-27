import express from "express";

import mongoConn from "./configs/mongodb.configs";
import authRouter from "./routes/auth.router";
import taskRouter from "./routes/task.router";

(async () => {
  await mongoConn;
})();

const app = express();

app.use(express.json());
app.use('/auth', authRouter);
app.use('/task', taskRouter);

app.listen(3000, () => console.log("Listening on port 3000"));
