import type { Pool } from 'pg';
import { catalogue } from './catalogue.js';

/** Idempotent: upserts the catalogue, so it is safe to run on every start. */
export async function seedCatalogue(pool: Pool, log: (message: string) => void = console.log) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [categoryIndex, category] of catalogue.entries()) {
      await client.query(
        `INSERT INTO task_categories (id, name, description, icon, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, description = EXCLUDED.description,
           icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order`,
        [category.id, category.name, category.description, category.icon, categoryIndex],
      );
      for (const [taskIndex, task] of category.tasks.entries()) {
        await client.query(
          `INSERT INTO tasks (id, category_id, name, description, sort_order)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
             category_id = EXCLUDED.category_id, name = EXCLUDED.name,
             description = EXCLUDED.description, sort_order = EXCLUDED.sort_order`,
          [task.id, category.id, task.name, task.description, taskIndex],
        );
      }
    }
    await client.query('COMMIT');
    const taskCount = catalogue.reduce((total, category) => total + category.tasks.length, 0);
    log(`Seeded ${catalogue.length} categories and ${taskCount} tasks`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
