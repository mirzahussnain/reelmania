import { createSlice, createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../../store";
import { curationApi } from "./curationApi";

/**
 * Curation client-state: the flat set of videoIds the user has curated.
 *
 * This is NOT a second source of truth — it's a denormalized projection of the
 * curation-service `curated-ids` endpoint, kept in sync via RTK Query matchers.
 * Holding it here lets `selectSavedVideoIds` stay an O(1) `Set.has()` lookup
 * across every feed card without each card subscribing to the query (one
 * app-level subscription in CurationProvider keeps it fresh; mutations
 * invalidate the `CuratedIds` tag → refetch → this matcher updates the set).
 */
interface CollectionsState {
  savedVideoIds: string[];
}

const initialState: CollectionsState = {
  savedVideoIds: [],
};

const collectionsSlice = createSlice({
  name: "collections",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addMatcher(curationApi.endpoints.getCuratedIds.matchFulfilled, (state, action) => {
      state.savedVideoIds = action.payload.data ?? [];
    });
    // Optimistic add so the bookmark flips instantly; the CuratedIds refetch
    // then reconciles. (Removal isn't mirrored optimistically: a video may live
    // in another collection, so we let the refetch decide the true set.)
    builder.addMatcher(curationApi.endpoints.addItem.matchFulfilled, (state, action) => {
      const id = action.payload.data?.videoId;
      if (id && !state.savedVideoIds.includes(id)) state.savedVideoIds.push(id);
    });
  },
});

export default collectionsSlice.reducer;

/**
 * Memoized set of every curated videoId. Recomputes only when the underlying
 * array changes, so `useIsCurated` is an O(1) `.has()` per card.
 */
export const selectSavedVideoIds = createSelector(
  (state: RootState) => state.collections.savedVideoIds,
  (ids) => new Set(ids)
);
