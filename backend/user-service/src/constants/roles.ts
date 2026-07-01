// Single source of truth for the app-role taxonomy on the server side.
// Mirrors the Prisma `Role` enum (schema.prisma) and the client's
// shared/constants/roles.ts. Keep these three in sync.
//
//  • Curator — every user; the default for new accounts.
//  • Admin   — reserved privileged role.
//
// "Creator" is deliberately NOT a stored role: it is derived at point-of-use
// (has uploaded / has a payout account), so tracking it here would be dead
// abstraction. The natural gate (uploading / selling) is the real signal.

export const ROLES = {
  CURATOR: "Curator",
  ADMIN: "Admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Role assigned to every new user. */
export const DEFAULT_ROLE: Role = ROLES.CURATOR;

const ROLE_VALUES = new Set<string>(Object.values(ROLES));

/** O(1) membership check — narrows an unknown value to a valid Role. */
export const isValidRole = (value: unknown): value is Role =>
  typeof value === "string" && ROLE_VALUES.has(value);

/**
 * Coerce any inbound value (legacy `"Consumer"`, a bad env, a malformed event)
 * to a valid Role, falling back to the default. Used on every write path so an
 * invalid role can never reach the enum column.
 */
export const normalizeRole = (value: unknown): Role =>
  isValidRole(value) ? value : DEFAULT_ROLE;
