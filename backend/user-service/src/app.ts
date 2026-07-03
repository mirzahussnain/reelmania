import express, { Express, Request, Response } from "express";
import dotenv from"dotenv";
import userRouter from "../src/routes/userRoutes";
import followerRouter from "../src/routes/followerRoutes";
import { clerkMiddleware } from "@clerk/express";
import bodyParser from "body-parser";
import errorRouter from "../src/routes/errorRoute";
import hookRouter from "../src/routes/webhookRoutes";
import cors from "cors"
import { pinoHttp } from "pino-http"
import { logger } from "./utils/logger"
dotenv.config()
const app: Express = express();
const client_url=process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')
: [];

const port = process.env.USER_SERVICE_PORT
app.use(cors(
  {
    origin:client_url,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // If you're using cookies or authentication
  }
))
// Lightweight liveness endpoint for the container healthcheck.
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});
// Structured per-request logging with an auto request id (req.log child).
// Health checks are excluded to keep the logs signal-rich.
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));
app.use("/api/webhook/*", bodyParser.raw({ type: "application/json" }));
app.use(express.json())
app.use(clerkMiddleware());
app.use("/api/users", userRouter);
app.use("/api/users", followerRouter);
app.use("/api/users/errors",errorRouter);
app.use("/api/webhook/user",hookRouter)

import { startUserWorker } from "./workers/userWorker";
import { startVideoEventsWorker } from "./workers/videoEventsWorker";

app.listen(port, () => {
  logger.info(`Server is Running at port:${port}`);
  startUserWorker().catch(err => logger.error({ err }, "User worker failed to start"));
  startVideoEventsWorker().catch(err => logger.error({ err }, "Video-events worker failed to start"));
});
