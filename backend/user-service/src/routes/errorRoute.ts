import express, { Request, Response } from "express";
import { signInError } from "@/controllers/errorController";

const errorRouter = express.Router();
errorRouter.get("/sign-in", signInError);

export default errorRouter
