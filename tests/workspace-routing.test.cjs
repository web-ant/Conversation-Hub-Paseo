const{test}=require('node:test'),assert=require('node:assert/strict'),{load}=require('./folder-fixture.cjs');
const{normalizeWorkspacePath,normalizeWorkspacePaths,matchWorkspaceFolder,routeNewAgent}=load('../shared/workspace-routing.ts');
const group=(id,paths)=>({id,name:id,agentIds:[],workspacePaths:paths});
test('two explicit project directories route to the same Recmeet folder',()=>{const groups=[group('Recmeet',['/projects/recmeet','/projects/recmeet-openspec'])];for(const path of ['/projects/recmeet','/projects/recmeet-openspec','/projects/recmeet/src'])assert.equal(matchWorkspaceFolder(groups,[path]).id,'Recmeet');assert.equal(matchWorkspaceFolder(groups,['/projects/recmeet-other']),null);});
test('directory boundaries prevent sibling and prefix matches',()=>{const groups=[group('A',['/work/foo'])];assert.equal(matchWorkspaceFolder(groups,['/work/foobar']),null);assert.equal(matchWorkspaceFolder(groups,['/work/foo-bar']),null);assert.equal(matchWorkspaceFolder(groups,['/work/foo/src'],false),null);assert.equal(matchWorkspaceFolder(groups,['/work/foo/'],false).id,'A');});
test('most specific path wins and equally specific conflicting bindings stay unassigned',()=>{const groups=[group('Parent',['/work']),group('Child',['/work/foo'])];assert.equal(matchWorkspaceFolder(groups,['/work/foo/src']).id,'Child');assert.equal(matchWorkspaceFolder([...groups,group('Conflict',['/work/foo/'])],['/work/foo']),null);});
test('portable normalization preserves POSIX case and handles Windows, dots, roots and duplicates',()=>{assert.equal(normalizeWorkspacePath(' C:\\Work\\Recmeet\\..\\Recmeet\\ '),'c:/work/recmeet');assert.equal(normalizeWorkspacePath('/Work/./recmeet//'),'/Work/recmeet');assert.deepEqual(normalizeWorkspacePaths(['/work/','/work','']),['/work']);assert.equal(matchWorkspaceFolder([group('root',['/'])],['/work']).id,'root');for(const bad of ['recmeet','~/recmeet','/a\0b'])assert.throws(()=>normalizeWorkspacePath(bad));});
test('manual placement and explicit ungrouping take priority; new assignments persist immutably',()=>{const state={mode:'folders',groups:[group('Recmeet',['/work/recmeet']),{id:'Manual',name:'Manual',agentIds:['existing'],pinned:true}],ungroupedOrder:['ungrouped'],assignments:[{hostId:'local',agentId:'override',folderHostId:'local',groupId:null}]};for(const id of ['existing','ungrouped','override'])assert.strictEqual(routeNewAgent(state,id,['/work/recmeet']),state);const next=routeNewAgent(state,'new',['/work/recmeet']);assert.deepEqual(next.groups[0].agentIds,['new']);assert.deepEqual(state.groups[0].agentIds,[]);assert.equal(next.groups[1].pinned,true);assert.strictEqual(routeNewAgent(next,'new',['/work/recmeet']),next);});
test('worktree source directories can route a checkout outside the repository',()=>{assert.equal(matchWorkspaceFolder([group('Recmeet',['/work/recmeet'])],['/worktrees/new-checkout','/work/recmeet']).id,'Recmeet');});
test('old settings acquire routing defaults without changing existing folder memberships',()=>{const{z}=require('zod');const s=load('../shared/settings.ts',{'@getpaseo/plugin':{defineSettings:x=>x},zod:{z}});assert.deepEqual(s.workspaceRouting.schema.parse({}),{enabled:true,includeSubdirectories:true,includeWorktrees:true,includeSubagents:false});const state=s.organization.schema.parse({groups:[{id:'old',name:'Old',agentIds:['a']}]});assert.equal(state.groups[0].workspacePaths,undefined);assert.deepEqual(state.groups[0].agentIds,['a']);assert.doesNotThrow(()=>z.json().parse(s.organization.schema.parse({groups:[group('bound',['/work/recmeet'])]})));});

test('double stars find Recmeet paths at any depth while preserving POSIX case',()=>{
 const groups=[group('Recmeet',['**recmeet**'])];
 for(const path of ['/recmeet','/projects/recmeet-openspec','/home/dev/recmeet/src','/projects/my-recmeet-copy']){
  for(const nested of [true,false])assert.equal(matchWorkspaceFolder(groups,[path],nested)?.id,'Recmeet',path);
 }
 for(const path of ['/projects/RecMeet','/projects/rec/meet','/projects/other'])assert.equal(matchWorkspaceFolder(groups,[path]),null,path);
});

test('single star binds only immediate PaseoChats children, including hidden directories',()=>{
 const groups=[group('Chats',['/home/webant/.PaseoChats/*'])];
 for(const nested of [true,false]){
  for(const path of ['/home/webant/.PaseoChats/one','/home/webant/.PaseoChats/.hidden'])assert.equal(matchWorkspaceFolder(groups,[path],nested)?.id,'Chats');
  for(const path of ['/home/webant/.PaseoChats','/home/webant/.PaseoChats/one/src','/home/webant/.PaseoChats-other/one'])assert.equal(matchWorkspaceFolder(groups,[path],nested),null,path);
 }
});

test('globstar directory components match zero or many levels and recursive tails include their root',()=>{
 const groups=[group('Project',['/work/**/recmeet*'])];
 for(const path of ['/work/recmeet','/work/team/recmeet-openspec','/work/team/sub/recmeet'])assert.equal(matchWorkspaceFolder(groups,[path])?.id,'Project',path);
 for(const path of ['/work/recmeet/src','/work/team/not-recmeet','/elsewhere/recmeet'])assert.equal(matchWorkspaceFolder(groups,[path]),null,path);
 const recursive=[group('All',['/work/**'])];
 for(const path of ['/work','/work/a','/work/a/b'])assert.equal(matchWorkspaceFolder(recursive,[path],false)?.id,'All',path);
 assert.equal(matchWorkspaceFolder(recursive,['/worker/a']),null);
 const embedded=[group('Embedded',['/work/rec**/src'])];
 assert.equal(matchWorkspaceFolder(embedded,['/work/rec/src'])?.id,'Embedded');
 assert.equal(matchWorkspaceFolder(embedded,['/work/rec/a/src'])?.id,'Embedded');
 assert.equal(matchWorkspaceFolder(embedded,['/work/recsrc']),null);
});

test('rootless patterns start at directory boundaries; other metacharacters stay literal',()=>{
 const groups=[group('Recmeet',['recmeet*'])];
 assert.equal(matchWorkspaceFolder(groups,['/work/team/recmeet-openspec'])?.id,'Recmeet');
 for(const path of ['/work/not-recmeet','/work/recmeet/src'])assert.equal(matchWorkspaceFolder(groups,[path]),null);
 const literal=[group('Literal',['/work/[ab]+(repo)?.*'])];
 assert.equal(matchWorkspaceFolder(literal,['/work/[ab]+(repo)?.git'])?.id,'Literal');
 assert.equal(matchWorkspaceFolder(literal,['/work/arepo1.git']),null);
});

test('specific rules win consistently and equally specific patterns never assign arbitrarily',()=>{
 const rules=[group('Recursive',['/work/**']),group('Immediate',['/work/*']),group('Prefix',['/work/recmeet*']),group('Exact',['/work/recmeet'])];
 for(const groups of [rules,[...rules].reverse()]){
  assert.equal(matchWorkspaceFolder(groups,['/work/recmeet'])?.id,'Exact');
  assert.equal(matchWorkspaceFolder(groups,['/work/recmeet-openspec'])?.id,'Prefix');
  assert.equal(matchWorkspaceFolder(groups,['/work/other'])?.id,'Immediate');
  assert.equal(matchWorkspaceFolder(groups,['/work/other/src'])?.id,'Recursive');
 }
 assert.equal(matchWorkspaceFolder([group('A',['**recmeet**']),group('B',['**recmeet**'])],['/work/recmeet']),null);
 assert.equal(matchWorkspaceFolder([group('A',['/work/a*']),group('B',['/work/*b'])],['/work/ab']),null);
 assert.equal(matchWorkspaceFolder([group('A',['**recmeet**','**recmeet**'])],['/work/recmeet'])?.id,'A');
});

test('patterns normalize portably without treating wildcards as a fixed parent directory',()=>{
 const {normalizeWorkspaceRule}=load('../shared/workspace-routing.ts');
 assert.deepEqual(normalizeWorkspacePaths([' **recmeet** ','/work//**/./recmeet*/','**recmeet**','']),['**recmeet**','/work/**/recmeet*']);
 assert.equal(normalizeWorkspaceRule('C:\\Work\\Recmeet*\\**'),'c:/work/recmeet*/**');
 assert.equal(normalizeWorkspaceRule('**\\recmeet*'),'**/recmeet*');
 assert.equal(normalizeWorkspaceRule('/work/****'),'/work/**');
 for(const bad of ['recmeet','relative/path','~/recmeet*','../**','/work/*/../recmeet','**/../recmeet','/work/\0*'])assert.throws(()=>normalizeWorkspaceRule(bad),undefined,bad);
 assert.throws(()=>normalizeWorkspacePath('**recmeet**'));
});

test('Windows patterns and UNC paths match case insensitively without changing POSIX rules',()=>{
 assert.equal(matchWorkspaceFolder([group('Win',['C:\\Work\\RecMeet*'])],['c:\\WORK\\recmeet-openspec'])?.id,'Win');
 assert.equal(matchWorkspaceFolder([group('Any',['**RecMeet**'])],['C:/WORK/recmeet/src'])?.id,'Any');
 assert.equal(matchWorkspaceFolder([group('UNC',['\\\\Server\\Share\\RecMeet*'])],['//SERVER/SHARE/RECMEET'])?.id,'UNC');
 assert.equal(matchWorkspaceFolder([group('Posix',['/Work/RecMeet*'])],['/work/recmeet']),null);
});

test('pattern routing preserves explicit placement and ignores invalid rules and source paths',()=>{
 const state={mode:'folders',groups:[group('Recmeet',['bad','**/../bad','**recmeet**'])],ungroupedOrder:[]};
 const next=routeNewAgent(state,'new',['relative/path','/work/recmeet-openspec'],false);
 assert.deepEqual(next.groups[0].agentIds,['new']);
 assert.deepEqual(state.groups[0].agentIds,[]);
 const manual={...state,ungroupedOrder:['manual']};
 assert.strictEqual(routeNewAgent(manual,'manual',['/work/recmeet']),manual);
});

test('wildcard-heavy non-matches complete without regex backtracking',()=>{
 const rule='/work/'+'*a'.repeat(80)+'*z';
 assert.equal(matchWorkspaceFolder([group('Heavy',[rule])],['/work/'+'a'.repeat(500)+'y']),null);
});
