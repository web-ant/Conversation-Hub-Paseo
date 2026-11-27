import { containsMember, type Group } from './model';
export interface ChatLocation { hostId:string;id:string;key:string }
export interface FollowPlan { hostId:string;keys:string[] }
/** Resolve the canonical folder, including cross-host assignments and a nested chat’s parent. */
export function followPlan(active:ChatLocation, groupsByHost:readonly {hostId:string;groups:readonly Group[]}[], mode:'manual'|'project'|'server'|'server-project', projectKey?:string, parent?:ChatLocation):FollowPlan|null {
  const find=(chat:ChatLocation)=>groupsByHost.flatMap(host=>host.groups.filter(group=>containsMember(group.agentIds,host.hostId,chat.hostId,chat.id)).map(group=>({host,group})))[0];
  const target=parent??active;
  const found=find(target);
  const keys:string[]=[];
  const hostId=found?.host.hostId ?? target.hostId;
  if(!groupsByHost.some(host=>host.hostId===hostId))return null;
  if(found){
    const chain:Group[]=[];let group:Group|undefined=found.group;const seen=new Set<string>();
    while(group&&!seen.has(group.id)){seen.add(group.id);chain.unshift(group);group=found.host.groups.find(g=>g.id===group!.parentId);}
    if((mode==='server'||mode==='server-project')&&!chain[0]?.topLevel)keys.push(`host:${hostId}`);
    for(const folder of chain)keys.push(folder.projectKey?`project:${folder.projectKey}`:`folder:${hostId}:${folder.id}`);
  }else if(mode==='manual')keys.push(`folder:${hostId}:ungrouped`);
  else {
    if(mode!=='project')keys.push(`host:${hostId}`);
    if(mode!=='server'){if(!projectKey)return null;keys.push(`project:${projectKey}`);}
  }
  if(parent)keys.push(`subtasks:${parent.key}`);
  return {hostId,keys};
}
/** Scroll only far enough to reveal a clipped row; never move keyboard focus. */
export function revealOffset(row:{top:number;height:number},viewport:{top:number;height:number},offset:number):number {
  const top=viewport.top+4,bottom=viewport.top+viewport.height-4;
  if(row.top<top)return Math.max(0,offset+row.top-top);
  if(row.top+row.height>bottom)return Math.max(0,offset+row.top+row.height-bottom);
  return offset;
}
