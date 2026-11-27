const fs=require('node:fs'),ts=require('typescript');
function load(path,imports={}){const m={exports:{}};new Function('exports','require',ts.transpileModule(fs.readFileSync(require.resolve(path),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(m.exports,n=>imports[n]);return m.exports;}
module.exports={load,...load('../shared/folder-view.ts'),...load('../shared/popover.ts'),FolderActions:'FolderActions',FolderControlsContext:{Provider:'FolderControlsProvider'}};
