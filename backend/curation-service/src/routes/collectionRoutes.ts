import express from "express";
import {
  createCollection,
  listCollections,
  getCollectionBySlug,
  updateCollection,
  deleteCollection,
} from "../controllers/collectionController";
import { authMiddleware } from "../middlewares/authMiddleware";
import itemRouter from "./itemRoutes";

const collectionRouter = express.Router();

// Items live under a collection: /collections/:collectionId/items
collectionRouter.use("/:collectionId/items", itemRouter);

// Shareable read URL (public; private collections gated to owner in controller).
collectionRouter.get("/owner/:ownerId/slug/:slug", getCollectionBySlug);

// List — public (defaults to caller's own when authenticated; ?ownerId for others).
collectionRouter.get("/", listCollections);

// Mutations — authenticated; owner-only enforced in the controllers.
collectionRouter.post("/", authMiddleware, createCollection);
collectionRouter.put("/:id", authMiddleware, updateCollection);
collectionRouter.delete("/:id", authMiddleware, deleteCollection);

export default collectionRouter;
