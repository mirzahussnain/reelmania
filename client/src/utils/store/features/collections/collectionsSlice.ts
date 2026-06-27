import { createSlice, PayloadAction, nanoid } from "@reduxjs/toolkit";

/**
 * Session-only mock of the curation domain (curation-service `Collection` /
 * `CollectionItem`). NOT persisted — it's a UI stand-in until curation-service
 * exists; swap the data source for RTK Query hooks later without touching the
 * components.
 */
export interface MockCollection {
  id: string;
  title: string;
  videoIds: string[]; // soft refs → videos.id (mirrors CollectionItem.videoId)
  createdAt: number;
}

interface CollectionsState {
  items: MockCollection[];
}

const initialState: CollectionsState = {
  items: [{ id: "c-neon", title: "Neon Circle", videoIds: [], createdAt: Date.now() }],
};

const collectionsSlice = createSlice({
  name: "collections",
  initialState,
  reducers: {
    createCollection: {
      reducer: (state, action: PayloadAction<MockCollection>) => {
        state.items.unshift(action.payload);
      },
      prepare: (title: string) => ({
        payload: { id: nanoid(), title: title.trim(), videoIds: [] as string[], createdAt: Date.now() },
      }),
    },
    toggleVideoInCollection: (
      state,
      action: PayloadAction<{ collectionId: string; videoId: string }>
    ) => {
      const collection = state.items.find((c) => c.id === action.payload.collectionId);
      if (!collection) return;
      const idx = collection.videoIds.indexOf(action.payload.videoId);
      if (idx >= 0) collection.videoIds.splice(idx, 1);
      else collection.videoIds.push(action.payload.videoId);
    },
    deleteCollection: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((c) => c.id !== action.payload);
    },
  },
});

export const { createCollection, toggleVideoInCollection, deleteCollection } = collectionsSlice.actions;
export default collectionsSlice.reducer;
