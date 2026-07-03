/**
 * Network vocabulary — Kinetix's follow verbs, kept in one place so the wording
 * is a one-line rebrand (mirrors curation.ts's Kine/Scope). The follow graph is
 * asymmetric (see the "Network = followers" model), so:
 *
 *   SYNC   = follow / connect to someone
 *   DESYNC = unfollow / disconnect
 *   SYNCED = state when you follow them
 *   MUTUAL = both follow each other ("In Sync")
 */
export const NETWORK = {
  SYNC: "Sync",
  DESYNC: "Desync",
  SYNCED: "Synced",
  MUTUAL: "In Sync",
} as const;
