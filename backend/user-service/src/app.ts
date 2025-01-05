import express, { Express, Request, Response } from "express";
import dotenv from"dotenv";
import userRouter from "../src/routes/userRoutes";
import { clerkMiddleware } from "@clerk/express";
import bodyParser from "body-parser";
import errorRouter from "../src/routes/errorRoute";
import hookRouter from "../src/routes/webhookRoutes";
import cors from "cors"
import morgan from "morgan"
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
// app.use(morgan("combined")); // Use 'combined' format for detailed logs
app.use("/webhook/*", bodyParser.raw({ type: "application/json" }));
app.use(express.json())
app.use(clerkMiddleware());
app.use("/users", userRouter);
app.use("/errors",errorRouter);
app.use("/webhook/user",hookRouter)

app.listen(port, () => {
  console.log(`Server is Running at port:${port}`);
});
