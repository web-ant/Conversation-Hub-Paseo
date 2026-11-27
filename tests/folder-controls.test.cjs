const{test}=require('node:test'),assert=require('node:assert/strict');const{load,folderEntries,popoverPosition}=require('./folder-fixture.cjs');
test('pinned folders are additional references and their original rows keep the same order',()=>{
 const groups=[{id:'a',name:'A',agentIds:[]},{id:'d',name:'Other child',parentId:'a',agentIds:[]},{id:'c',name:'Child',parentId:'a',pinned:true,agentIds:['chat'],icon:'BookOpen'},{id:'b',name:'B',pinned:true,agentIds:[]}];const original=JSON.stringify(groups);
 const entries=folderEntries(groups,()=>true);
 assert.deepEqual(entries.filter(e=>e.pinnedSection).map(e=>e.group.id),['c','b']);
 assert.deepEqual(entries.filter(e=>!e.pinnedSection).map(e=>[e.group.id,e.depth]),[['a',0],['d',1],['c',1],['b',0]]);
 assert.equal(new Set(entries.map(e=>e.renderKey)).size,entries.length);
 assert.strictEqual(entries.find(e=>e.pinnedSection&&e.group.id==='c').group,entries.find(e=>!e.pinnedSection&&e.group.id==='c').group);
 assert.deepEqual(folderEntries(groups,()=>false).filter(e=>e.pinnedSection).map(e=>e.group.id),['c','b']);
 assert.equal(JSON.stringify(groups),original);
});
test('a pinned parent and child appear once per section and unpinning leaves the original row',()=>{
 const groups=[{id:'root',name:'Root',pinned:true,agentIds:[]},{id:'child',parentId:'root',name:'Child',pinned:true,agentIds:['chat']}];
 const entries=folderEntries(groups,()=>true);assert.deepEqual(entries.map(e=>[e.group.id,e.pinnedSection]),[['root',true],['child',true],['root',false],['child',false]]);
 assert.equal(new Set(entries.map(e=>e.renderKey)).size,entries.length);
 const unpinned=folderEntries(groups.map(g=>({...g,pinned:false})),()=>true);assert.deepEqual(unpinned.map(e=>e.group.id),['root','child']);assert.ok(unpinned.every(e=>!e.pinnedSection));
});
test('popover opens to the right, flips at the right edge, and fits a small viewport',()=>{
 assert.deepEqual(popoverPosition({x:310,y:70,left:280},{width:1200,height:800},{width:208,height:170}),{left:310,top:70,width:208,maxHeight:170});
 const p=popoverPosition({x:390,y:790,left:356},{width:390,height:800},{width:208,height:170});assert.equal(p.left,142);assert.ok(p.top+p.maxHeight<=792);
 const small=popoverPosition({x:2,y:2},{width:160,height:100},{width:360,height:500});assert.ok(small.left+small.width<=160);assert.ok(small.top+small.maxHeight<=100);
});
function editorHarness(save=async()=>true){let cursor=0,states=[],tree;const calls=[];const jsx=(type,props)=>({type,props});const react={useState(v){const i=cursor++;if(!(i in states))states[i]=v;return[states[i],next=>states[i]=typeof next==='function'?next(states[i]):next]},useRef(v){const i=cursor++;if(!(i in states))states[i]={current:v};return states[i]}};const imports={'../shared/workspace-routing':load('../shared/workspace-routing.ts'),'../shared/lucide-icons':load('../shared/lucide-icons.ts'),react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':{Modal:'Modal',Pressable:'NativePressable',ScrollView:'ScrollView',Text:'Text',TextInput:'Input',View:'View',useWindowDimensions:()=>({width:1200,height:800})},'../shared/popover':require('./folder-fixture.cjs'),'./i18n':{t:(s,...a)=>s.replace(/\{(\d)\}/g,(_,i)=>a[i])},'./visuals':{FeedbackPressable:'Button',Glyph:'Glyph'}};const mod=load('../client/folder-editor.tsx',imports);
 const props={group:{id:'g',name:'Before',icon:'BookOpen',agentIds:['existing-chat']},view:{layout:{compact:false},theme:{colors:{}}},close:()=>calls.push('close'),save:async patch=>{calls.push(patch);return save(patch)},remove:async()=>{calls.push('delete');return true}};
 const render=()=>{cursor=0;tree=mod.FolderEditor(props)};const nodes=(n,out=[])=>{if(Array.isArray(n))n.forEach(x=>nodes(x,out));else if(n&&typeof n==='object'){out.push(n);nodes(n.props?.children,out)}return out};const find=label=>nodes(tree).find(x=>x.props?.accessibilityLabel===label);render();return{calls,render,find,nodes:()=>nodes(tree),mod};}
const tick=()=>new Promise(r=>setImmediate(r));
test('workspace directory bindings remain a draft and save as canonical absolute paths',async()=>{
 const h=editorHarness();h.find('Add directory').props.onPress();h.render();h.find('Workspace directory 1').props.onChangeText('/work/recmeet/');h.render();h.find('Add directory').props.onPress();h.render();h.find('Workspace directory 2').props.onChangeText('/work/recmeet-openspec');h.render();assert.deepEqual(h.calls,[]);h.find('Save folder').props.onPress();await tick();assert.deepEqual(h.calls[0].workspacePaths,['/work/recmeet','/work/recmeet-openspec']);assert.equal(h.calls[1],'close');
});
test('the folder editor saves rootless and absolute wildcard bindings without expanding them',async()=>{
 const h=editorHarness();
 const patterns=[' **recmeet** ','/home/webant/.PaseoChats/*','/home/webant/.PaseoChats/**'];
 for(let i=0;i<patterns.length;i++){
  h.find('Add directory').props.onPress();h.render();
  h.find('Workspace directory '+(i+1)).props.onChangeText(patterns[i]);h.render();
 }
 assert.deepEqual(h.calls,[]);
 h.find('Save folder').props.onPress();await tick();
 assert.deepEqual(h.calls[0].workspacePaths,patterns.map(s=>s.trim()));
 assert.equal(h.calls[1],'close');
});
test('relative workspace paths keep the editor open without writing settings',async()=>{
 const h=editorHarness();h.find('Add directory').props.onPress();h.render();h.find('Workspace directory 1').props.onChangeText('relative/path');h.render();h.find('Save folder').props.onPress();await tick();h.render();assert.deepEqual(h.calls,[]);assert.ok(h.nodes().some(n=>n.props?.accessibilityRole==='alert'));h.find('Remove directory 1').props.onPress();h.render();assert.ok(!h.find('Workspace directory 1'));
});
test('folder editor saves name, icon and pin together; cancel writes nothing',async()=>{
 const h=editorHarness();h.find('Folder name').props.onChangeText('After');h.render();h.find('Pin folder').props.onPress();h.render();h.find('Save folder').props.onPress();await tick();assert.deepEqual(h.calls[0],{name:'After',icon:'BookOpen',color:undefined,pinned:true});assert.equal(h.calls[1],'close');
 const cancel=editorHarness();cancel.find('Folder name').props.onChangeText('Draft');cancel.render();cancel.find('Cancel').props.onPress();assert.deepEqual(cancel.calls,['close']);
});
test('save conflict keeps the editor and draft; duplicate saves are blocked',async()=>{
 let finish;const h=editorHarness(()=>new Promise(r=>finish=r));h.find('Folder name').props.onChangeText('Keep this');h.render();const button=h.find('Save folder');button.props.onPress();button.props.onPress();h.render();assert.equal(h.calls.length,1);assert.equal(h.find('Save folder').props.disabled,true);finish(false);await tick();h.render();assert.equal(h.find('Folder name').props.value,'Keep this');assert.ok(h.nodes().some(n=>n.props?.accessibilityRole==='alert'));assert.ok(!h.calls.includes('close'));
});
test('emoji and color stay as a draft until Save is pressed',async()=>{
 const h=editorHarness();h.find('Change folder icon').props.focusRef.current={measureInWindow:cb=>cb(100,200,40,40)};h.find('Change folder icon').props.onPress();h.render();const picker=h.nodes().find(n=>n.type===h.mod.FolderIconPicker);assert.ok(picker);picker.props.change({icon:'emoji:🚀',color:'#3b82f6'});picker.props.close();h.render();assert.deepEqual(h.calls,[]);h.find('Save folder').props.onPress();await tick();assert.equal(h.calls[0].icon,'emoji:🚀');assert.equal(h.calls[0].color,'#3b82f6');
});

test('folder patch clears optional fields before schema and JSON validation',()=>{
 const {applyFolderPatch}=require('./folder-fixture.cjs');const {z}=require('zod');
 const schema=load('../shared/settings.ts',{'@getpaseo/plugin':{defineSettings:x=>x},zod:{z}}).organization.schema;
 const group={id:'g',name:'Name',agentIds:['chat']};const patch={name:'Renamed',icon:undefined,color:undefined,pinned:false};
 assert.throws(()=>z.json().parse(schema.parse({groups:[{...group,...patch}]})));
 const next=applyFolderPatch(group,patch);assert.doesNotThrow(()=>z.json().parse(schema.parse({groups:[next]})));assert.deepEqual(next.agentIds,['chat']);
});
test('chat and folder menu anchors use the same right-aligned position below the button',()=>{
 const {rowMenuAnchor}=require('./folder-fixture.cjs');assert.deepEqual(rowMenuAnchor(300,100,28,28),{x:120,y:132});
});

test('complete Lucide catalog has unique tiles and searchable English aliases and Russian time terms',()=>{
 const {FOLDER_ICONS,iconSearchText}=load('../shared/lucide-icons.ts');
 assert.ok(FOLDER_ICONS.length>1800);assert.equal(new Set(FOLDER_ICONS.map(i=>i[0])).size,FOLDER_ICONS.length);
 for(const entry of FOLDER_ICONS){assert.match(entry[0],/^[A-Z][A-Za-z0-9]*$/);assert.ok(entry[2].split(' ').includes(entry[0]));}
 const clocks=FOLDER_ICONS.filter(entry=>iconSearchText(entry).includes('часы'));assert.ok(clocks.some(entry=>entry[0]==='Clock'));assert.ok(clocks.some(entry=>entry[0]==='Watch'));
 assert.ok(FOLDER_ICONS.some(entry=>entry[0]==='AlarmClock'&&iconSearchText(entry).includes('будильник')));
 const aliased=FOLDER_ICONS.find(entry=>entry[2].split(' ').length>1);assert.ok(aliased);for(const alias of aliased[2].split(' '))assert.ok(iconSearchText(aliased).includes(alias.toLowerCase()));
});
