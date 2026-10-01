export function parseAdminEmails(list: string | undefined): string[] {
  return (list ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
}

/** Exact, case-insensitive match against the staff allow-list. An empty list admits nobody. */
export function isAdminEmail(email: string, list: string | undefined): boolean {
  return parseAdminEmails(list).includes(email.trim().toLowerCase());
}
