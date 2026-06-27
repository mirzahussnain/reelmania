// Kinetix role model (Phase 7.3) — per the product vision.
//
//  • Curator — the only role we track today. Every user IS a Curator: they can
//    discover, connect, and build Vault collections. New users default to it.
//
//  • Creator — deliberately NOT tracked as a role yet. "Creator" is a
//    descriptive status (someone who has uploaded / uses the Studio) that we
//    derive at the point of use *when a feature actually needs it* — e.g. a
//    profile badge, or marketplace "sell" permissions. Tracking it as a role
//    now would be dead abstraction: nothing gates on it, the natural gate
//    (uploading) is what grants it, and when it finally matters (selling
//    assets) the real signal is closer to "has a payout account" than
//    "videoCount > 0". So we keep the constant for labels but don't compute it.
//
//  • Admin — reserved; the admin role/dashboard is not defined. ADMIN_ROLE
//    only backs the existing privileged-route guard (Clerk publicMetadata.role).

export const ROLES = {
  CURATOR: "Curator",
  CREATOR: "Creator",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** The role every new user starts with. */
export const DEFAULT_ROLE: Role = ROLES.CURATOR;

// ── Reserved ────────────────────────────────────────────────────────────────
export const ADMIN_ROLE = "admin" as const;
