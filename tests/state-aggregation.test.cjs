const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');const mod={exports:{}};new Function('exports',ts.transpileModule(fs.readFileSync(require.resolve('../shared/status.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(mod.exports);
const {conversationState,aggregateStates,quietSubtask}=mod.exports;

test('a pending reply outranks running even without unread attention',()=>{
 const agent={status:'running',requiresAttention:false,attentionReason:null,parentAgent:{}};
 assert.equal(conversationState(agent,2),'permission');
 assert.equal(conversationState(agent,1),'permission');
 assert.equal(conversationState(agent,0),'running');
 assert.equal(conversationState({...agent,attentionReason:'permission'}),'permission');
 assert.equal(quietSubtask(agent,1),false);
 assert.equal(quietSubtask(agent,0),true);
 assert.deepEqual(aggregateStates(['running','permission']),{state:'permission',hasUpdates:true});
});
test('actual agent state controls busy/error/permission/finished updates without workspace lag',()=>{assert.equal(conversationState({status:'running',requiresAttention:true,attentionReason:'finished'}),'running');assert.equal(conversationState({status:'idle',requiresAttention:true,attentionReason:'finished'}),'updated');assert.equal(conversationState({status:'idle',requiresAttention:false,attentionReason:'finished'}),'finished');assert.equal(conversationState({status:'idle',requiresAttention:true,attentionReason:'permission'}),'permission');assert.deepEqual(aggregateStates(['idle','updated','running']),{state:'running',hasUpdates:true});assert.deepEqual(aggregateStates(['idle']),{state:'idle',hasUpdates:false});});

test('reading a finished conversation clears unread state while preserving completion',()=>{assert.equal(conversationState({status:'idle',requiresAttention:false,attentionReason:null}),'finished');assert.equal(conversationState({status:'idle',requiresAttention:true,attentionReason:'finished'}),'updated');assert.equal(aggregateStates(['finished']).hasUpdates,false);assert.equal(aggregateStates(['finished','updated']).hasUpdates,true);});
