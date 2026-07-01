// Presentation-only badge assets. The SERVER decides who has which badge
// (user-service `deriveBadges` → the profile payload's `badges[]`); the client
// only maps a badge id → its image. Faking this map only changes local pixels,
// never real status. Keys MUST match the ids in
// backend/user-service/src/constants/badges.ts.

import foundingMember from "../../assets/badges/founding-member.png";
import verified from "../../assets/badges/verified.png";
import topCurator from "../../assets/badges/top-curator.png";
import connected from "../../assets/badges/connected.png";
import creator from "../../assets/badges/creator.png";
import bestseller from "../../assets/badges/bestseller.png";
import rising from "../../assets/badges/rising.png";

/** Badge item as returned by the user-service profile endpoints. */
export interface BadgeItem {
  id: string;
  label: string;
}

/** badge id → image asset. Includes v2 (creator/bestseller/rising) ready for
 *  when the server starts emitting them. */
export const BADGE_ASSETS: Record<string, string> = {
  founding_member: foundingMember,
  verified,
  top_curator: topCurator,
  connected,
  creator,
  bestseller,
  rising,
};
