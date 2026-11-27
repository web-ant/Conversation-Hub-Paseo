import {createContext,useContext,useEffect,useRef,type ReactNode,type RefObject} from 'react';
import {View,ScrollView} from 'react-native';
import {useAgent,useWorkspace,type AgentRef} from '@getpaseo/plugin/client';
import {followPlan,revealOffset} from '../shared/follow-chat';
import type {Group} from '../shared/model';
import {useViewState} from './view-state';
import {TouchScrollView} from './touch-drag';

interface FollowApi {
  register(key:string,node:RefObject<View|null>):()=>void;
  request(key:string):void;
  cancel():void;
  viewport:RefObject<View|null>;
  scroll:RefObject<ScrollView|null>;
  offset:RefObject<number>;
}
const Context=createContext<FollowApi|null>(null);
const Canonical=createContext(true);
export function FollowRowScope({canonical,children}:{canonical:boolean;children:ReactNode}){return <Canonical.Provider value={canonical}>{children}</Canonical.Provider>}
export function FollowChatProvider({children}:{children:ReactNode}){
  const rows=useRef(new Map<string,Set<RefObject<View|null>>>()),scroll=useRef<ScrollView>(null),viewport=useRef<View>(null),offset=useRef(0);
  const timers=useRef<ReturnType<typeof setTimeout>[]>([]),generation=useRef(0);
  const cancel=()=>{generation.current++;timers.current.forEach(clearTimeout);timers.current=[];};
  const api=useRef<FollowApi>({scroll,viewport,offset,cancel,register(key,node){let entries=rows.current.get(key);if(!entries)rows.current.set(key,entries=new Set());entries.add(node);return()=>{entries!.delete(node);if(!entries!.size)rows.current.delete(key);}},request(key){
    cancel();const current=generation.current;
    // Reveal animates branch heights. Wait for layout, then retry briefly while host data mounts.
    for(const delay of [180,360,700,1200,2000])timers.current.push(setTimeout(()=>{
      if(current!==generation.current)return;
      const row=[...(rows.current.get(key)??[])].find(node=>node.current)?.current,scroller=scroll.current,frame=viewport.current;
      if(!row||!scroller||!frame)return;
      frame.measureInWindow((_x,top,_w,height)=>{if(!height||current!==generation.current)return;row.measureInWindow((_rx,rowTop,_rw,rowHeight)=>{
        if(!rowHeight||current!==generation.current)return;
        const y=revealOffset({top:rowTop,height:rowHeight},{top,height},offset.current);
        if(y!==offset.current){scroller.scrollTo({y,animated:false});offset.current=y;}
        cancel();
      });});
    },delay));
  }}).current;
  useEffect(()=>()=>cancel(),[]);
  return <Context.Provider value={api}>{children}</Context.Provider>;
}
export function FollowChatScrollView(props:React.ComponentProps<typeof TouchScrollView>){
  const api=useContext(Context);
  return <View ref={api?.viewport} collapsable={false} style={{flex:1,minHeight:0,minWidth:0}}><TouchScrollView {...props} scrollRef={api?.scroll} onScroll={event=>{if(api)api.offset.current=event.nativeEvent.contentOffset.y;props.onScroll?.(event)}}/></View>;
}
export function useFollowChatRow(key:string,shortcut=false){
  const api=useContext(Context),canonical=useContext(Canonical),node=useRef<View>(null);
  useEffect(()=>!shortcut&&canonical?api?.register(key,node):undefined,[api,key,shortcut,canonical]);
  return node;
}
/** This component is mounted only with an active ref, so entity hooks always receive a valid ref. */
export function FollowActiveChat({active,enabled,groups,mode,pickHost,nesting=true,members}:{nesting?:boolean;members?:readonly {hostId:string;agentId:string}[];active:AgentRef;enabled:boolean;groups:readonly {hostId:string;groups:readonly Group[]}[];mode:'manual'|'project'|'server'|'server-project';pickHost(hostId:string):void}){
  const agent=useAgent(active),parentAgent=useAgent(agent?.parentAgent??'');
  const parent=nesting&&parentAgent&&!parentAgent.background&&(!members||members.some(member=>member.hostId===parentAgent.hostId&&member.agentId===parentAgent.id))?parentAgent:null;
  const workspace=useWorkspace(parent?.workspace??agent?.workspace??'');
  const view=useViewState(),api=useContext(Context),last=useRef('');
  const plan=agent?followPlan(active,groups,mode,workspace?.project.key,parent?{hostId:parent.hostId,id:parent.id,key:parent.ref.key}:undefined):null;
  const signature=JSON.stringify([active.key,mode,plan]);
  const latest=useRef({view,api,pickHost,plan});latest.current={view,api,pickHost,plan};
  useEffect(()=>{
    const {view,api,pickHost,plan}=latest.current;
    if(!enabled){last.current='';api?.cancel();return;}
    if(!plan||!view||last.current===signature)return;
    last.current=signature;
    pickHost(plan.hostId);view.reveal(plan.keys);api?.request(active.key);
  },[signature,enabled]);
  useEffect(()=>()=>api?.cancel(),[api]);
  return null;
}
