import express from 'express';

const errorRouter = express.Router();

errorRouter.get("/sign-in", (req, res) => {
    res.status(401).send({message:"User not authenticated"})
    return;
})

export default errorRouter;