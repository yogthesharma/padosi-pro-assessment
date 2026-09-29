import type { Pool } from 'pg';
import { AppError } from '../../lib/errors.js';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  tokenVersion: number;
  createdAt: Date;
}

export interface UsersRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(input: { email: string; passwordHash: string; now: Date }): Promise<User>;
  incrementTokenVersion(id: string): Promise<void>;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  email_verified_at: Date | null;
  token_version: number;
  created_at: Date;
}

const toUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  passwordHash: row.password_hash,
  emailVerifiedAt: row.email_verified_at,
  tokenVersion: row.token_version,
  createdAt: row.created_at,
});

const UNIQUE_VIOLATION = '23505';

export const emailTaken = () =>
  new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'An account with this email already exists. Please log in.', {
    fields: { email: 'This email is already registered.' },
  });

export function createPgUsersRepository(pool: Pool): UsersRepository {
  return {
    async findByEmail(email) {
      const { rows } = await pool.query<UserRow>(`SELECT * FROM users WHERE email = $1`, [email]);
      return rows[0] ? toUser(rows[0]) : null;
    },

    async findById(id) {
      const { rows } = await pool.query<UserRow>(`SELECT * FROM users WHERE id = $1`, [id]);
      return rows[0] ? toUser(rows[0]) : null;
    },

    async create({ email, passwordHash, now }) {
      try {
        const { rows } = await pool.query<UserRow>(
          `INSERT INTO users (email, password_hash, created_at, updated_at)
           VALUES ($1, $2, $3, $3) RETURNING *`,
          [email, passwordHash, now],
        );
        return toUser(rows[0]!);
      } catch (error) {
        if ((error as { code?: string }).code === UNIQUE_VIOLATION) throw emailTaken();
        throw error;
      }
    },

    async incrementTokenVersion(id) {
      await pool.query(`UPDATE users SET token_version = token_version + 1, updated_at = now() WHERE id = $1`, [id]);
    },
  };
}
