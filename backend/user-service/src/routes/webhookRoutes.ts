import express from "express"
import { userManagement } from "../controllers/hookController";

const hookRouter=express.Router();
hookRouter.post('/manage',userManagement)

export default hookRouter