import express,{Express, Request, Response} from "express"
import cors from "cors"
import dotenv from "dotenv"
import videoRouter from "../src/routes/videoRoutes"
import { clerkMiddleware } from "@clerk/express"

import { createServer } from "http"
import { initializeSocketServer } from "../src/utils/socketServer"
import { setSocketInstance } from "./controllers/socketController"
import { connectRedis } from "../src/utils/redis";
import { startUserEventsWorker } from "./workers/userEventsWorker";
import { startMediaProcessingWorker } from "./workers/mediaProcessingWorker";
import { startDraftReaper } from "./workers/draftReaper";
import { pinoHttp } from "pino-http"
import { logger } from "./utils/logger"

dotenv.config()
const origin_url=process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')
: [];
const app:Express=express();
app.use(express.json());
app.use(clerkMiddleware())
app.use(cors({
    origin: origin_url, // Replace with your frontend URL
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true, // If you're using cookies or authentication
  }));

// Lightweight liveness endpoint for the container healthcheck.
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Structured per-request logging with an auto request id (req.log child).
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));

connectRedis();


const PORT=process.env.VIDEO_SERVICE_PORT || 4000

app.use("/api/videos",videoRouter)
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocketServer(httpServer);

setSocketInstance(io);

httpServer.listen(PORT,()=>{
    logger.info(`Server is running at PORT:${PORT}`)
    startUserEventsWorker().catch(err => logger.error({ err }, "UserEventsWorker failed to start"));
    startMediaProcessingWorker().catch(err => logger.error({ err }, "MediaProcessingWorker failed to start"));
    startDraftReaper();
})

