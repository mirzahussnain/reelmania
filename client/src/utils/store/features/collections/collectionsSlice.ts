import { createSlice, PayloadAction, nanoid } from "@reduxjs/toolkit";

/**
 * Session-only mock of the curation domain (curation-service `Collection` /
 * `CollectionItem`). NOT persisted — a UI stand-in until curation-service
 * exists; swap the data source for RTK Query hooks later without touching the
 * components.
 *
 * We store a lightweight video snapshot per item (not just the id) so previews
 * and the collection modal can render without a separate lookup. The real
 * service will keep only `videoId` and resolve display fields at read time.
 */
export interface MockCollectionItem {
  id: string; // → videos.id
  title: string;
  video_url: string;
  username?: string;
}

export interface MockCollection {
  id: string;
  title: string;
  items: MockCollectionItem[];
  createdAt: number;
}

interface CollectionsState {
  items: MockCollection[];
}

const initialState: CollectionsState = {
  items: [],
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
        payload: { id: nanoid(), title: title.trim(), items: [] as MockCollectionItem[], createdAt: Date.now() },
      }),
    },
    toggleVideoInCollection: (
      state,
      action: PayloadAction<{ collectionId: string; item: MockCollectionItem }>
    ) => {
      const collection = state.items.find((c) => c.id === action.payload.collectionId);
      if (!collection) return;
      const idx = collection.items.findIndex((i) => i.id === action.payload.item.id);
      if (idx >= 0) collection.items.splice(idx, 1);
      else collection.items.push(action.payload.item);
    },
    deleteCollection: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((c) => c.id !== action.payload);
    },
  },
});

export const { createCollection, toggleVideoInCollection, deleteCollection } = collectionsSlice.actions;
export default collectionsSlice.reducer;
