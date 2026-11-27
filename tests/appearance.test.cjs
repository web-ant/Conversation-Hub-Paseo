const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const {sidebarMetrics,DEFAULT_APPEARANCE,appearance}=require('./appearance-fixture.cjs');
test('all supported font sizes fit inside desktop rows and preserve native touch targets',()=>{
 for(let textSize=10;textSize<=18;textSize++)for(const rowSpacing of ['compact','normal','relaxed']){
  const values={...DEFAULT_APPEARANCE,textSize,rowSpacing};const desk=sidebarMetrics(false,values),phone=sidebarMetrics(true,values);
  assert.ok(desk.row>=desk.line+8);assert.ok(phone.row>=44);assert.ok(phone.folder>=44);assert.equal(desk.nestedText,textSize-1);
 }
 assert.equal(sidebarMetrics(false).row,28);assert.equal(sidebarMetrics(false).text,12);assert.equal(appearance.scope,'device');
});
test('appearance defaults load without changing or migrating folders',()=>{
 assert.deepEqual(appearance.schema.parse({}),DEFAULT_APPEARANCE);
 assert.equal(appearance.schema.safeParse({textSize:50}).success,false);
 assert.equal(appearance.schema.safeParse({language:'ru',titleLines:2}).success,true);
});
function languageHarness(appLocale='en',override='auto'){
 let language=override;const m={exports:{}};const ruSource=fs.readFileSync(require.resolve('../client/ru.ts'),'utf8');const ru=JSON.parse(ruSource.slice(ruSource.indexOf('{'),ruSource.lastIndexOf('}')+1));
 const imports={'@getpaseo/plugin/client':{defineTranslations:x=>x,useTranslation:()=>({locale:appLocale}),useSettings:()=>({status:'ready',values:{language}})},'../shared/appearance':{appearance:{}},'./ru':{ru}};
 new Function('require','exports',ts.transpileModule(fs.readFileSync(require.resolve('../client/i18n.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(n=>imports[n],m.exports);
 return{...m.exports,setLanguage(next){language=next;m.exports.useAppLanguage()}};
}
test('Russian regional locales follow Paseo and switching back to English restores English',()=>{
 const h=languageHarness('ru-RU');h.useAppLanguage();assert.equal(h.t('New folder'),'Новая папка');assert.equal(h.t('Add {0} conversations',3),'Добавить чаты: 3');assert.equal(h.timeLabel('5m'),'5 мин');
 h.setLanguage('en');assert.equal(h.t('New folder'),'New folder');assert.equal(h.timeLabel('5m'),'5m');h.setLanguage('auto');assert.equal(h.t('New folder'),'Новая папка');
});
test('every literal UI translation has Russian text with the same placeholders',()=>{
 const source=fs.readFileSync(require.resolve('../client/ru.ts'),'utf8');const ru=JSON.parse(source.slice(source.indexOf('{'),source.lastIndexOf('}')+1));const keys=new Set();
 for(const name of fs.readdirSync(require.resolve('../client/i18n.ts').replace(/i18n.ts$/,''))){if(!/\.tsx?$/.test(name))continue;const p=require.resolve('../client/'+name);const ast=ts.createSourceFile(name,fs.readFileSync(p,'utf8'),ts.ScriptTarget.Latest,true,name.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);function visit(n){if(ts.isCallExpression(n)&&ts.isIdentifier(n.expression)&&n.expression.text==='t'&&n.arguments[0]&&ts.isStringLiteral(n.arguments[0]))keys.add(n.arguments[0].text);ts.forEachChild(n,visit)}visit(ast)}
 for(const key of keys){assert.ok(ru[key],'Missing Russian translation: '+key);assert.deepEqual((ru[key].match(/\{\d\}/g)||[]).sort(),(key.match(/\{\d\}/g)||[]).sort(),key)}
});
