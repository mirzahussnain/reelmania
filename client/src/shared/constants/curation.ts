/**
 * Curation vocabulary — the single source for Kinetix's coined terms, so a
 * rebrand is a one-line change here rather than a hunt across components.
 *
 *   Kine  = a video inside a collection   (Kinescope → "Kine")
 *   Scope = a collection of Kines         (Kinescope → "Scope")
 *
 * Together "Kine" + "Scope" reconstruct Kinescope, the historical word for
 * recording moving pictures.
 */
export const COLLECTION_UNIT = "Kine"; // one video
export const COLLECTION_NOUN = "Scope"; // one collection
export const COLLECTION_NOUN_PLURAL = "Scopes";

/** "1 Kine" / "12 Kines" — the video count shown on cards and the modal. */
export const collectionCountLabel = (n: number): string =>
  `${n} ${n === 1 ? COLLECTION_UNIT : `${COLLECTION_UNIT}s`}`;
