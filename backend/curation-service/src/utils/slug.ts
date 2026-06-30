/**
 * URL-safe slug generation for collections.
 *
 * Slugs are unique PER OWNER (schema `@@unique([ownerId, slug])`) so they form a
 * stable shareable URL: /vault/:owner/:slug. The base slug is derived from the
 * title; collisions within an owner are resolved by the caller appending a short
 * suffix (see collectionController.createUniqueSlug).
 */
export const slugify = (input: string): string => {
  const base = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics (combining marks)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics → hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .slice(0, 60);

  // Never return an empty slug (e.g. a title of only emoji/symbols).
  return base || "collection";
};

/** Short random suffix used to de-duplicate a slug within an owner. */
export const randomSuffix = (): string => Math.random().toString(36).slice(2, 7);
