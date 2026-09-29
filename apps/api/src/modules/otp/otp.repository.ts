import type { Pool } from 'pg';

export interface OtpRecord {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
  createdAt: Date;
}

export interface OtpRepository {
  create(input: { userId: string; codeHash: string; expiresAt: Date; now: Date }): Promise<OtpRecord>;
  /** The newest code that hasn't been used or superseded, if any. */
  findActive(userId: string): Promise<OtpRecord | null>;
  /** Marks every unused code for the user as consumed, so only the newest code ever works. */
  invalidateActive(userId: string, now: Date): Promise<void>;
  delete(id: string): Promise<void>;
  /** Creation times of codes sent since `since`, newest first. */
  listSendTimesSince(userId: string, since: Date): Promise<Date[]>;
  /**
   * Atomically records one wrong attempt. Returns the new attempt count, or null if the
   * code was already consumed or out of attempts, so concurrent guesses can't exceed the cap.
   */
  recordFailedAttempt(id: string, maxAttempts: number): Promise<number | null>;
  /**
   * Atomically consumes the code and marks the user's email verified, only if the code is
   * still unused, unexpired and under the attempt cap. Returns false if it lost that race.
   */
  consumeAndVerifyUser(id: string, now: Date, maxAttempts: number): Promise<boolean>;
}

interface OtpRow {
  id: string;
  user_id: string;
  code_hash: string;
  expires_at: Date;
  attempts: number;
  consumed_at: Date | null;
  created_at: Date;
}

const toRecord = (row: OtpRow): OtpRecord => ({
  id: row.id,
  userId: row.user_id,
  codeHash: row.code_hash,
  expiresAt: row.expires_at,
  attempts: row.attempts,
  consumedAt: row.consumed_at,
  createdAt: row.created_at,
});

export function createPgOtpRepository(pool: Pool): OtpRepository {
  return {
    async create({ userId, codeHash, expiresAt, now }) {
      const { rows } = await pool.query<OtpRow>(
        `INSERT INTO email_otps (user_id, code_hash, expires_at, created_at)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userId, codeHash, expiresAt, now],
      );
      return toRecord(rows[0]!);
    },

    async findActive(userId) {
      const { rows } = await pool.query<OtpRow>(
        `SELECT * FROM email_otps
         WHERE user_id = $1 AND consumed_at IS NULL
         ORDER BY created_at DESC LIMIT 1`,
        [userId],
      );
      return rows[0] ? toRecord(rows[0]) : null;
    },

    async invalidateActive(userId, now) {
      await pool.query(`UPDATE email_otps SET consumed_at = $2 WHERE user_id = $1 AND consumed_at IS NULL`, [
        userId,
        now,
      ]);
    },

    async delete(id) {
      await pool.query(`DELETE FROM email_otps WHERE id = $1`, [id]);
    },

    async listSendTimesSince(userId, since) {
      const { rows } = await pool.query<{ created_at: Date }>(
        `SELECT created_at FROM email_otps
         WHERE user_id = $1 AND created_at > $2
         ORDER BY created_at DESC`,
        [userId, since],
      );
      return rows.map((row) => row.created_at);
    },

    async recordFailedAttempt(id, maxAttempts) {
      const { rows } = await pool.query<{ attempts: number }>(
        `UPDATE email_otps SET attempts = attempts + 1
         WHERE id = $1 AND consumed_at IS NULL AND attempts < $2
         RETURNING attempts`,
        [id, maxAttempts],
      );
      return rows[0]?.attempts ?? null;
    },

    async consumeAndVerifyUser(id, now, maxAttempts) {
      const { rowCount } = await pool.query(
        `WITH consumed AS (
           UPDATE email_otps SET consumed_at = $2
           WHERE id = $1 AND consumed_at IS NULL AND attempts < $3 AND expires_at > $2
           RETURNING user_id
         )
         UPDATE users SET email_verified_at = $2, updated_at = $2
         WHERE id IN (SELECT user_id FROM consumed)`,
        [id, now, maxAttempts],
      );
      return rowCount === 1;
    },
  };
}
