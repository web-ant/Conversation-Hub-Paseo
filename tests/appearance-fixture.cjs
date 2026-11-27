const ts=require('typescript'),fs=require('node:fs');
function load(path,imports={}){const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(require.resolve(path),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;new Function('exports','require',code)(m.exports,n=>imports[n]??require(n));return m.exports;}
const appearance=load('../shared/appearance.ts',{'@getpaseo/plugin':{defineSettings:x=>x}});
const density=load('../client/density.tsx',{'../shared/appearance':appearance,'@getpaseo/plugin/client':{useSettings(){throw Error('not rendered')}}});
module.exports={...density,...appearance,useSidebarMetrics:()=>density.sidebarMetrics(false),SidebarDensityProvider:'SidebarDensityProvider',ViewActionsContext:{Provider:'ViewActionsProvider'}};
