const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
let extraWorkspaces = [];
function harness(snapshots = []) {
  let cursor = 0, states = [], tree, effects = [], query;
  const owner = { status: 'ready', values: { mode: 'folders', groups: [{ id: 'local-folder', name: '原有分组', agentIds: [] }], ungroupedOrder: [] }, revision: '1', async save(next) { require("zod").z.json().parse(next); this.values = next; return true; } };
  const extra = { status: 'ready', values: { hosts: {} }, revision: '1', async save(next) { require("zod").z.json().parse(next); this.values = next; return true; } };
  const pins = { status: 'ready', values: { items: [] }, revision: 'p1', async save(next) { this.values = next; return true; } };
  const prefs = { status: 'ready', values: { grouping: 'manual', showServer: false, showTabs: true, tabStyle: 'full', showCounts: true, multilineTitles: false }, revision: '1', async save(next) { this.values = next; return true; } };
  const appearance = {status:'ready',revision:'1',values:{...require('./appearance-fixture.cjs').DEFAULT_APPEARANCE},async save(next){this.values=next;return true}};
  const readHost = async () => ({ hostId: 'local' });
  const jsx = (type, props) => ({ type, props: props || {} });
  const react = { useContext:()=>({openAppearanceSettings(){}}), useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], next => { states[i] = typeof next === 'function' ? next(states[i]) : next; }]; }, useRef(value) { const i = cursor++; if (!(i in states)) states[i] = { current: value }; return states[i]; }, useEffect(fn) { const i = cursor++; if (!(i in states)) { states[i] = true; effects.push(fn); } } };
  const sharedModule = { exports: {} }; new Function('exports', ts.transpileModule(fs.readFileSync(require.resolve('../shared/conversations.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(sharedModule.exports);
  const imports = {'./tooltip-button':{TooltipButton:'Pressable'},'../shared/folder-order':require('./folder-fixture.cjs').load('../shared/folder-order.ts'),'./follow-chat':{FollowActiveChat:'FollowActiveChat',FollowChatProvider:'FollowChatProvider',FollowChatScrollView:'ScrollView',FollowRowScope:'FollowRowScope',useFollowChatRow:()=>({current:null})},'./folder-editor':{FolderEditor:'FolderEditor'}, './folder-actions':require('./folder-fixture.cjs'),'../shared/folder-view':require('./folder-fixture.cjs'), '../shared/appearance':{appearance:'appearance'},'./density':{...require('./appearance-fixture.cjs'),useSidebarMetrics:()=>require('./appearance-fixture.cjs').sidebarMetrics(false,appearance.values)}, './i18n':{t:(s,...a)=>s.replace(/\{(\d)\}/g,(_,i)=>String(a[i])),timeLabel:s=>s,useAppLanguage(){}},'./view-state':(()=>{const open=new Map();let collapsed=false,before=new Map();const api={isOpen:(k,f)=>open.has(k)?open.get(k):f,setOpen:(k,v)=>open.set(k,v),register:()=>()=>{},showAll:()=>false,setShowAll(){},activeTab:null,setActiveTab(){},titleLines:null,setTitleLines(n){api.titleLines=n},get collapsed(){return collapsed},toggleCollapseAll(extra=[]){if(collapsed){open.clear();before.forEach((v,k)=>open.set(k,v))}else{before=new Map(open);extra.forEach(k=>open.set(k,false))}collapsed=!collapsed}};return{ViewStateProvider:'ViewStateProvider',useViewState:()=>api,useBranchOpen:(k,f=true)=>[api.isOpen(k,f),v=>api.setOpen(k,v)]}})(),'../shared/identity':{projectTile:()=>({color:'#368080',letter:'P'})}, '../shared/folder-picker': (()=>{const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(require.resolve('../shared/folder-picker.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;new Function('exports','require',code)(m.exports,()=>{const model={exports:{}};new Function('exports',ts.transpileModule(fs.readFileSync(require.resolve('../shared/model.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(model.exports);return model.exports;});return m.exports;})(), './folder-add':{FolderAdd:'FolderAdd'}, './folder-drag': {FolderDragProvider:'FolderDragProvider',DragFolderRow:'DragFolderRow',FolderDropTarget:'FolderDropTarget'}, './conversation-view':{ConversationViewContext:{Provider:'Provider'}}, './sidebar-tabs':{SidebarTabsView:'SidebarTabsView'}, './conversation-actions': {ConversationActions:'ConversationActions'}, './touch-drag': {TouchDragProvider:'TouchDragProvider', TouchScrollView:'ScrollView', useTouchDrag:()=>null}, './steady': {SteadyProvider:'SteadyProvider', useSteadyList:l=>l}, './pins': {PinsContext:{Provider:'PinsProvider'}, pinKey:(h,a)=>h+':'+a}, './web': {touchMenu:v=>v.layout.platform!=='web'||v.layout.compact}, '../shared/status': {quietSubtask:()=>false,conversationState:()=> 'idle',aggregateStates:()=>({state:'idle',hasUpdates:false})}, '../shared/activity': { activityTime: () => 'now' }, '../shared/conversations': sharedModule.exports, './drag-and-drop': { ConversationDragProvider: 'ConversationDragProvider', ConversationDropTarget: 'ConversationDropTarget', DragConversationRow: 'DragConversationRow' }, './dropdown-menu': { DropdownMenu: 'DropdownMenu' }, './visuals': { loadingEffects: ['spinner','orbit','pulse','dots','bars'].map(id=>({id,label:id})), LoadingMark:'LoadingMark', FeedbackPressable: 'Pressable', Glyph: 'Glyph', StatusMark: 'StatusMark', EntryReveal: 'EntryReveal', Reveal: 'Reveal', Disclosure: 'Disclosure', Transition: 'Transition' }, './automatic-tree': { AutomaticTree: 'AutomaticTree', ProjectFolder:'ProjectFolder' }, react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'react-native': { View: 'View', Text: 'Text', TextInput: 'TextInput', ScrollView: 'ScrollView', Pressable: 'Pressable' }, '@getpaseo/plugin/client/ui': { Icon: 'Icon', Modal: Object.assign(() => {}, { Content: 'ModalContent' }), SettingsSection: 'SettingsSection', SettingsSelect: 'SettingsSelect', SettingsSwitch: 'SettingsSwitch', SettingsAction: 'SettingsAction' }, '@getpaseo/plugin/client': { useSettings: d => d === 'appearance' ? appearance : d === 'preferences' ? prefs : d === 'owner' ? owner : d === 'pins' ? pins : extra, useRpc: () => readHost, useHosts: () => [{ serverId: 'local', label: '本机', status: 'online' }, { serverId: 'remote', label: '远端', status: 'online' }], useAgents: q => { if (q?.hosts) query = q; const rows=snapshots.filter(agent=>(!q?.hosts||q.hosts.includes(agent.hostId))&&(!q?.where||q.where(agent))); if(q?.groupBy){const buckets=new Map();for(const agent of rows){const key=q.groupBy(agent);if(!buckets.has(key))buckets.set(key,{key,items:[]});buckets.get(key).items.push(agent)}return [...buckets.values()]}return rows.map(agent=>({kind:'agent',hostId:agent.hostId,id:agent.id,key:agent.hostId+':'+agent.id})); }, useWorkspaces: q => { const rows = [{ ref: {key:'w-local',hostId:'local'}, project:{key:'p-local'},projectDisplayName:'Local project',labels:['work'],background:false },{ref:{key:'w-remote',hostId:'remote'},project:{key:'p-remote'},projectDisplayName:'Remote project',labels:['personal'],background:true},...extraWorkspaces].filter(row => !q?.where || q.where(row)); if(!q?.groupBy)return rows.map(row=>row.ref); const groups=new Map(); for(const row of rows){const keys=q.groupBy(row); for(const key of Array.isArray(keys)?keys:[keys]){const id=typeof key==='string'?key:key.key; if(!groups.has(id))groups.set(id,{key:id,title:typeof key==='string'?key:key.title,items:[]});groups.get(id).items.push(row.ref)}} return [...groups.values()]; }, useAgent: () => null }, '../shared/settings': { organization: 'owner', hostOrganizations: 'extra', displayPreferences: 'preferences', pinnedConversations: 'pins' }, '../shared/host-context': { hostContext: {} }, '../shared/model': (() => { const mod = { exports: {} }; const source = ts.transpileModule(fs.readFileSync(require.resolve('../shared/model.ts'), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText; new Function('exports', source)(mod.exports); return mod.exports; })() };
  const code = ts.transpileModule(fs.readFileSync(require.resolve('../client/sidebar.tsx'), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  imports['./pending-permissions'] = { usePermissionCount: () => () => 0 };
  const mod = { exports: {} }; new Function('require', 'exports', 'setInterval', code)(name => { assert.ok(name in imports, name); return imports[name]; }, mod.exports, () => 0);
  function render() { cursor = 0; tree = mod.exports.FolderSidebar({ theme: { colors: {} }, layout: { compact: false, platform:'web' }, active: { agent: null, workspace: null }, navigation: {} }); }
  function walk(node, out = []) { if (Array.isArray(node)) node.forEach(n => walk(n, out)); else if (node && typeof node === 'object') { out.push(node); walk(node.props.children, out); if (node.type === 'DropdownMenu') walk(node.props.header, out); } return out; }
  function find(label) { return walk(tree).find(n => n.props.accessibilityLabel === label); }
  function press(label) { assert.ok(find(label), label); find(label).props.onPress(); render(); }
  render(); for (const fn of effects) fn();
  return { render, find, press, owner, extra, prefs, pins, controls:()=>walk(tree).find(n=>n.type==='FolderControlsProvider').props.value, nodes: () => walk(tree), query: () => query };
}
test('multiple configured hosts no longer block sidebar; original groups preserved', async () => { const h = harness(); await new Promise(r => setImmediate(r)); h.render(); assert.ok(h.find('Folder 原有分组')); assert.deepEqual(h.query().hosts, ['local']); assert.ok(h.find('Select host 远端')); });
test('switch hosts isolates folder creation; cancelling the modal writes nothing',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.render();h.press('Select host 远端');h.press('New folder');
 let dialog=h.nodes().find(n=>n.type==='FolderEditor');assert.ok(dialog.props.creating);assert.equal(h.extra.values.hosts.remote,undefined);dialog.props.close();h.render();assert.ok(!h.nodes().some(n=>n.type==='FolderEditor'));
 h.press('New folder');dialog=h.nodes().find(n=>n.type==='FolderEditor');assert.equal(await dialog.props.save({name:'远端分组',icon:'Clock',color:'#3b82f6',pinned:true}),true);h.render();
 assert.equal(h.extra.values.hosts.remote.groups[0].name,'远端分组');assert.equal(h.extra.values.hosts.remote.groups[0].icon,'Clock');assert.equal(h.owner.values.groups[0].name,'原有分组');h.press('Select host 本机');assert.ok(h.find('Folder 原有分组'));
});
test('folder edits preserve membership and other hosts; stale updates are rejected', async () => {
 const h=harness();await new Promise(r=>setImmediate(r));h.render();const c=h.controls();
 assert.equal(await c.update('local','local-folder',{name:'Edited',icon:'BookOpen',color:'#3b82f6',pinned:true},'stale'),false);
 assert.equal(await c.update('local','local-folder',{name:'Edited',icon:'BookOpen',color:'#3b82f6',pinned:true},c.revision('local')),true);h.render();
 assert.equal(h.owner.values.groups[0].name,'Edited');assert.equal(h.owner.values.groups[0].icon,'BookOpen');assert.equal(h.owner.values.groups[0].pinned,true);assert.deepEqual(h.owner.values.groups[0].agentIds,[]);assert.deepEqual(h.extra.values.hosts,{});
 await h.controls().action('local',h.owner.values.groups[0],'delete');h.render();assert.equal(h.owner.values.groups.length,0);
});
test('desktop titles default to one line and the choice is kept per device', async () => {
 const h = harness(); await new Promise(r => setImmediate(r)); h.render();
 const dropdown = h.nodes().find(n => n.type === 'DropdownMenu');
 const titles = dropdown.props.items.find(item => item.id === 'titles');
 assert.equal(titles.value, 'Single line'); titles.items.find(item => item.id === 'multiline').onSelect();
 await new Promise(r => setImmediate(r)); h.render();
 assert.equal(h.nodes().find(n => n.type === 'DropdownMenu').props.items.find(item => item.id === 'titles').value, 'Two lines');
 assert.equal(h.prefs.values.multilineTitles, false);
 assert.ok(!h.nodes().some(n => n.type === 'Modal'));
});
test('subfolders use the shared dialog and save decorations inside their parent',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.render();await h.controls().action('local',h.owner.values.groups[0],'child');h.render();const modal=h.nodes().find(n=>n.type==='FolderEditor');assert.equal(modal.props.group.parentId,'local-folder');assert.equal(await modal.props.save({name:'Child',icon:'Clock',pinned:true}),true);h.render();assert.equal(h.owner.values.groups[1].parentId,'local-folder');assert.equal(h.owner.values.groups[1].pinned,true);assert.ok(h.find('Folder Child'));
});

test('automatic host menu opens the same folder dialog without changing grouping',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.prefs.values.grouping='server-project';h.render();h.nodes().find(n=>n.type==='AutomaticTree').props.createFolder('remote');h.render();const modal=h.nodes().find(n=>n.type==='FolderEditor');assert.ok(modal.props.creating);assert.equal(await modal.props.save({name:'123123'}),true);assert.equal(h.extra.values.hosts.remote.groups[0].name,'123123');assert.equal(h.prefs.values.grouping,'server-project');assert.equal(h.owner.values.groups.length,1);
});

test('root modal creates top-level folders atomically and permits retry after failed saves',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.prefs.values.grouping='server-project';h.render();h.press('New folder');const original=h.owner.save;h.owner.save=async()=>false;const modal=()=>h.nodes().find(n=>n.type==='FolderEditor');assert.equal(await modal().props.save({name:''}),false);assert.equal(await modal().props.save({name:'Root entry'}),false);h.render();assert.ok(modal());assert.equal(h.owner.values.groups.length,1);h.owner.save=original;assert.equal(await modal().props.save({name:'Root entry',color:'#ef4444',pinned:true}),true);assert.ok(h.owner.values.groups.some(g=>g.name==='Root entry'&&g.topLevel&&!g.parentId&&g.pinned));
});

test('view dropdown grouping and display options persist, host filter applies without server tabs',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.render();
 const dropdown=()=>h.nodes().find(n=>n.type==='DropdownMenu');
 dropdown().props.items.find(i=>i.id==='grouping').items.find(i=>i.id==='server-project').onSelect();await new Promise(r=>setImmediate(r));h.render();assert.equal(h.prefs.values.grouping,'server-project');
 dropdown().props.items.find(i=>i.id==='display').items.find(i=>i.id==='tabs').onSelect();await new Promise(r=>setImmediate(r));h.render();assert.equal(h.prefs.values.showTabs,false);
 dropdown().props.items.find(i=>i.id==='hosts').items.find(i=>i.id==='remote').onSelect();h.render();assert.deepEqual(h.nodes().find(n=>n.type==='AutomaticTree').props.hosts.map(host=>host.serverId),['remote']);
 assert.equal(dropdown().props.items.find(i=>i.id==='hosts').value,'远端');
});

test('sorting/filter menus persist and grouping choices include icons',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.render();const items=()=>h.nodes().find(n=>n.type==='DropdownMenu').props.items;
 assert.ok(items().find(i=>i.id==='grouping').items.every(i=>i.icon));
 items().find(i=>i.id==='sort').items.find(i=>i.id==='created').onSelect();await new Promise(r=>setImmediate(r));h.render();assert.equal(h.prefs.values.sortBy,'created');
 items().find(i=>i.id==='filter').items.find(i=>i.id==='running').onSelect();await new Promise(r=>setImmediate(r));h.render();assert.equal(h.prefs.values.filter,'running');
 h.find('Search conversations…').props.onChangeText('release');h.render();assert.equal(h.query().where({title:'release checklist',status:'running'}),true);assert.equal(h.query().where({title:'other',status:'running'}),false);
});
test('cross-host moves save qualified membership and preserve original host data',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.render();const move=()=>h.nodes().find(n=>n.type==='ConversationDragProvider').props.move;
 assert.equal(await move()({hostId:'remote',agentId:'chat'},{hostId:'local',groupId:'local-folder'}),true);h.render();
 assert.deepEqual(h.owner.values.assignments,[{hostId:'remote',agentId:'chat',folderHostId:'local',groupId:'local-folder'}]);
 const tree=()=>{h.prefs.values.grouping='server-project';h.render();return h.nodes().find(n=>n.type==='AutomaticTree')};
 assert.deepEqual(tree().props.foldersForHost('local')[0].agentIds,['host-agent:["remote","chat"]']);
 assert.equal(await move()({hostId:'local',agentId:'chat'},{hostId:'local',groupId:'local-folder',beforeId:'chat',beforeHostId:'remote'}),true);h.render();assert.deepEqual(tree().props.foldersForHost('local')[0].agentIds,['chat','host-agent:["remote","chat"]']);assert.equal(h.prefs.values.sortBy,'manual');
 h.owner.save=async()=>false;assert.equal(await move()({hostId:'remote',agentId:'chat'},{hostId:'local',groupId:null}),false);h.render();assert.equal(h.owner.values.assignments.length,2);assert.ok(h.nodes().some(n=>n.props.accessibilityRole==='alert'));
});

test('failed custom-order preference reports partial success without losing saved move',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.render();h.prefs.save=async()=>false;
 const move=h.nodes().find(n=>n.type==='ConversationDragProvider').props.move;
 assert.equal(await move({hostId:'local',agentId:'a'},{hostId:'local',groupId:'local-folder',beforeId:'b'}),true);h.render();assert.equal(h.owner.values.assignments[0].agentId,'a');assert.ok(h.nodes().some(n=>n.props.accessibilityRole==='alert'&&String(n.props.children).includes('custom order could not be enabled')));
});


test('view options keep the original menu features and search stays visible above the list',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.render();assert.ok(h.find('View options'));
 const menu=h.nodes().find(n=>n.type==='DropdownMenu');assert.deepEqual(menu.props.items.slice(0,12).map(i=>i.id),['grouping','sort','folder-sort','recent','filter','appearance','titles','display','hosts','projects','labels','background']);
 assert.equal(menu.props.header,undefined);assert.equal(h.nodes().filter(n=>n.props.accessibilityLabel==='Search conversations…').length,1);
});
test('project, label and background workspace filters intersect and clear restores all',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.render();const items=()=>h.nodes().find(n=>n.type==='DropdownMenu').props.items;
 items().find(i=>i.id==='projects').items.find(i=>i.id==='p-remote').onSelect();h.render();assert.deepEqual(h.query().where({workspace:{key:'w-remote'},title:'test'}),true);assert.equal(h.query().where({workspace:{key:'w-local'},title:'test'}),false);
 items().find(i=>i.id==='labels').items.find(i=>i.id==='work').onSelect();h.render();assert.equal(h.query().where({workspace:{key:'w-remote'},title:'test'}),false);
 items().find(i=>i.id==='clear').onSelect();await new Promise(r=>setImmediate(r));h.render();assert.equal(h.query().where({workspace:{key:'w-remote'},title:'test'}),true);
 items().find(i=>i.id==='background').onSelect();await new Promise(r=>setImmediate(r));h.render();assert.equal(h.prefs.values.showBackground,false);assert.equal(h.query().where({workspace:{key:'w-remote'},title:'test'}),false);assert.equal(h.query().where({workspace:{key:'w-local'},title:'test'}),true);
});

test('drop into automatic project creates display membership and accepts another host',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.prefs.values.grouping='server-project';h.render();
 const move=()=>h.nodes().find(n=>n.type==='ConversationDragProvider').props.move;
 assert.equal(await move()({hostId:'remote',agentId:'chat'},{hostId:'local',groupId:null,projectKey:'p-local',projectTitle:'Local project'}),true);h.render();
 const folder=h.owner.values.groups.find(group=>group.projectKey==='p-local');assert.ok(folder);assert.equal(h.owner.values.assignments[0].groupId,folder.id);
 assert.equal(await move()({hostId:'local',agentId:'another'},{hostId:'local',groupId:folder.id,projectKey:'p-local',projectTitle:'Local project'}),true);h.render();assert.equal(h.owner.values.groups.filter(group=>group.projectKey==='p-local').length,1);assert.equal(h.owner.values.assignments.length,2);
});

test('loading color saves independently and reaches all effect previews and automatic branches',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.render();
 const display=()=>h.nodes().find(n=>n.type==='DropdownMenu').props.items.find(i=>i.id==='display');
 const content=display().items.find(i=>i.id==='loading-color').content;
 const purple=content.props.children[1].props.children.find(n=>n.props.accessibilityLabel==='Loading color: Purple');
 purple.props.onPress();await new Promise(r=>setImmediate(r));h.render();
 assert.equal(h.prefs.values.loadingColor,'#A78BFA');
 assert.ok(display().items.filter(i=>i.id.startsWith('loading-')&&i.preview).every(i=>i.preview.props.color==='#A78BFA'));
 h.nodes().find(n=>n.type==='DropdownMenu').props.items.find(i=>i.id==='grouping').items.find(i=>i.id==='server-project').onSelect();await new Promise(r=>setImmediate(r));h.render();
 assert.equal(h.nodes().find(n=>n.type==='AutomaticTree').props.conversationOptions.loadingColor,'#A78BFA');
});

test('collapse toggle restores the manual expansion snapshot on repeated cycles',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.render();
 h.press('Folder 原有分组');assert.equal(h.find('Folder 原有分组').props.accessibilityState.expanded,true);
 h.press('Collapse all');assert.equal(h.find('Folder 原有分组').props.accessibilityState.expanded,false);
 h.press('Restore expansion');assert.equal(h.find('Folder 原有分组').props.accessibilityState.expanded,true);
 h.press('Folder 原有分组');h.press('Collapse all');h.press('Restore expansion');assert.equal(h.find('Folder 原有分组').props.accessibilityState.expanded,false);
});


const localChat=()=>({hostId:'local',id:'chat',title:'Review',status:'idle',requiresAttention:false,attentionReason:null,workspace:{key:'w-local'},createdAt:'2026-11-10',lastActivityAt:'2026-11-10'});
test('linked projects retain native members in manual, server and project views without modifying saved membership',async()=>{
 const h=harness([localChat()]);await new Promise(r=>setImmediate(r));h.owner.values.groups.push({id:'project-g',projectKey:'p-local',name:'Linked project',agentIds:[]});h.render();
 const project=h.nodes().find(node=>node.type==='ProjectFolder');assert.ok(project);assert.deepEqual(project.props.foldersForHost('local').find(g=>g.id==='project-g').agentIds,['chat']);
 assert.deepEqual(h.owner.values.groups.find(g=>g.id==='project-g').agentIds,[]);
 for(const grouping of ['server','server-project','project']){h.prefs.values.grouping=grouping;h.render();const tree=h.nodes().find(node=>node.type==='AutomaticTree');assert.equal(tree.props.assignedConversations.has('local:chat'),true);assert.deepEqual(tree.props.foldersForHost('local').find(g=>g.id==='project-g').agentIds,['chat']);}
});
test('legacy manual move replaces an existing drag assignment instead of being overridden',async()=>{
 const h=harness([localChat()]);await new Promise(r=>setImmediate(r));h.owner.values.groups.push({id:'destination',name:'Destination',agentIds:[]});h.owner.values.assignments=[{hostId:'local',agentId:'chat',folderHostId:'local',groupId:'local-folder'}];h.render();h.press('Folder 原有分组');
 const row=h.nodes().find(node=>typeof node.type==='function'&&node.type.name==='ConversationRow');assert.ok(row);row.props.select('chat');h.render();h.press('Folder Destination');await new Promise(r=>setImmediate(r));h.render();
 assert.equal(h.owner.values.assignments.length,1);assert.equal(h.owner.values.assignments[0].groupId,'destination');
 assert.ok(h.nodes().some(node=>node.type==='ConversationDropTarget'&&node.props.destination.groupId==='destination'&&node.props.destination.beforeId==='chat'));
 assert.ok(!h.nodes().some(node=>node.type==='ConversationDropTarget'&&node.props.destination.groupId==='local-folder'&&node.props.destination.beforeId==='chat'));
});


test('creation merges concurrent unrelated folders without overwriting their contents',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.render();h.press('New folder');h.owner.values.groups.push({id:'other-client',name:'Other client folder',agentIds:['preserve']});h.owner.revision='2';h.render();const modal=h.nodes().find(n=>n.type==='FolderEditor');assert.equal(await modal.props.save({name:'My new folder'}),true);assert.deepEqual(h.owner.values.groups.map(g=>g.name),['原有分组','Other client folder','My new folder']);assert.deepEqual(h.owner.values.groups.find(g=>g.id==='other-client').agentIds,['preserve']);
});

test('first drop beside or inside an unsaved project creates its metadata and preserves the source',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.render();const move=h.nodes().find(n=>n.type==='FolderDragProvider').props.move;
 const project={id:'project:p-local',projectKey:'p-local',name:'Project',agentIds:[]};
 assert.equal(await move({hostId:'local',groupId:'local-folder'},{hostId:'local',parentId:project.id,project}),true);h.render();
 assert.equal(h.owner.values.groups.find(g=>g.id==='local-folder').parentId,project.id);assert.equal(h.owner.values.groups.filter(g=>g.projectKey==='p-local').length,1);
});

test('manual controls preserve the source host when moving a foreign conversation',async()=>{
 const foreign={...localChat(),hostId:'remote'};const h=harness([foreign]);await new Promise(r=>setImmediate(r));h.owner.values.groups[0].agentIds=['host-agent:["remote","chat"]'];h.owner.values.groups.push({id:'destination',name:'Destination',agentIds:[]});h.render();h.press('Folder 原有分组');
 const row=h.nodes().find(node=>typeof node.type==='function'&&node.type.name==='ConversationRow');assert.ok(row);row.props.select('chat');h.render();h.press('Folder Destination');await new Promise(r=>setImmediate(r));h.render();
 assert.equal(h.owner.values.assignments[0].hostId,'remote');assert.equal(h.owner.values.assignments[0].agentId,'chat');assert.equal(h.owner.values.assignments[0].groupId,'destination');
});
test('Move up stays inside its sibling list and cannot move a child above its parent',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.owner.values.groups.push({id:'a',parentId:'local-folder',name:'First',agentIds:[]},{id:'b',parentId:'local-folder',name:'Second',agentIds:[]});h.render();h.press('Folder 原有分组');
 assert.equal(await h.controls().moveUp('local',h.owner.values.groups.find(g=>g.id==='a')),false);h.render();assert.deepEqual(h.owner.values.groups.map(g=>g.id),['local-folder','a','b']);
 assert.equal(await h.controls().moveUp('local',h.owner.values.groups.find(g=>g.id==='b')),true);h.render();assert.deepEqual(h.owner.values.groups.map(g=>g.id),['local-folder','b','a']);assert.equal(h.owner.values.groups.find(g=>g.id==='b').parentId,'local-folder');
});

test('folder plus saves a batch from multiple servers atomically and rejects stale pickers',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.prefs.values.grouping='server-project';h.render();
 const tree=()=>h.nodes().find(n=>n.type==='AutomaticTree');const add=tree().props.addConversations;
 assert.equal(await add([{hostId:'local',id:'same'},{hostId:'remote',id:'same'}],{hostId:'local',groupId:'local-folder'},'1'),true);h.render();
 assert.deepEqual(h.owner.values.assignments.map(a=>[a.hostId,a.agentId,a.groupId]),[['local','same','local-folder'],['remote','same','local-folder']]);
 h.owner.revision='2';h.render();const before=JSON.stringify(h.owner.values);assert.equal(await tree().props.addConversations([{hostId:'local',id:'other'}],{hostId:'local',groupId:'local-folder'},'1'),false);assert.equal(JSON.stringify(h.owner.values),before);
 h.owner.save=async()=>false;assert.equal(await tree().props.addConversations([{hostId:'local',id:'other'}],{hostId:'local',groupId:'local-folder'},'2'),false);assert.equal(JSON.stringify(h.owner.values),before);
});

test('dragging one project in the project view saves every project at its on-screen position', async () => {
 extraWorkspaces = [{ ref: { key: 'w-second', hostId: 'local' }, project: { key: 'p-second' }, projectDisplayName: 'Second project', labels: [], background: false }];
 try {
  const h = harness(); await new Promise(r => setImmediate(r)); h.prefs.values.grouping = 'project'; h.render();
  const move = h.nodes().find(n => n.type === 'FolderDragProvider').props.move;
  const project = key => ({ id: 'project:' + key, projectKey: key, name: key, agentIds: [] });
  assert.equal(await move({ hostId: 'local', groupId: 'project:p-second', project: project('p-second') }, { hostId: 'local', parentId: null, topLevel: false, siblingId: 'project:p-local', position: 'before', project: project('p-local') }), true);
  assert.deepEqual(h.owner.values.groups.map(g => g.projectKey ?? g.id), ['p-second', 'p-local', 'local-folder']);
  assert.ok(h.owner.values.groups.every(g => !g.parentId));
 } finally { extraWorkspaces = []; }
});

test('dropping a conversation into a project keeps that project at its on-screen position', async () => {
 extraWorkspaces = [{ ref: { key: 'w-second', hostId: 'local' }, project: { key: 'p-second' }, projectDisplayName: 'Second project', labels: [], background: false }];
 try {
  const h = harness(); await new Promise(r => setImmediate(r)); h.prefs.values.grouping = 'project'; h.render();
  const move = h.nodes().find(n => n.type === 'ConversationDragProvider').props.move;
  assert.equal(await move({ hostId: 'local', agentId: 'another' }, { hostId: 'local', groupId: null, projectKey: 'p-local', projectTitle: 'Local project' }), true);
  assert.deepEqual(h.owner.values.groups.map(g => g.projectKey ?? g.id), ['p-local', 'p-second', 'local-folder']);
  assert.equal(h.owner.values.assignments.at(-1).groupId, h.owner.values.groups[0].id);
 } finally { extraWorkspaces = []; }
});
test('sidebar height never overrides the chosen title line setting', async () => {
 const h = harness(); await new Promise(r => setImmediate(r)); h.render();
 const titles = () => h.nodes().find(n => n.type === 'DropdownMenu').props.items.find(item => item.id === 'titles').value;
 assert.equal(titles(), 'Single line');
 h.nodes().find(n => n.type === 'ScrollView' && n.props.onLayout).props.onLayout({ nativeEvent: { layout: { height: 400 } } }); h.render();
 assert.equal(titles(), 'Single line');
 h.nodes().find(n => n.type === 'ScrollView' && n.props.onLayout).props.onLayout({ nativeEvent: { layout: { height: 800 } } }); h.render();
 assert.equal(titles(), 'Single line');
});

test('rename without an icon or color and clearing decorations produce valid settings JSON',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.render();
 assert.equal(await h.controls().update('local','local-folder',{name:'Renamed',icon:undefined,color:undefined,pinned:false},'1'),true);h.render();
 assert.equal(h.owner.values.groups[0].name,'Renamed');assert.ok(!('icon'in h.owner.values.groups[0]));assert.ok(!('color'in h.owner.values.groups[0]));
 h.owner.values.groups[0].icon='BookOpen';h.owner.values.groups[0].color='#3b82f6';h.render();
 assert.equal(await h.controls().update('local','local-folder',{icon:undefined,color:undefined},'1'),true);assert.ok(!('icon'in h.owner.values.groups[0]));
});
test('storage failures report save failures instead of claiming a concurrent folder edit',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.render();h.owner.save=async()=>false;h.render();
 await assert.rejects(h.controls().update('local','local-folder',{name:'Retry'},'1'),/Could not save settings/);
 assert.equal(h.owner.values.groups[0].name,'原有分组');
});

test('a folder shortcut and original row share edits without duplicating stored folders',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.owner.values.groups[0].pinned=true;h.render();
 const rows=name=>h.nodes().filter(n=>n.props.accessibilityLabel==='Folder '+name);
 assert.equal(rows('原有分组').length,2);assert.equal(h.owner.values.groups.length,1);
 await h.controls().update('local','local-folder',{name:'Both rows'},'1');h.render();assert.equal(rows('Both rows').length,2);
 await h.controls().update('local','local-folder',{pinned:false},'1');h.render();assert.equal(rows('Both rows').length,1);assert.equal(h.owner.values.groups.length,1);
});
test('a pinned conversation has both a pinned shortcut and its original folder row',async()=>{
 const item={id:'chat',hostId:'local',key:'local:chat',title:'Example',status:'idle',background:false,workspace:{key:'w-local'},createdAt:'2026-11-01',lastActivityAt:'2026-11-01',requiresAttention:false,attentionReason:null};
 const h=harness([item]);await new Promise(r=>setImmediate(r));h.owner.values.groups[0].agentIds=['chat'];h.pins.values.items=[{hostId:'local',agentId:'chat'}];h.render();h.press('Folder 原有分组');
 const regular=h.nodes().filter(n=>n.type==='DragConversationRow'&&n.props.source.agentId==='chat');assert.equal(regular.length,1);
 const pinned=h.nodes().find(n=>typeof n.type==='function'&&n.type.name==='PinnedSection');assert.deepEqual(pinned.props.items,[{hostId:'local',agentId:'chat'}]);
 assert.equal(pinned.props.row({hostId:'local',id:'chat',key:'local:chat'}).props.reference.id,'chat');assert.deepEqual(h.owner.values.groups[0].agentIds,['chat']);
});

 test('right click opens the correct folder menu without toggling or changing stored data',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));h.owner.values.groups[0].pinned=true;h.owner.values.groups.push({id:'child',parentId:'local-folder',name:'Child',agentIds:[]});h.render();h.press('Folder 原有分组');const before=JSON.stringify(h.owner.values);
 const rows=h.nodes().filter(n=>n.props.onContextMenu);assert.equal(rows.length,4);let prevented=0,stopped=0;
 rows[3].props.onContextMenu({clientX:145,clientY:220,preventDefault(){prevented++},stopPropagation(){stopped++}});h.render();
 const menus=h.nodes().filter(n=>n.type==='FolderActions');assert.equal(menus.filter(n=>n.props.requestedAnchor).length,1);const active=menus.find(n=>n.props.requestedAnchor);assert.equal(active.props.group.id,'child');assert.deepEqual(active.props.requestedAnchor,{x:145,y:220});assert.equal(prevented,1);assert.equal(stopped,1);assert.equal(JSON.stringify(h.owner.values),before);assert.equal(h.find('Folder 原有分组').props.accessibilityState.expanded,true);active.props.onMenuClose();h.render();assert.ok(h.nodes().filter(n=>n.type==='FolderActions').every(n=>!n.props.requestedAnchor));
 });

test('Recent is below pinned shortcuts, can be hidden and its limit persists separately from conversation sorting',async()=>{
 const h=harness([localChat()]);await new Promise(r=>setImmediate(r));h.render();
 const sections=()=>h.nodes().filter(n=>typeof n.type==='function'&&['PinnedSection','RecentSection','ActiveSection'].includes(n.type.name));
 assert.deepEqual(sections().map(n=>n.type.name),['PinnedSection','RecentSection','ActiveSection']);
 const menu=()=>h.nodes().find(n=>n.type==='DropdownMenu').props.items;
 menu().find(i=>i.id==='recent').items.find(i=>i.id==='5').onSelect();await new Promise(r=>setImmediate(r));h.render();
 assert.equal(h.prefs.values.recentLimit,5);assert.equal(sections().find(n=>n.type.name==='RecentSection').props.limit,5);
 menu().find(i=>i.id==='recent').items.find(i=>i.id==='visible').onSelect();await new Promise(r=>setImmediate(r));h.render();assert.ok(!sections().some(n=>n.type.name==='RecentSection'));
});
test('folder sorting works in both manual and automatic views and preserves the saved organization',async()=>{
 const h=harness([localChat()]);await new Promise(r=>setImmediate(r));h.owner.values.groups=[{id:'b',name:'B',agentIds:[]},{id:'a',name:'A',agentIds:['chat']}];h.prefs.values.sortBy='created';h.render();
 const sort=()=>h.nodes().find(n=>n.type==='DropdownMenu').props.items.find(i=>i.id==='folder-sort');
 sort().items.find(i=>i.id==='title').onSelect();await new Promise(r=>setImmediate(r));h.render();
 assert.deepEqual(h.nodes().filter(n=>/^Folder [AB]$/.test(n.props.accessibilityLabel??'')).map(n=>n.props.accessibilityLabel),['Folder A','Folder B']);
 assert.equal(h.prefs.values.sortBy,'created');assert.deepEqual(h.owner.values.groups.map(g=>g.id),['b','a']);
 h.prefs.values.grouping='server';h.render();assert.deepEqual(h.nodes().find(n=>n.type==='AutomaticTree').props.foldersForHost('local').map(g=>g.id),['a','b']);
 h.prefs.values.grouping='manual';h.render();sort().items.find(i=>i.id==='manual').onSelect();await new Promise(r=>setImmediate(r));h.render();assert.deepEqual(h.nodes().filter(n=>/^Folder [AB]$/.test(n.props.accessibilityLabel??'')).map(n=>n.props.accessibilityLabel),['Folder B','Folder A']);
});
