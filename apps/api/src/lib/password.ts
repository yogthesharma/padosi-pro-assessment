import bcrypt from 'bcryptjs';

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export function createBcryptHasher(cost: number): PasswordHasher {
  // Compared against when the email is unknown, so "no such user" and "wrong password" take similar time.
  const dummyHash = bcrypt.hashSync('timing-equaliser-not-a-real-password', cost);

  return {
    hash: (plain) => bcrypt.hash(plain, cost),
    verify: (plain, hash) => bcrypt.compare(plain, hash || dummyHash),
  };
}
