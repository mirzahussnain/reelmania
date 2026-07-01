// Single source of truth for profile badges.
//
// Badges are a DERIVED view over facts we already store — not a table. Static
// facts (is_founding_member, is_verified) live in columns; earned badges are
// computed from c_score / followers. `deriveBadges` is a pure O(rules) function
// with no DB access, so the client can stay a dumb renderer and every threshold
// has exactly one home.
//
// A stored `user_badges` table is only warranted later for arbitrary,
// admin-granted, non-derivable awards (event/campaign badges) — YAGNI now.

export const BADGES = {
  FOUNDING_MEMBER: "founding_member",
  VERIFIED: "verified",
  TOP_CURATOR: "top_curator",
  CONNECTED: "connected",
  // v2 (marketplace-service): CREATOR/SELLER (has payout account),
  // BESTSELLER (sales milestone), RISING (c_score growth — needs score history).
} as const;

export type BadgeId = (typeof BADGES)[keyof typeof BADGES];

export interface Badge {
  id: BadgeId;
  label: string;
}

const LABELS: Record<BadgeId, string> = {
  [BADGES.FOUNDING_MEMBER]: "Founding Member",
  [BADGES.VERIFIED]: "Verified",
  [BADGES.TOP_CURATOR]: "Top Curator",
  [BADGES.CONNECTED]: "Connected",
};

// c_score is already a 0–100 percentile, so "top decile" is a direct compare.
const TOP_CURATOR_PERCENTILE = 90;
const CONNECTED_FOLLOWER_MIN = 50;

export interface BadgeInputs {
  is_founding_member: boolean;
  is_verified: boolean;
  c_score: number;
  followerCount: number;
}

/** Derive the badge set for a user from facts already on the profile payload. */
export const deriveBadges = (u: BadgeInputs): Badge[] => {
  const ids: BadgeId[] = [];

  if (u.is_founding_member) ids.push(BADGES.FOUNDING_MEMBER);
  if (u.is_verified) ids.push(BADGES.VERIFIED);
  if (u.c_score >= TOP_CURATOR_PERCENTILE) ids.push(BADGES.TOP_CURATOR);
  if (u.followerCount >= CONNECTED_FOLLOWER_MIN) ids.push(BADGES.CONNECTED);

  return ids.map((id) => ({ id, label: LABELS[id] }));
};
