import type {Group,Organization} from './model';
const ruleError = 'Use an absolute directory path or a pattern with * or **.';
const isWindowsPath = (path:string) => /^[a-z]:\//i.test(path) || path.startsWith('//');

function normalize(value:string, rule:boolean):string {
 let path=value.trim();
 const error=()=>Error(rule?ruleError:'Use absolute workspace directory paths.');
 if(!path||/[\0\r\n]/.test(path))throw error();
 const windows=/^[A-Za-z]:[\\/]/.test(path)||/^\\\\/.test(path)||path.startsWith('//');
 if(windows)path=path.replace(/\\/g,'/').toLowerCase();
 else if(rule&&!path.startsWith('/')&&path.includes('*'))path=path.replace(/\\/g,'/');
 const absolute=path.startsWith('/')||/^[a-z]:\//.test(path);
 if(!absolute&&(!rule||!path.includes('*')||path.startsWith('~')||/^[a-z]:/i.test(path)))throw error();
 const prefix=path.startsWith('//')?'//':path.startsWith('/')?'/':absolute?path.slice(0,3):'';
 const parts:string[]=[];
 for(const segment of path.slice(prefix.length).split('/')){
  if(!segment||segment==='.')continue;
  if(segment==='..'){
   // A wildcard's parent is not a fixed directory and cannot be collapsed lexically.
   if(rule&&(parts.at(-1)?.includes('*')||!absolute&&!parts.length))throw error();
   parts.pop();
  }else parts.push(rule?segment.replace(/\*{3,}/g,'**'):segment);
 }
 const result=prefix+parts.join('/');
 if(!absolute&&!result.includes('*'))throw error();
 return result;
}

/** Actual cwd paths stay literal; binding rules may additionally contain wildcards. */
export function normalizeWorkspacePath(value:string):string {return normalize(value,false);}
export function normalizeWorkspaceRule(value:string):string {return normalize(value,true);}
export function normalizeWorkspacePaths(paths:readonly string[]):string[]{return Array.from(new Set(paths.filter(p=>p.trim()).map(normalizeWorkspaceRule)));}

type Token = {kind:'literal';value:string}|{kind:'star'|'globstar'|'directories'|'descendants'};
function patternTokens(pattern:string):Token[]{
 // A pattern without a root may start at any directory boundary.
 const tokens:Token[]=pattern.startsWith('/')||/^[a-z]:\//i.test(pattern)?[]:[{kind:'directories'}];
 for(let i=0;i<pattern.length;i++){
  if(pattern.slice(i)==='/**'){tokens.push({kind:'descendants'});break;}
  if(pattern[i]!=='*'){tokens.push({kind:'literal',value:pattern[i]});continue;}
  if(pattern[i+1]!=='*'){tokens.push({kind:'star'});continue;}
  i++;
  if(pattern[i+1]==='/'&&(i===1||pattern[i-2]==='/')){tokens.push({kind:'directories'});i++;}
  else tokens.push({kind:'globstar'});
 }
 return tokens;
}

/** Bounded dynamic programming, avoiding regex backtracking for wildcard-heavy rules. */
function matchesPattern(tokens:readonly Token[],directory:string):boolean {
 let previous=new Uint8Array(directory.length+1),next=new Uint8Array(directory.length+1);
 previous[0]=1;
 for(const token of tokens){
  next.fill(0);
  if(token.kind==='literal'){
   for(let i=0;i<directory.length;i++)if(previous[i]&&directory[i]===token.value)next[i+1]=1;
  }else if(token.kind==='star'||token.kind==='globstar'){
   next[0]=previous[0];
   for(let i=1;i<=directory.length;i++)next[i]=previous[i]||next[i-1]&&(token.kind==='globstar'||directory[i-1]!=='/')?1:0;
  }else{
   let reachable=false;
   for(let i=0;i<=directory.length;i++){
    if(token.kind==='directories'){
     // **/ can consume no directories, or end immediately after any slash.
     next[i]=previous[i]||reachable&&directory[i-1]==='/'?1:0;
     reachable=reachable||!!previous[i];
    }else{
     // A trailing /** includes the directory itself as well as its descendants.
     reachable=reachable||!!(i&&previous[i-1]&&directory[i-1]==='/');
     next[i]=previous[i]||reachable?1:0;
    }
   }
  }
  [previous,next]=[next,previous];
 }
 return !!previous[directory.length];
}

type Specificity = readonly [number,number,number,number];
function compareSpecificity(a:Specificity,b:Specificity):number {
 for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]-b[i];
 return 0;
}
export function matchWorkspaceFolder(groups:readonly Group[],directories:readonly string[],includeSubdirectories=true):Group|null {
 const paths=directories.flatMap(raw=>{try{return[normalizeWorkspacePath(raw)]}catch{return[]}});
 const candidates:Array<{group:Group;score:Specificity}>=[];
 for(const group of groups)for(const rule of group.workspacePaths??[]){
  let root;try{root=normalizeWorkspaceRule(rule)}catch{continue;}
  const pattern=root.includes('*'),tokens=pattern?patternTokens(root):[];
  const globstars=root.match(/\*\*/g)?.length??0;
  const stars=root.replace(/\*\*/g,'').match(/\*/g)?.length??0;
  const literalLength=root.replace(/\*/g,'').length;
  let windowsTokens:Token[]|undefined;
  for(const dir of paths){
   // Windows path names are case insensitive, including rootless patterns.
   const activeTokens=pattern&&isWindowsPath(dir)&&!isWindowsPath(root)?windowsTokens??(windowsTokens=patternTokens(root.toLowerCase())):tokens;
   const matched=pattern?matchesPattern(activeTokens,dir):dir===root||includeSubdirectories&&dir.startsWith(root.endsWith('/')?root:root+'/');
   if(matched)candidates.push({group,score:[!pattern&&dir===root?1:0,literalLength,-globstars,-stars]});
  }
 }
 // Exact paths win. Otherwise prefer more literal text, then fewer broad wildcards.
 candidates.sort((a,b)=>compareSpecificity(b.score,a.score));
 if(!candidates.length)return null;
 const best=candidates[0];
 return candidates.some(c=>compareSpecificity(c.score,best.score)===0&&c.group.id!==best.group.id)?null:best.group;
}
export function routeNewAgent(state:Organization,id:string,directories:readonly string[],includeSubdirectories=true):Organization {
 if(state.assignments?.some(a=>a.agentId===id)||state.groups.some(g=>g.agentIds.includes(id))||state.ungroupedOrder.includes(id))return state;
 const target=matchWorkspaceFolder(state.groups,directories,includeSubdirectories);if(!target)return state;
 return{...state,groups:state.groups.map(g=>g.id===target.id?{...g,agentIds:[...g.agentIds,id]}:g)};
}
