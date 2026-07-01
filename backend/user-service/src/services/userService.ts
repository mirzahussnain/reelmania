import prisma from "../utils/dbconnection.config";
import { userType } from "@/utils/types";
import { normalizeRole } from "../constants/roles";

// Fields a user may set on their OWN profile. Everything else — role,
// is_founding_member, is_verified, is_active, c_score(_raw/_updated_at) — is
// server-owned and can ONLY change via privileged/admin routes or the internal
// scoring job. This allowlist is the single guard against mass-assignment: we
// NEVER spread req.body into a Prisma write, so a crafted body cannot award a
// badge, inflate a score, or self-promote.
const USER_EDITABLE_FIELDS = ["first_name", "last_name", "avatar_url", "bio"] as const;

type EditableField = (typeof USER_EDITABLE_FIELDS)[number];

/**
 * Keep only allow-listed keys whose value is a string. Non-string values are
 * dropped — this also blocks Prisma operator-injection (e.g. a nested object
 * masquerading as a filter). O(allowlist).
 */
const pickEditable = (input: Record<string, unknown>): Partial<Record<EditableField, string>> => {
  const out: Partial<Record<EditableField, string>> = {};
  for (const key of USER_EDITABLE_FIELDS) {
    const value = input?.[key];
    if (typeof value === "string") out[key] = value;
  }
  return out;
};

export class UserService {
  /**
   * Create a new user. Fields are taken EXPLICITLY (not spread) so untrusted
   * input can't set server-owned columns; status/score columns fall to their DB
   * defaults. Role is normalized so a bad value can't violate the enum.
   */
  static async createUser(data: userType) {
    const existingUser = await prisma.users.findUnique({
      where: { id: data.id },
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const user = await prisma.users.create({
      data: {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        avatar_url: data.avatar_url,
        email: data.email,
        username: data.username,
        role: normalizeRole(data.role),
        created_at: new Date(data.created_at).toISOString(),
      },
    });
    return user;
  }

  /**
   * Update a user's own profile. Only allow-listed fields are written;
   * `updated_at` is maintained automatically by Prisma (@updatedAt).
   */
  static async updateUser(id: string, input: Record<string, unknown>) {
    const data = pickEditable(input ?? {});
    const result = await prisma.users.update({
      where: { id },
      data,
    });
    return result;
  }

  /**
   * Delete a user
   */
  static async deleteUser(id: string) {
    await prisma.users.delete({
      where: { id },
    });
    return true;
  }
}
