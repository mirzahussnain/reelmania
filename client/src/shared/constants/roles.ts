// Canonical role taxonomy (Phase 7.3) — the single source of truth shared by
// the client guards and the Admin role editor.
//
// Two distinct dimensions, deliberately:
//  • App role  — stored on the DB user record (users.role). Describes what a
//    user IS in the product: a Consumer, a Creator, or a Curator.
//  • Admin     — granted via Clerk publicMetadata.role === "admin". Gates the
//    /admin area and privileged mutations. NOT a DB app-role.

export const APP_ROLES = {
  CONSUMER: "Consumer",
  CREATOR: "Creator",
  CURATOR: "Curator",
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

/** Selectable app roles (e.g. the Admin role editor). */
export const APP_ROLE_VALUES = Object.values(APP_ROLES) as AppRole[];

/** Clerk publicMetadata.role value that grants admin access. */
export const ADMIN_ROLE = "admin" as const;

export type Role = AppRole | typeof ADMIN_ROLE;
