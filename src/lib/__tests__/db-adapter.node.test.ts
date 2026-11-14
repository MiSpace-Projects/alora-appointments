import { isLocalDatabaseUrl } from '@/lib/db-adapter';

describe('isLocalDatabaseUrl', () => {
  it('treats localhost databases as local', () => {
    expect(isLocalDatabaseUrl('postgresql://u:p@localhost:5435/alora')).toBe(true);
    expect(isLocalDatabaseUrl('postgresql://u:p@127.0.0.1:5432/db')).toBe(true);
  });

  it('treats hosted databases as remote', () => {
    expect(isLocalDatabaseUrl('postgresql://u:p@ep-x.eu-west-2.aws.neon.tech/neondb')).toBe(false);
  });

  it('treats missing or invalid urls as remote', () => {
    expect(isLocalDatabaseUrl(undefined)).toBe(false);
    expect(isLocalDatabaseUrl('not a url')).toBe(false);
  });
});
