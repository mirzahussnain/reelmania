import { lazy } from "react";

export const routes = {
  Home: lazy(() => import("../../pages/Home")),
  ManageProfile: lazy(() => import("../../pages/ManageProfile")),
  ManageVideos: lazy(() => import("../../pages/ManageVideos")),
  VideoInfo: lazy(() => import("../../pages/VideoInfo")),
  SignIn: lazy(() => import("../../pages/SignIn")),
  SignUp: lazy(() => import("../../pages/SignUp")),
  UserProfile: lazy(() => import("../../pages/UserProfile")),
  Explore: lazy(() => import("../../pages/Explore")),
  Welcome: lazy(() => import("../../pages/Welcome")),
  NotFound: lazy(() => import("../../pages/NotFound")),
  Admin: lazy(() => import("../../pages/Admin")),
};