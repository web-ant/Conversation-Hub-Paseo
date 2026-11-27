const {test}=require('node:test');const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
test('registers settings and the existing sidebar ID, and cleans both up',async()=>{
 const code=ts.transpileModule(fs.readFileSync(require.resolve('../index.client.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const mod={exports:{}},registrations=[],removed=[];
 const imports={'react/jsx-runtime':{jsx:(type,props)=>({type,props})},'./client/i18n':{messages:{message:k=>k}},'./client/sidebar':{SidebarWithTabs:'Sidebar'},'./client/settings-screen':{AppearanceSettings:'Settings',ConversationHubIcon:'BrandIcon'},'./client/density':{ViewActionsContext:{Provider:'Provider'}}};
 new Function('require','exports',code)(n=>{assert.ok(n in imports,n);return imports[n]},mod.exports);
 const add=contribution=>{registrations.push(contribution);return()=>removed.push(contribution.id)};
 const cleanup=mod.exports.default({addSettingsScreen:add,addSidebarView:add,openSettings(){}});
 assert.deepEqual(registrations.map(x=>x.id),['appearance','folders']);
 assert.equal(registrations[0].icon,'BrandIcon');
 assert.equal(registrations[1].Component({}).props.children.type,'Sidebar');
 await cleanup();assert.deepEqual(removed,['appearance','folders']);
});
