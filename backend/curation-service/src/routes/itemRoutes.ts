import express from "express";
import { addItem, removeItem, updateItem } from "../controllers/itemController";
import { authMiddleware } from "../middlewares/authMiddleware";

// mergeParams so :collectionId from the parent collections router is visible.
const itemRouter = express.Router({ mergeParams: true });

// All item mutations are owner-only (enforced in the controller after load).
itemRouter.post("/", authMiddleware, addItem);
itemRouter.put("/:videoId", authMiddleware, updateItem);
itemRouter.delete("/:videoId", authMiddleware, removeItem);

export default itemRouter;
