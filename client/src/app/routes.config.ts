import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { IconType } from "react-icons";
import {
  BiHomeAlt, BiSolidHome,
  BiCompass, BiSolidCompass,
  BiMoviePlay, BiSolidMoviePlay,
  BiCollection, BiSolidCollection,
  BiHistory, BiHeart, BiSolidHeart,
} from "react-icons/bi";
import { matchPath } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for routing, layout behaviour, access control, and nav.
// Adding/removing a route, changing its layout, or changing where it appears in
// navigation should require editing ONLY this file. App.tsx generates <Routes>
// from it; Layout/Navbar/Sidebar derive their behaviour from the helpers below.
// ─────────────────────────────────────────────────────────────────────────────

export type RouteLayout = "app" | "standalone";
export type RouteAccess = "public" | "auth" | "role:admin";
export type NavGroup = "primary" | "library";

export interface NavMeta {
  label: string;
  icon: IconType;
  activeIcon: IconType;
  group: NavGroup;
  order: number;
}

export interface AppRoute {
  path: string;
  component: LazyExoticComponent<ComponentType>;
  /** "standalone" renders without the app shell (sidebar/navbar/topbar). */
  layout: RouteLayout;
  access: RouteAccess;
  /** Show the floating Topbar over this route (desktop app layout only). */
  topbar?: boolean;
  /** Present only for routes that appear in a navbar. */
  nav?: NavMeta;
}

export const APP_ROUTES: AppRoute[] = [
  // ── Auth (standalone, no shell) ──────────────────────────────────────────
  { path: "/sign-in", component: lazy(() => import("../pages/SignIn")), layout: "standalone", access: "public" },
  { path: "/sign-up", component: lazy(() => import("../pages/SignUp")), layout: "standalone", access: "public" },

  // ── Public share pages (standalone) ──────────────────────────────────────
  { path: "/share/profile/:username", component: lazy(() => import("../pages/PublicProfile")), layout: "standalone", access: "public" },
  { path: "/share/network/:username", component: lazy(() => import("../pages/PublicNetwork")), layout: "standalone", access: "public" },

  // ── App shell, public ────────────────────────────────────────────────────
  { path: "/", component: lazy(() => import("../pages/Welcome")), layout: "app", access: "public", topbar: true },
  {
    path: "/foryou", component: lazy(() => import("../pages/Home")), layout: "app", access: "public", topbar: true,
    nav: { label: "Home", icon: BiHomeAlt, activeIcon: BiSolidHome, group: "primary", order: 1 },
  },
  {
    path: "/explore", component: lazy(() => import("../pages/Explore")), layout: "app", access: "public",
    nav: { label: "Explore", icon: BiCompass, activeIcon: BiSolidCompass, group: "primary", order: 2 },
  },
  {
    path: "/studio", component: lazy(() => import("../pages/ComingSoon")), layout: "app", access: "public",
    nav: { label: "Studio", icon: BiMoviePlay, activeIcon: BiSolidMoviePlay, group: "library", order: 1 },
  },
  {
    path: "/vault", component: lazy(() => import("../pages/Vault")), layout: "app", access: "public",
    nav: { label: "Vault", icon: BiCollection, activeIcon: BiSolidCollection, group: "library", order: 2 },
  },
  {
    path: "/history", component: lazy(() => import("../pages/ComingSoon")), layout: "app", access: "public",
    nav: { label: "History", icon: BiHistory, activeIcon: BiHistory, group: "library", order: 3 },
  },
  {
    path: "/liked", component: lazy(() => import("../pages/ComingSoon")), layout: "app", access: "public",
    nav: { label: "Liked", icon: BiHeart, activeIcon: BiSolidHeart, group: "library", order: 4 },
  },
  { path: "/users/:username", component: lazy(() => import("../pages/UserProfile")), layout: "app", access: "public" },
  { path: "/videos/:videoId", component: lazy(() => import("../pages/VideoInfo")), layout: "app", access: "public" },

  // ── App shell, requires sign-in ──────────────────────────────────────────
  { path: "/vault/network", component: lazy(() => import("../pages/NetworkRelations")), layout: "app", access: "auth" },
  { path: "/users/:userId/profile/manage", component: lazy(() => import("../pages/ManageProfile")), layout: "app", access: "auth" },
  { path: "/users/:username/videos/manage", component: lazy(() => import("../pages/ManageVideos")), layout: "app", access: "auth" },

  // ── Admin (sign-in gated today; role-gated in Phase 7) ───────────────────
  { path: "/admin", component: lazy(() => import("../pages/Admin")), layout: "app", access: "role:admin" },

  // ── Catch-all ────────────────────────────────────────────────────────────
  { path: "*", component: lazy(() => import("../pages/NotFound")), layout: "app", access: "public" },
];

/** Match a concrete pathname against the configured route patterns. */
const findRoute = (pathname: string): AppRoute | undefined =>
  APP_ROUTES.find((r) => r.path !== "*" && matchPath(r.path, pathname) !== null);

/** Routes that render outside the app shell (no sidebar/navbar/topbar). */
export const isStandaloneRoute = (pathname: string): boolean =>
  findRoute(pathname)?.layout === "standalone";

/** Whether the floating desktop Topbar should render over this route. */
export const routeHasTopbar = (pathname: string): boolean =>
  Boolean(findRoute(pathname)?.topbar);

/** Navigation entries for a given group, ordered. */
export const getNavItems = (group: NavGroup): AppRoute[] =>
  APP_ROUTES
    .filter((r) => r.nav?.group === group)
    .sort((a, b) => a.nav!.order - b.nav!.order);
