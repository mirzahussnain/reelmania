import { lazy } from "react";

export const loadLazyRoute = (path: string) => lazy(() => {
  if (path.includes("Home")) return import("../../pages/Home");
  if (path.includes("ManageProfile")) return import("../../pages/ManageProfile");
  if (path.includes("ManageVideos")) return import("../../pages/ManageVideos");
  if (path.includes("VideoInfo")) return import("../../pages/VideoInfo");
  if (path.includes("SignIn")) return import("../../pages/SignIn");
  if (path.includes("SignUp")) return import("../../pages/SignUp");
  if (path.includes("UserProfile")) return import("../../pages/UserProfile");
  if(path.includes("Explore")) return import("../../pages/Explore");
  if(path.includes("Welcome")) return import("../../pages/Welcome");
  if(path.includes("NotFound")) return import("../../pages/NotFound");
  if(path.includes("Admin")) return import("../../pages/Admin");

  return Promise.reject(new Error("Unknown path"));
});