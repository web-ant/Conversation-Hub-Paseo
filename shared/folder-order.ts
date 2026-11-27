import type { Group } from './model';

export type FolderSortBy = 'manual' | 'title' | 'activity';

/** Sort presentation only. Filtering this array by parent preserves each sibling order. */
export function orderFolders(
  groups: readonly Group[],
  sortBy: FolderSortBy = 'manual',
  direction: 'asc' | 'desc' = 'asc',
  activityByMember: ReadonlyMap<string, number> = new Map(),
): Group[] {
  if (sortBy === 'manual') return [...groups];
  const activity = new Map<string, number>();
  for (const group of groups) {
    const latest = group.agentIds.reduce((time, id) => Math.max(time, activityByMember.get(id) ?? 0), 0);
    activity.set(group.id, Math.max(activity.get(group.id) ?? 0, latest));
    if (group.parentId) activity.set(group.parentId, Math.max(activity.get(group.parentId) ?? 0, latest));
  }
  const sign = direction === 'desc' ? -1 : 1;
  return [...groups].sort((a, b) => {
    const title = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    if (sortBy === 'title') return sign * title;
    const timeA = activity.get(a.id) ?? 0, timeB = activity.get(b.id) ?? 0;
    // Folders without activity stay last in either direction.
    if (!!timeA !== !!timeB) return timeA ? -1 : 1;
    return sign * (timeA - timeB) || title;
  });
}
