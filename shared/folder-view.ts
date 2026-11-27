import type { Group } from './model';
export type FolderPatch = Partial<Pick<Group, 'name' | 'icon' | 'color' | 'pinned' | 'workspacePaths'>>;
export interface FolderEntry { group: Group; depth: number; pinnedSection: boolean; renderKey: string }
export function matchesFolder(group: Pick<Group, 'name'>, search: string): boolean {
  const query = search.trim().toLocaleLowerCase();
  return !query || group.name.toLocaleLowerCase().includes(query);
}
/** A pinned folder is a shortcut; its canonical row and parent membership stay in place. */
export function favoriteFolderRoots(groups: readonly Group[]): Group[] {
  return groups.filter(group=>group.pinned && (!group.parentId || !groups.some(parent=>parent.id===group.parentId && parent.pinned)));
}
export function folderEntries(groups: readonly Group[], isOpen: (id: string) => boolean, showPinned = true, search = ''): FolderEntry[] {
  const result: FolderEntry[] = [];
  const matches = (group: Group) => matchesFolder(group, search);
  const append=(group:Group,pinnedSection:boolean)=>{
    const prefix=pinnedSection?'favorite':'regular';
    result.push({group,depth:0,pinnedSection,renderKey:JSON.stringify([prefix,group.id])});
    if(!group.projectKey&&isOpen(group.id))for(const child of groups.filter(item=>item.parentId===group.id&&matches(item)))
      result.push({group:child,depth:1,pinnedSection,renderKey:JSON.stringify([prefix,group.id,child.id])});
  };
  if(showPinned)for(const group of favoriteFolderRoots(groups).filter(matches))append(group,true);
  for(const group of groups.filter(item=>!item.parentId&&matches(item)))append(group,false);
  // A matching child is still a search result when its parent name does not match.
  for(const group of groups.filter(item=>!!item.parentId&&matches(item)&&!groups.some(parent=>parent.id===item.parentId&&matches(parent))))
    result.push({group,depth:0,pinnedSection:false,renderKey:JSON.stringify(['regular',group.id])});
  return result;
}
export function pinnedFirst<T extends { pinned?: boolean }>(groups: readonly T[]): T[] {
  return [...groups.filter(group => group.pinned), ...groups.filter(group => !group.pinned)];
}
/** Optional settings keys must be absent, never undefined: Paseo validates z.json() before sending. */
export function applyFolderPatch(group:Group,patch:FolderPatch):Group {
  const next={...group,...patch};
  if(next.icon===undefined)delete next.icon;
  if(next.color===undefined)delete next.color;
  if(next.workspacePaths===undefined)delete next.workspacePaths;
  return next;
}
