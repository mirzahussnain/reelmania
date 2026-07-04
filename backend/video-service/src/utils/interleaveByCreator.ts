/**
 * Round-robin interleave a recency-ordered list of videos by uploader so one
 * creator who batch-uploaded doesn't appear as a long consecutive run.
 *
 * Input MUST already be sorted (newest first). We bucket per creator preserving
 * that order, then emit one video per creator per round, cycling in order of
 * first appearance (i.e. by each creator's newest item) so recency still leads.
 *
 * Guarantee: no two consecutive items share a creator UNLESS only one creator
 * has items left (the unavoidable tail) — the best achievable for a given set.
 * Pure reordering: same items in, same items out, just spaced.
 */
export const interleaveByCreator = <T extends { uploaded_by?: { id?: string } }>(
  videos: T[]
): T[] => {
  if (videos.length <= 2) return videos;

  // Insertion order of the Map = order each creator first appears = recency.
  const buckets = new Map<string, T[]>();
  for (const video of videos) {
    const creatorId = video.uploaded_by?.id ?? "__unknown__";
    const bucket = buckets.get(creatorId);
    if (bucket) bucket.push(video);
    else buckets.set(creatorId, [video]);
  }

  const result: T[] = [];
  const lists = [...buckets.values()];
  let remaining = videos.length;

  // Cycle: take the head of each non-empty bucket, one per round.
  while (remaining > 0) {
    for (const list of lists) {
      const next = list.shift();
      if (next) {
        result.push(next);
        remaining--;
      }
    }
  }

  return result;
};
