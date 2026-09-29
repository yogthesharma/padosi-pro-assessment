import type { SelectedTask, TaskCategory } from '@padosipro/shared';
import type { Pool } from 'pg';

export type { SelectedTask, TaskCategory };

export interface TasksRepository {
  listCatalogue(): Promise<TaskCategory[]>;
  findExistingIds(ids: string[]): Promise<string[]>;
  listSelected(userId: string): Promise<SelectedTask[]>;
  countSelected(userId: string): Promise<number>;
  /** Replaces the user's whole selection in one transaction. */
  replaceSelection(userId: string, taskIds: string[], now: Date): Promise<void>;
}

interface CatalogueRow {
  category_id: string;
  category_name: string;
  category_description: string;
  category_icon: string;
  task_id: string;
  task_name: string;
  task_description: string;
}

export function createPgTasksRepository(pool: Pool): TasksRepository {
  return {
    async listCatalogue() {
      const { rows } = await pool.query<CatalogueRow>(
        `SELECT c.id AS category_id, c.name AS category_name, c.description AS category_description,
                c.icon AS category_icon, t.id AS task_id, t.name AS task_name, t.description AS task_description
         FROM task_categories c
         JOIN tasks t ON t.category_id = c.id
         ORDER BY c.sort_order, t.sort_order`,
      );

      const categories = new Map<string, TaskCategory>();
      for (const row of rows) {
        let category = categories.get(row.category_id);
        if (!category) {
          category = {
            id: row.category_id,
            name: row.category_name,
            description: row.category_description,
            icon: row.category_icon,
            tasks: [],
          };
          categories.set(row.category_id, category);
        }
        category.tasks.push({ id: row.task_id, name: row.task_name, description: row.task_description });
      }
      return [...categories.values()];
    },

    async findExistingIds(ids) {
      const { rows } = await pool.query<{ id: string }>(`SELECT id FROM tasks WHERE id = ANY($1::text[])`, [ids]);
      return rows.map((row) => row.id);
    },

    async listSelected(userId) {
      const { rows } = await pool.query<CatalogueRow>(
        `SELECT c.id AS category_id, c.name AS category_name, c.icon AS category_icon,
                t.id AS task_id, t.name AS task_name, t.description AS task_description
         FROM user_tasks ut
         JOIN tasks t ON t.id = ut.task_id
         JOIN task_categories c ON c.id = t.category_id
         WHERE ut.user_id = $1
         ORDER BY c.sort_order, t.sort_order`,
        [userId],
      );
      return rows.map((row) => ({
        id: row.task_id,
        name: row.task_name,
        description: row.task_description,
        category: { id: row.category_id, name: row.category_name, icon: row.category_icon },
      }));
    },

    async countSelected(userId) {
      const { rows } = await pool.query<{ count: string }>(`SELECT count(*) FROM user_tasks WHERE user_id = $1`, [
        userId,
      ]);
      return Number(rows[0]?.count ?? 0);
    },

    async replaceSelection(userId, taskIds, now) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`DELETE FROM user_tasks WHERE user_id = $1`, [userId]);
        await client.query(
          `INSERT INTO user_tasks (user_id, task_id, created_at)
           SELECT $1, unnest($2::text[]), $3`,
          [userId, taskIds, now],
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
