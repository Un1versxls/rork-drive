/**
 * Emails permitted to sign up / sign in even from a blacklisted device.
 * Used to keep developer access working after a device has been banned.
 */
export const DEV_EMAIL_ALLOWLIST: ReadonlySet<string> = new Set<string>([
  "un1@gmail.com",
]);

export function isDevAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return DEV_EMAIL_ALLOWLIST.has(email.trim().toLowerCase());
}
