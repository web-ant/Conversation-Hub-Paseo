const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./folder-fixture.cjs');
const {orderFolders}=load('../shared/folder-order.ts');
const {folderEntries}=load('../shared/folder-view.ts');
const group=(id,name,agentIds=[],parentId)=>({id,name,agentIds,...(parentId?{parentId}:{})});
test('folder title order sorts siblings naturally without changing membership, pinning or saved manual order',()=>{
 const groups=[{...group('b','Папка 10',['b']),pinned:true},group('a','Папка 2',['a']),group('y','Я',['y'],'a'),group('d','А',['d'],'a')];
 const before=structuredClone(groups);
 const sorted=orderFolders(groups,'title','asc');
 assert.deepEqual(folderEntries(sorted,()=>true).filter(e=>!e.pinnedSection).map(e=>[e.group.id,e.depth]),[['a',0],['d',1],['y',1],['b',0]]);
 assert.deepEqual(orderFolders(groups,'title','desc').filter(g=>!g.parentId).map(g=>g.id),['b','a']);
 assert.deepEqual(orderFolders(groups,'manual','desc'),groups);assert.deepEqual(groups,before);assert.equal(sorted.find(g=>g.id==='b'),groups[0]);
});
test('folder activity includes subfolders and cross-host members, with empty folders last in either direction',()=>{
 const remote='host-agent:["remote","chat"]';
 const groups=[group('child','Child',[remote],'root'),group('root','Root',['old']),group('other','Other',['mid']),group('empty','Empty')];
 const times=new Map([[remote,30],['old',10],['mid',20]]);
 assert.deepEqual(orderFolders(groups,'activity','desc',times).filter(g=>!g.parentId).map(g=>g.id),['root','other','empty']);
 assert.deepEqual(orderFolders(groups,'activity','asc',times).filter(g=>!g.parentId).map(g=>g.id),['other','root','empty']);
 assert.deepEqual(orderFolders(groups,'activity','desc',new Map()).filter(g=>!g.parentId).map(g=>g.id),['empty','other','root']);
});
test('old settings acquire recent and folder sorting defaults without changing existing preferences',()=>{
 const {z}=require('zod');const {displayPreferences}=load('../shared/settings.ts',{'@getpaseo/plugin':{defineSettings:x=>x},zod:{z}});
 const values=displayPreferences.schema.parse({sortBy:'title',sortDirection:'desc',grouping:'project'});
 assert.equal(values.showRecent,true);assert.equal(values.recentLimit,10);assert.equal(values.folderSortBy,'manual');assert.equal(values.folderSortDirection,'asc');assert.equal(values.sortBy,'title');
 assert.equal(displayPreferences.schema.safeParse({...values,recentLimit:0}).success,false);
 assert.equal(displayPreferences.schema.safeParse({...values,folderSortBy:'unknown'}).success,false);
});
