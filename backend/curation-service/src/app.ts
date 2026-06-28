import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { pinoHttp } from "pino-http";
import { logger } from "./utils/logger";
import collectionRouter from "./routes/collectionRoutes";
import { startCurationWorker } from "./workers/videoWorker";

dotenv.config();

const app: Express = express();
const client_url = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : [];
const port = process.env.CURATION_SERVICE_PORT || 8002;

app.use(
  cors({
    origin: client_url,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Lightweight liveness endpoint for the container healthcheck.
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Structured per-request logging with an auto request id (req.log child).
// Health checks are excluded to keep the logs signal-rich.
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));
app.use(express.json());
app.use(clerkMiddleware());

app.use("/api/curation/collections", collectionRouter);

app.listen(port, () => {
  logger.info(`Curation service running at port:${port}`);
  startCurationWorker().catch((err) => logger.error({ err }, "Worker failed to start"));
});
