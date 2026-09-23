import { prisma } from './prisma';

interface ExpectedSignUp {
  email: string;
  name: string;
}

interface PersistedSignUpUser {
  id: string;
  email: string;
  name: string;
}

type FindUserById = (id: string) => Promise<PersistedSignUpUser | null>;

export type SignUpPersistence = 'CREATED' | 'DUPLICATE' | 'INVALID';

function responseUserId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || !('user' in payload)) return null;
  const user = payload.user;
  if (!user || typeof user !== 'object' || !('id' in user)) return null;
  return typeof user.id === 'string' && user.id.length > 0 ? user.id : null;
}

const findUserById: FindUserById = (id) =>
  prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });

export async function verifyPersistedSignUp(
  payload: unknown,
  expected: ExpectedSignUp,
  findPersistedUser: FindUserById = findUserById,
): Promise<SignUpPersistence> {
  const userId = responseUserId(payload);
  if (!userId) return 'INVALID';

  const persistedUser = await findPersistedUser(userId);
  if (!persistedUser) return 'DUPLICATE';

  if (persistedUser.email !== expected.email || persistedUser.name !== expected.name) {
    return 'INVALID';
  }

  return 'CREATED';
}
