import type { ProfileInput } from '@padosipro/shared';
import type { Pool } from 'pg';

export interface Profile extends ProfileInput {
  userId: string;
  updatedAt: Date;
}

export interface ProfileRepository {
  findByUserId(userId: string): Promise<Profile | null>;
  upsert(userId: string, input: ProfileInput, now: Date): Promise<Profile>;
}

interface ProfileRow {
  user_id: string;
  name: string;
  mobile: string;
  address: string;
  business_name: string | null;
  updated_at: Date;
}

const toProfile = (row: ProfileRow): Profile => ({
  userId: row.user_id,
  name: row.name,
  mobile: row.mobile,
  address: row.address,
  businessName: row.business_name,
  updatedAt: row.updated_at,
});

export function createPgProfileRepository(pool: Pool): ProfileRepository {
  return {
    async findByUserId(userId) {
      const { rows } = await pool.query<ProfileRow>(`SELECT * FROM profiles WHERE user_id = $1`, [userId]);
      return rows[0] ? toProfile(rows[0]) : null;
    },

    async upsert(userId, input, now) {
      const { rows } = await pool.query<ProfileRow>(
        `INSERT INTO profiles (user_id, name, mobile, address, business_name, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $6)
         ON CONFLICT (user_id) DO UPDATE SET
           name = EXCLUDED.name,
           mobile = EXCLUDED.mobile,
           address = EXCLUDED.address,
           business_name = EXCLUDED.business_name,
           updated_at = EXCLUDED.updated_at
         RETURNING *`,
        [userId, input.name, input.mobile, input.address, input.businessName, now],
      );
      return toProfile(rows[0]!);
    },
  };
}
