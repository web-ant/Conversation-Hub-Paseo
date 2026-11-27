const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const fs=require('node:fs');

function harness({remote=false,missing=false,wrongId=false,mismatch=false,updateError=false,connectError=false,noHome=false}={}){
 const calls=[];let title='Before';let closed=0;let constructed=0;
 const process={env:noHome?{}:{PASEO_HOME:'/demo',PASEO_HOST:'inherited',PASEO_AGENT_ID:'context',PASEO_WORKSPACE_ID:'context',PATH:''}};
 const imports={
  'node:process':{default:process},
  'node:child_process':{execFile(){assert.fail('Rename must work without the Paseo CLI')}},
  './local-host':{LocalHost:class{
   constructor(home){assert.equal(home,'/demo');constructed++}
   async client(){if(connectError)throw Error('Cannot connect to daemon');return {async updateAgent(id,updates){calls.push({id,updates});if(updateError)throw Error('Host rejected rename');title=updates.name}}}
   async close(){closed++}
  }},
 };
 const mod={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(require.resolve('../server/conversation-actions.ts'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
 new Function('require','exports',code)(name=>imports[name],mod.exports);
 const context={paseo:{hosts:{list:async()=>({self:{serverId:remote?'other':'local'}})},agents:{ref:id=>({refresh:async()=>missing?null:{agent:{id:wrongId?'different-id':id,title:mismatch?'Wrong':title}}})}}};
 return {calls,get closed(){return closed},get constructed(){return constructed},run:input=>mod.exports.renameSourceConversation(input,context)};
}
const input={hostId:'local',agentId:'exact-id',title:'After'};

test('rename uses the SDK without a CLI on PATH and verifies the persisted title',async()=>{
 const h=harness();assert.deepEqual(await h.run(input),{renamed:true,title:'After'});
 assert.deepEqual(h.calls,[{id:'exact-id',updates:{name:'After'}}]);assert.equal(h.closed,1);
});
test('rename trims the name and sends shell characters literally',async()=>{
 const h=harness();const title='Обсуждение $(whoami); `id` "тест"';
 assert.deepEqual(await h.run({...input,title:`  ${title}  `}),{renamed:true,title});
 assert.deepEqual(h.calls,[{id:'exact-id',updates:{name:title}}]);
});
test('rename rejects remote hosts, missing conversations and missing home before connecting',async()=>{
 for(const options of [{remote:true},{missing:true},{wrongId:true},{noHome:true}]){
  const h=harness(options);await assert.rejects(h.run(input));assert.equal(h.constructed,0);assert.equal(h.calls.length,0);
 }
});
test('rename preserves host errors and closes its connection on failures',async()=>{
 for(const [options,message]of [[{updateError:true},/Host rejected rename/],[{connectError:true},/Cannot connect/],[{mismatch:true},/did not confirm/]]){
  const h=harness(options);await assert.rejects(h.run(input),message);assert.equal(h.closed,1);
 }
});
test('rename rejects empty or overlong titles before opening a connection',async()=>{
 for(const title of ['  ','x'.repeat(121)]){const h=harness();await assert.rejects(h.run({...input,title}),/Enter a conversation name/);assert.equal(h.constructed,0)}
});
