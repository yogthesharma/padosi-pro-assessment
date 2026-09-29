import pg from 'pg';

export function createPool(connectionString: string) {
  return new pg.Pool({ connectionString, max: 10 });
}

/** Waits for Postgres to accept connections (useful when the API starts alongside the database). */
export async function waitForDatabase(pool: pg.Pool, { attempts = 30, delayMs = 1000 } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (error) {
      if (attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
