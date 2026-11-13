import { PrismaClient } from '@prisma/client';
import { createDatabaseAdapter, isLocalDatabaseUrl } from '../src/lib/db-adapter';

export default async function globalSetup(): Promise<void> {
  const url = process.env.E2E_DATABASE_URL;
  if (process.env.E2E_BASE_URL || !isLocalDatabaseUrl(url)) return;
  const prisma = new PrismaClient({ adapter: createDatabaseAdapter(url) });
  await prisma.rateLimit.deleteMany({});
  await prisma.$disconnect();
}
