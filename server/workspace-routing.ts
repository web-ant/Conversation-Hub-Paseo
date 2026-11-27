/// <reference types="node" />
import {homedir} from 'node:os';import {join,dirname} from 'node:path';import {realpathSync} from 'node:fs';import {execFile} from 'node:child_process';
import type {PluginSettings,PluginHookAgent,PluginHookWorkspace} from '@getpaseo/plugin/server';
import type {PaseoApi} from '@getpaseo/client';
import {workspaceRouting,organization,sidebarTabs} from '../shared/settings';
import {matchWorkspaceFolder,routeNewAgent} from '../shared/workspace-routing';
import {LocalHost} from './local-host';
export class WorkspaceRouter {
 private local=new LocalHost(process.env.PASEO_HOME||join(homedir(),'.paseo'));private queue:Promise<void>=Promise.resolve();private closed=false;
 constructor(private settings:PluginSettings<typeof workspaceRouting.schema>){}
 enqueue(fn:()=>Promise<void>){const next=this.queue.then(()=>{if(!this.closed)return fn()});this.queue=next.catch(error=>console.error('Folder auto-assignment failed:',error.message));return this.queue;}
 async directories(cwd:string,worktrees:boolean){const result=[cwd];try{const real=realpathSync(cwd);if(real!==cwd)result.push(real)}catch{}if(worktrees)await new Promise<void>(resolve=>execFile('git',['-C',cwd,'rev-parse','--path-format=absolute','--git-common-dir'],{timeout:3000,maxBuffer:8192,windowsHide:true},(error,out)=>{if(!error){const git=out.trim();if(git.endsWith('/.git')||git.endsWith('\\.git'))result.push(dirname(git))}resolve()}));return result;}
 async policy(){const state=await this.settings.read();return state.status==='ready'?state.values:null;}
 async workspace(workspace:PluginHookWorkspace,paseo:PaseoApi){const policy=await this.policy();if(!policy?.enabled)return;const client=await this.local.client(),raw=await client.invokePluginRpc('conversation-hub','settings.organization.read',{})as any;if(raw.status!=='ready')return;const state=organization.schema.parse(raw.values),paths=await this.directories(workspace.cwd,policy.includeWorktrees),target=matchWorkspaceFolder(state.groups,paths,policy.includeSubdirectories);if(target)await paseo.workspaces.ref(workspace.id).setMetadata({'conversation-hub.routing':{groupId:target.id}});}
 async agent(agent:PluginHookAgent,paseo:PaseoApi){
  const policy=await this.policy();if(!policy?.enabled||agent.parentAgentId&&!policy.includeSubagents)return;
  const client=await this.local.client(),paths=await this.directories(agent.cwd,policy.includeWorktrees),hostId=(await paseo.hosts.list()).self.serverId;
  for(const id of ['organization','sidebar-tabs']as const)for(let attempt=0;attempt<5;attempt++){
   if(!(await this.policy())?.enabled)return;
   const raw=await client.invokePluginRpc('conversation-hub',`settings.${id}.read`,{})as any;if(raw.status!=='ready')return;
   let values:unknown,changed=false;
   if(id==='organization'){const state=organization.schema.parse(raw.values),next=routeNewAgent(state,agent.id,paths,policy.includeSubdirectories);changed=next!==state;values=next;}
   else{const state=sidebarTabs.schema.parse(raw.values);values={...state,tabs:state.tabs.map(tab=>{const next=routeNewAgent(tab.organization,agent.id,paths,policy.includeSubdirectories);if(next===tab.organization)return tab;changed=true;return{...tab,organization:next,members:tab.members.some(m=>m.hostId===hostId&&m.agentId===agent.id)?tab.members:[...tab.members,{hostId,agentId:agent.id}]}})};}
   if(!changed)break;
   const result=await client.invokePluginRpc('conversation-hub',`settings.${id}.write`,{revision:raw.revision,values})as any;
   if(result.status==='saved')break;if(result.status!=='conflict'||attempt===4)throw Error(result.error||'Could not assign new workspace folder');
  }
 }
 async close(){this.closed=true;await this.queue;await this.local.close();}
}
