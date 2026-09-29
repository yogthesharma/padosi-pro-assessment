import { z } from 'zod';

export const MAX_SELECTED_TASKS = 50;

export const selectTasksSchema = z.object({
  taskIds: z
    .array(z.string().trim().min(1, 'Task id cannot be empty.').max(64), { error: 'taskIds must be a list of task ids.' })
    .min(1, 'Pick at least one task.')
    .max(MAX_SELECTED_TASKS, `You can pick at most ${MAX_SELECTED_TASKS} tasks.`)
    .transform((ids) => [...new Set(ids)]),
});
