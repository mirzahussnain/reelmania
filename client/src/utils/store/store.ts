import { configureStore } from "@reduxjs/toolkit";
import { userApi } from "./features/user/userApi";
import { setupListeners } from "@reduxjs/toolkit/query";
import userSlice from "./features/user/userSlice";
import { videoApi } from "./features/video/videoApi";
import authSlice from "./features/user/authSlice";
import videoSlice from "./features/video/videoSlice";
import collectionsSlice from "./features/collections/collectionsSlice";
import { curationApi } from "./features/collections/curationApi";
import storage from "redux-persist/lib/storage";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";

import persistReducer from "redux-persist/es/persistReducer";

// Only the user profile is persisted, under its own unique key. Previously
// three reducers shared key "root" and clobbered each other in localStorage.
// The auth token is intentionally NOT persisted (it is re-issued by Clerk on
// load) and the video feed is server data that should always be re-fetched.
const userPersistConfig = {
  key: "user",
  version: 1,
  storage,
};

const persistedUser = persistReducer(userPersistConfig, userSlice);

export const store = configureStore({
  reducer: {
    user: persistedUser,
    auth: authSlice,
    video: videoSlice,
    collections: collectionsSlice,
    [userApi.reducerPath]: userApi.reducer,
    [videoApi.reducerPath]: videoApi.reducer,
    [curationApi.reducerPath]: curationApi.reducer,
  },
  middleware(getDefaultMiddleware) {
    return getDefaultMiddleware({
      serializableCheck: {
        // redux-persist dispatches these non-serializable actions.
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })
      .concat(userApi.middleware)
      .concat(videoApi.middleware)
      .concat(curationApi.middleware);
  },
});

setupListeners(store.dispatch);
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
