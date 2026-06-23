// Komorebi role model (Phase 7.3) — per the product vision.
//
// Roles are a SET, not a single mutually-exclusive value:
//  • Curator — the BASE role. Every user is a Curator by default: they can
//    discover, connect, and build Vault collections.
//  • Creator — ADDITIVE. Granted once a user uploads / uses the Studio. A
//    Creator is still also a Curator (Creator ⊃ Curator).
//
// Creator status is DERIVED from activity (whether the user has uploads) rather
// than stored as a second field, so it needs no schema migration: the moment a
// user publishes their first video they are a Creator+Curator. `rolesForUser`
// is the single place that mapping lives.
//
// Admin is intentionally NOT part of the product role set — the admin role,
// dashboard and pages are not yet defined. ADMIN_ROLE exists only to back the
// existing privileged-route guard (Clerk publicMetadata.role).

export const ROLES = {
  CURATOR: "Curator",
  CREATOR: "Creator",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** The role every new user starts with. */
export const DEFAULT_ROLE: Role = ROLES.CURATOR;

/** Derive a user's role set. Everyone is a Curator; uploaders are also Creators. */
export const rolesForUser = (hasUploads: boolean): Role[] =>
  hasUploads ? [ROLES.CURATOR, ROLES.CREATOR] : [ROLES.CURATOR];

// ── Reserved ────────────────────────────────────────────────────────────────
// Admin is not a defined product concept yet; this only backs the route guard.
export const ADMIN_ROLE = "admin" as const;
