import { authenticateRequest, clerkClient, getAuth } from "@clerk/express";
import { Response,NextFunction,Request } from "express";


export const authMiddleware=async (req:Request, res:Response, next:NextFunction)=> {
    const auth=getAuth(req);
    if(auth.userId===null){
        return res.redirect("/api/users/errors/sign-in")
    }
    next();
}