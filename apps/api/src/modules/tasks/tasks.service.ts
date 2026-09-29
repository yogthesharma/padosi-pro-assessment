import type { Clock } from '../../lib/clock.js';
import { validationError } from '../../lib/errors.js';
import type { SelectedTask, TaskCategory, TasksRepository } from './tasks.repository.js';

export type TasksService = ReturnType<typeof createTasksService>;

export function createTasksService({ repository, clock }: { repository: TasksRepository; clock: Clock }) {
  return {
    listCatalogue(): Promise<TaskCategory[]> {
      return repository.listCatalogue();
    },

    listSelected(userId: string): Promise<SelectedTask[]> {
      return repository.listSelected(userId);
    },

    async saveSelection(userId: string, taskIds: string[]): Promise<SelectedTask[]> {
      const existing = new Set(await repository.findExistingIds(taskIds));
      const unknown = taskIds.filter((id) => !existing.has(id));
      if (unknown.length > 0) {
        throw validationError({ taskIds: `Unknown task${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}` });
      }
      await repository.replaceSelection(userId, taskIds, clock.now());
      return repository.listSelected(userId);
    },
  };
}
