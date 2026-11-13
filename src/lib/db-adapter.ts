import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export function isLocalDatabaseUrl(connectionString: string | undefined): boolean {
  if (!connectionString) return false;
  try {
    return LOCAL_HOSTS.has(new URL(connectionString).hostname);
  } catch {
    return false;
  }
}

export function createDatabaseAdapter(connectionString: string | undefined) {
  if (isLocalDatabaseUrl(connectionString)) return new PrismaPg({ connectionString });
  return new PrismaNeon({ connectionString });
}
