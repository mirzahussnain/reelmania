import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes dynamically.
 * It resolves conflicts safely (e.g., passing 'px-2' and 'px-4' will result in only 'px-4').
 *
 * @param inputs - Array of class names, objects, or conditional classes
 * @returns A safe, merged string of Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
