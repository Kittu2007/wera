/**
 * List of authorized admin emails for the WERA platform.
 */
export const ADMIN_EMAILS = [
  "dhamansai5@gmail.com",
  "merch.wera@gmail.com",
];

/**
 * Checks if a given email belongs to an authorized admin.
 * @param email - The user's email address.
 * @returns true if the user is an admin, false otherwise.
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
