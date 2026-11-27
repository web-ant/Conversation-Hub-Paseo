const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function harness(status = 'online') {
  let cursor = 0, states = [], tree, calls = [], resolveOpen, rejectOpen;
  const jsx = (type, props) => ({ type, props: props || {} });
  const imports = {'./follow-chat':{FollowActiveChat:'FollowActiveChat',FollowChatProvider:'FollowChatProvider',FollowChatScrollView:'ScrollView',FollowRowScope:'FollowRowScope',useFollowChatRow:()=>({current:null})},'./folder-editor':{FolderEditor:'FolderEditor'},'../shared/popover':require('./folder-fixture.cjs'), './folder-actions':require('./folder-fixture.cjs'),'../shared/folder-view':require('./folder-fixture.cjs'), './density':require('./appearance-fixture.cjs'),'./i18n':{t:(s,...a)=>s.replace(/\{(\d)\}/g,(_,i)=>String(a[i])),timeLabel:s=>s,useAppLanguage(){}},'./view-state':(()=>{const open=new Map();let collapsed=false,before=new Map();const api={isOpen:(k,f)=>open.has(k)?open.get(k):f,setOpen:(k,v)=>open.set(k,v),register:()=>()=>{},showAll:()=>false,setShowAll(){},activeTab:null,setActiveTab(){},titleLines:null,setTitleLines(n){api.titleLines=n},get collapsed(){return collapsed},toggleCollapseAll(extra=[]){if(collapsed){open.clear();before.forEach((v,k)=>open.set(k,v))}else{before=new Map(open);extra.forEach(k=>open.set(k,false))}collapsed=!collapsed}};return{ViewStateProvider:'ViewStateProvider',useViewState:()=>api,useBranchOpen:(k,f=true)=>[api.isOpen(k,f),v=>api.setOpen(k,v)]}})(),'../shared/identity':{projectTile:()=>({color:'#368080',letter:'P'})}, './folder-add':{FolderAdd:'FolderAdd'}, './web': {isSidebarDragging:()=>false, touchMenu:v=>v.layout.platform!=='web'||v.layout.compact}, './folder-drag': {FolderDragProvider:'FolderDragProvider',DragFolderRow:'DragFolderRow',FolderDropTarget:'FolderDropTarget'},
    '../shared/status': {quietSubtask:()=>false,aggregateStates:()=>({state:'idle',hasUpdates:false})}, '../shared/model': {}, './drag-and-drop': {}, './touch-drag':{useTouchDrag:()=>null}, './steady':{useSteadyList:l=>l}, '../shared/activity':{timeBucket:()=>'older'}, './conversation-view': {useConversationView:()=>({options:{}})}, '../shared/conversations': {}, './context-menu': {}, './image-picker': {}, './visuals': { FeedbackPressable: 'Pressable', Glyph: 'Glyph', StatusMark: 'StatusMark', EntryReveal: 'EntryReveal' }, '../shared/settings': {},
    react: { useEffect() {}, useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], next => { states[i] = typeof next === 'function' ? next(states[i]) : next; }]; }, useRef(value) { const i = cursor++; if (!(i in states)) states[i] = { current: value }; return states[i]; } },
    'react/jsx-runtime': { jsx, jsxs: jsx }, 'react-native': { View: 'View', Pressable: 'Pressable', Text: 'Text' }, '@getpaseo/plugin/client/ui': { TextInput: 'TextInput' },
    '@getpaseo/plugin/client': {useAgents:()=>[]},
  };
  const code = ts.transpileModule(fs.readFileSync(require.resolve('../client/automatic-tree.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'exports', code + '\nexports.HostBranch = HostBranch;')(name => { assert.ok(name in imports, name); return imports[name]; }, mod.exports);
  function render() { cursor = 0; tree = mod.exports.HostBranch({host:{serverId:'remote',label:'MacBook',status},mode:'server-project',createFolder(host,name){calls.push({host,name});return new Promise((resolve,reject)=>{resolveOpen=resolve;rejectOpen=reject;});},view:{theme:{colors:{}},layout:{compact:false},navigation:{openWorkspace(){}}},row(){}}); }
  function walk(node, out=[]) { if(Array.isArray(node))node.forEach(n=>walk(n,out));else if(node&&typeof node==='object'){out.push(node);walk(node.props.children,out);}return out; }
  const nodes = () => [...walk(tree.props.action), ...walk(tree.props.editor), ...walk(tree.props.children)];
  const find = label => nodes().find(n=>n.props.accessibilityLabel===label);
  const press = label => { if(label==='New folder on MacBook'){const action=tree.props.menuActions.find(a=>a.id==='new-folder');if(!action.disabled)action.onSelect();render();return;} const node=find(label); assert.ok(node,label); if(!node.props.disabled)node.props.onPress(); render(); };
  render();
  return {menu:()=>tree.props.menuActions,find,press,render,nodes,calls,reject:message=>rejectOpen(new Error(message)),resolve:value=>resolveOpen(value)};
}
test('host new-folder action delegates to the common folder modal',()=>{const h=harness();h.press('New folder on MacBook');assert.deepEqual(h.calls,[{host:'remote',name:undefined}]);assert.equal(h.find('Folder name on MacBook'),undefined)});
test('offline host cannot request a new folder',()=>{const h=harness('offline');h.press('New folder on MacBook');assert.deepEqual(h.calls,[])});

test('top-level folders render as siblings of host branches and stay out of host children',()=>{
 const jsx=(type,props)=>({type,props});const mod={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(require.resolve('../client/automatic-tree.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 new Function('require','exports',code)(name=>name==='./i18n'?{t:s=>s}:name==='../shared/model'?{memberRef:(hostId,id)=>({hostId,id})}:name==='../shared/folder-view'?require('./folder-fixture.cjs'):name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='./conversation-view'?{ConversationViewContext:{Provider:'Provider'}}:name==='../shared/conversations'?{defaultConversationOptions:{search:''}}:{},mod.exports);
 const groups=[{id:'root',name:'Root folder',topLevel:true,agentIds:[]},{id:'nested',name:'Host folder',agentIds:[]}];
 const tree=mod.exports.AutomaticTree({mode:'server-project',hosts:[{serverId:'local',label:'MacBook'}],view:{},row(){},createFolder(){},foldersForHost:()=>groups});
 const [hosts,roots]=tree.props.children.filter(Boolean);assert.equal(roots[0].props.group.id,'root');assert.deepEqual(hosts[0].props.groups.map(g=>g.id),['nested']);
});

test('automatic views retain pinned folders in their original host/project list',()=>{
 const jsx=(type,props)=>({type,props}),mod={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(require.resolve('../client/automatic-tree.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 new Function('require','exports',code)(name=>name==='./i18n'?{t:s=>s}:name==='../shared/model'?{memberRef:(hostId,id)=>({hostId,id})}:name==='../shared/folder-view'?require('./folder-fixture.cjs'):name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='./conversation-view'?{ConversationViewContext:{Provider:'Provider'}}:name==='../shared/conversations'?{defaultConversationOptions:{search:''}}:{},mod.exports);
 const groups=[{id:'root',name:'Root',pinned:true,topLevel:true,agentIds:['chat']},{id:'child',parentId:'root',name:'Child',pinned:true,agentIds:[]}];
 const tree=mod.exports.AutomaticTree({mode:'server-project',hosts:[{serverId:'local',label:'Local'}],view:{theme:{colors:{}}},row(){},createFolder(){},foldersForHost:()=>groups});
 const [favoriteSection,hosts,regularRoots]=tree.props.children;
 assert.strictEqual(favoriteSection.props.children[1][0].props.children.props.group,groups[0]);assert.strictEqual(regularRoots[0].props.group,groups[0]);
 assert.strictEqual(regularRoots[0].props.groups[1],groups[1]);assert.equal(hosts[0].props.groups.length,0);
});
