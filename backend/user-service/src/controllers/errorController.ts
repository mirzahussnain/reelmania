import { Request, Response } from "express";

export const signInError=()=>{
    (req: Request, res: Response) => {
        res.status(401).send("Sign in Required");
      }
}