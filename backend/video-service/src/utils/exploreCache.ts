// Explore-feed cache invalidation via a version counter.
//
// The explore grid caches each (cursor,q,type) page under an `explore:*` key.
// Busting it by scanning `KEYS explore:*` is O(keyspace) and blocks Redis's
// single thread — unacceptable on a hot path hit by every publish/edit/processed
// video. Instead we fold a monotonic version number into the cache key: bumping
// it (INCR, O(1)) instantly orphans every prior page, and the stale keys fall
// off on their own short TTL. Reads cost one extra O(1) GET.

const VERSION_KEY = "explore:cache:ver";

/** Current cache generation (string, defaults to "0"). Fail-soft. */
export const getExploreVersion = async (redis: any): Promise<string> => {
  try {
    return (await redis.get(VERSION_KEY)) ?? "0";
  } catch {
    return "0";
  }
};

/** Invalidate all cached explore pages in O(1) by advancing the generation. */
export const bumpExploreVersion = async (redis: any): Promise<void> => {
  try {
    await redis.incr(VERSION_KEY);
  } catch {
    // A missed bump only means explore is briefly stale until the 60s TTL — the
    // cache is an optimization, not a correctness dependency.
  }
};
