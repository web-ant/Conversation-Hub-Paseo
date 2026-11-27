const{test}=require('node:test'),assert=require('node:assert/strict');const{load}=require('./folder-fixture.cjs');const model=load('../shared/model.ts');const{followPlan,revealOffset}=load('../shared/follow-chat.ts',{'./model':model});
const chat={hostId:'local',id:'a',key:'local:a'};
test('follow resolves the original folder and its parent without preferring pinned aliases',()=>{
 const groups=[{id:'root',name:'Work',pinned:true,agentIds:[]},{id:'child',parentId:'root',name:'Child',pinned:true,agentIds:['a']}];const before=JSON.stringify(groups);
 assert.deepEqual(followPlan(chat,[{hostId:'local',groups}],'manual'),{hostId:'local',keys:['folder:local:root','folder:local:child']});assert.equal(JSON.stringify(groups),before);
});
test('follow supports source host, cross-host membership and all automatic grouping modes',()=>{
 const remote={hostId:'remote',id:'a',key:'remote:a'},member=model.memberId('local','remote','a');
 assert.deepEqual(followPlan(remote,[{hostId:'local',groups:[{id:'g',agentIds:[member]}]},{hostId:'remote',groups:[]}],'manual'),{hostId:'local',keys:['folder:local:g']});
 for(const [mode,keys]of [['manual',['folder:local:ungrouped']],['server',['host:local']],['project',['project:p']],['server-project',['host:local','project:p']]])assert.deepEqual(followPlan(chat,[{hostId:'local',groups:[]}],mode,'p'),{hostId:'local',keys});
 assert.equal(followPlan(remote,[{hostId:'local',groups:[]}],'manual'),null);
});
test('a subtask follows its parent folder and opens the subtask list',()=>{
 const parent={hostId:'local',id:'parent',key:'local:parent'};assert.deepEqual(followPlan(chat,[{hostId:'local',groups:[{id:'parent-folder',agentIds:['parent']}]}],'server-project','p',parent),{hostId:'local',keys:['host:local','folder:local:parent-folder','subtasks:local:parent']});
});
test('placed project nesting expands the project branch and honours top-level host placement',()=>{
 assert.deepEqual(followPlan(chat,[{hostId:'local',groups:[{id:'p',projectKey:'p-key',topLevel:true,agentIds:[]},{id:'child',parentId:'p',agentIds:['a']}]}],'server-project'),{hostId:'local',keys:['project:p-key','folder:local:child']});
});
test('scroll offsets preserve visible rows and reveal clipped rows with minimal travel',()=>{
 const frame={top:100,height:300};assert.equal(revealOffset({top:150,height:30},frame,250),250);assert.equal(revealOffset({top:70,height:30},frame,250),216);assert.equal(revealOffset({top:390,height:30},frame,250),274);assert.equal(revealOffset({top:0,height:30},frame,20),0);
});

test('nested chats reveal their displayed parent even if the child has separate stored membership',()=>{
 const parent={hostId:'local',id:'parent',key:'local:parent'};assert.deepEqual(followPlan(chat,[{hostId:'local',groups:[{id:'child-folder',agentIds:['a']},{id:'parent-folder',agentIds:['parent']}]}],'manual',undefined,parent),{hostId:'local',keys:['folder:local:parent-folder','subtasks:local:parent']});
});

test('a parent outside saved folders stays the target of an explicitly filed subtask',()=>{
 const parent={hostId:'local',id:'parent',key:'local:parent'};assert.deepEqual(followPlan(chat,[{hostId:'local',groups:[{id:'child-only',agentIds:['a']}]}],'manual',undefined,parent),{hostId:'local',keys:['folder:local:ungrouped','subtasks:local:parent']});
});
