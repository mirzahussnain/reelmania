import express,{Express, Request, Response} from "express"
import cors from "cors"
import dotenv from "dotenv"
import videoRouter from "../src/routes/videoRoutes"
import { clerkMiddleware } from "@clerk/express"

import { createServer } from "http"
import { initializeSocketServer } from "../src/utils/socketServer"
import { setSocketInstance } from "./controllers/socketController"

dotenv.config()
const origin_url=process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')
: [];
const app:Express=express();
app.use(express.json());
app.use(clerkMiddleware())
app.use(cors({
    origin: origin_url, // Replace with your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // If you're using cookies or authentication
  })); 

const PORT=process.env.VIDEO_SERVICE_PORT || 4000

app.use("/api/videos",videoRouter)
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocketServer(httpServer);

setSocketInstance(io);

httpServer.listen(PORT,()=>{
    console.log(`Server is running at PORT:${PORT}`)
})

