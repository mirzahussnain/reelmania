// Presentation-only badge assets. The SERVER decides who has which badge
// (user-service `deriveBadges` → the profile payload's `badges[]`); the client
// only maps a badge id → its image. Faking this map only changes local pixels,
// never real status. Keys MUST match the ids in
// backend/user-service/src/constants/badges.ts.

import foundingMember from "../../assets/badges/founding-member.png";
import verified from "../../assets/badges/verified.png";
import curator from "../../assets/badges/curator.png";
import topCurator from "../../assets/badges/top-curator.png";
import connected from "../../assets/badges/connected.png";
import creator from "../../assets/badges/creator.png";
import topCreator from "../../assets/badges/top-creator.png";
import seller from "../../assets/badges/seller.png";
import topSeller from "../../assets/badges/top-seller.png";
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
  curator,
  top_curator: topCurator,
  connected,
  creator,
  top_creator: topCreator,
  seller,
  top_seller: topSeller,
  bestseller,
  rising,
};

/** badge id → description, shown in the badge detail modal. */
export const BADGE_DESCRIPTIONS: Record<string, string> = {
  founding_member: "Awarded to early members who helped shape Kinetix from the very start.",
  verified: "This account has been verified by Kinetix as authentic.",
  curator: "Curates and connects on Kinetix — the foundational tastemaker role.",
  top_curator: "Ranks in the top tier of curators by C-Score — a proven tastemaker.",
  connected: "Has built a strong, active network of connections on Kinetix.",
  creator: "Creates and uploads original Kines on Kinetix.",
  top_creator: "A top creator by cumulative reach — videos, likes and views.",
  seller: "Sells original digital assets in the Kinetix marketplace.",
  top_seller: "A top-selling creator whose assets resonate across the network.",
  bestseller: "A top-selling creator whose assets resonate across the network.",
  rising: "A rapidly growing C-Score — a rising tastemaker to watch.",
};
