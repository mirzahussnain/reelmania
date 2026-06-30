import express from "express";
import {
  createCollection,
  listCollections,
  getCollectionBySlug,
  getCuratedIds,
  getCoverUploadUrl,
  updateCollection,
  deleteCollection,
} from "../controllers/collectionController";
import { authMiddleware } from "../middlewares/authMiddleware";
import itemRouter from "./itemRoutes";

const collectionRouter = express.Router();

// Items live under a collection: /collections/:collectionId/items
collectionRouter.use("/:collectionId/items", itemRouter);

// Caller's flat set of curated videoIds (feed "saved" state). Static path —
// declared before dynamic routes.
collectionRouter.get("/curated-ids", authMiddleware, getCuratedIds);

// Presign a cover-image upload to curation-service's own bucket.
collectionRouter.post("/cover-upload-url", authMiddleware, getCoverUploadUrl);

// Shareable read URL (public; private collections gated to owner in controller).
collectionRouter.get("/owner/:ownerId/slug/:slug", getCollectionBySlug);

// List — public (defaults to caller's own when authenticated; ?ownerId for others).
collectionRouter.get("/", listCollections);

// Mutations — authenticated; owner-only enforced in the controllers.
collectionRouter.post("/", authMiddleware, createCollection);
collectionRouter.put("/:id", authMiddleware, updateCollection);
collectionRouter.delete("/:id", authMiddleware, deleteCollection);

export default collectionRouter;
