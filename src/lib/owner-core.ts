export function parseOwnerAllowlist(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isOwnerEmail(email: string | null | undefined, allowlist: string[]): boolean {
  if (!email || allowlist.length === 0) return false;
  return allowlist.includes(email.toLowerCase());
}

export interface OwnerCandidate {
  email: string | null | undefined;
  emailVerified: boolean | null | undefined;
}

export function isOwnerUser(user: OwnerCandidate | null | undefined, allowlist: string[]): boolean {
  if (!user || user.emailVerified !== true) return false;
  return isOwnerEmail(user.email, allowlist);
}
