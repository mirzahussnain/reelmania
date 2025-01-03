import { configureStore } from "@reduxjs/toolkit";
import { userApi } from "./features/user/userApi";
import { setupListeners } from "@reduxjs/toolkit/query";
import userSlice from "./features/user/userSlice";
import uploaderSlice from "./features/video/uploaderSlice";
import { videoApi } from "./features/video/videoApi";
import authSlice from "./features/user/authSlice";
import videoSlice from "./features/video/videoSlice";
import filteredVideoSlice from "./features/video/FilteredVideoSlice.ts";
import persistStore from "redux-persist/es/persistStore";
import storage from "redux-persist/lib/storage";

import persistReducer from "redux-persist/es/persistReducer";

const persistConfig = {
  key: "root",
  version: 1,
  storage,
};

const persistedVideo = persistReducer(persistConfig, videoSlice);
const persistedUser = persistReducer(persistConfig, userSlice);
const persistedAuth = persistReducer(persistConfig, authSlice);

export const store = configureStore({
  reducer: {
    user: persistedUser,
    uploader: uploaderSlice,
    auth: persistedAuth,
    video: persistedVideo,
    filteredVideo: filteredVideoSlice,
    [userApi.reducerPath]: userApi.reducer,
    [videoApi.reducerPath]: videoApi.reducer,
  },
  middleware(getDefaultMiddleware) {
    return getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        // Ignore paths in the state
        ignoredPaths: ["register"],
      },
    })
      .concat(userApi.middleware)
      .concat(videoApi.middleware);
  },
});

setupListeners(store.dispatch);
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
