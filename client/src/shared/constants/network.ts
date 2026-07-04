/**
 * Network vocabulary — kept in one place so the wording is a one-line rebrand
 * (mirrors curation.ts's Kine/Scope). The follow graph is a set of DIRECTED
 * edges, so the labels are split by role to avoid the ambiguous "Network count":
 *
 *   Directional NOUNS (counts + lists) stay industry-standard so a number is
 *   never ambiguous about which direction it means:
 *     FOLLOWERS = people who follow you   (inbound edges → you)
 *     FOLLOWING = people you follow        (outbound edges → them)
 *
 *   ACTION verbs carry the Kinetix "timeline" brand vibe:
 *     SYNC   = follow
 *     UNSYNC = unfollow
 *
 *   The two-way state (both follow each other) is the one place the brand term
 *   reads best as a relationship:
 *     IN_SYNC = mutual
 */
export const NETWORK = {
  FOLLOWERS: "Followers",
  FOLLOWING: "Following",
  SYNC: "Sync",
  UNSYNC: "Unsync",
  IN_SYNC: "In Sync",
} as const;
