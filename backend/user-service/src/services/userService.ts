import prisma from "../utils/dbconnection.config";
import { userType } from "@/utils/types";

export class UserService {
  /**
   * Create a new user in the database
   */
  static async createUser(data: userType) {
    const existingUser = await prisma.users.findUnique({
      where: { id: data.id },
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const ISO_date = new Date(data.created_at).toISOString();
    const userData = { ...data, created_at: ISO_date };
    
    const user = await prisma.users.create({ data: userData });
    return user;
  }

  /**
   * Update an existing user
   */
  static async updateUser(id: string, data: any) {
    const ISO_date = new Date(data.created_at).toISOString();
    const userData = { ...data, created_at: ISO_date };

    const result = await prisma.users.update({
      data: userData,
      where: { id },
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
