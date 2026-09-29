import type { TaskCategory } from '@padosipro/shared';

/** Case-insensitive match on task name, description or category name; drops empty categories. */
export function filterCatalogue(categories: TaskCategory[], query: string): TaskCategory[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return categories;

  return categories
    .map((category) => {
      if (category.name.toLowerCase().includes(needle)) return category;
      const tasks = category.tasks.filter(
        (task) => task.name.toLowerCase().includes(needle) || task.description.toLowerCase().includes(needle),
      );
      return { ...category, tasks };
    })
    .filter((category) => category.tasks.length > 0);
}
