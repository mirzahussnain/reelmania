/**
 * Centralized user-facing copy for "you must sign in" prompts, so the same
 * concept isn't worded four different ways across the app.
 */
export const AUTH_REQUIRED = {
  follow: "Sign in to connect with creators",
  like: "Sign in to react to videos",
  comment: "Sign in to join the conversation",
  curate: "Sign in to curate videos",
} as const;
