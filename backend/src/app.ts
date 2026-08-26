import express from "express";
import { userRouter } from "./pods/user/user.router.js";
import { errorHandler } from "./shared/middlewares/errorHandler.middleware.js";

export const app = express();

app.use(express.json());

app.use("/api/users", userRouter);

app.use(errorHandler);
