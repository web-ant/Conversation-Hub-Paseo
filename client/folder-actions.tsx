import { rowMenuAnchor } from '../shared/popover';
import { createContext, useContext, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { PluginSidebarViewProps } from '@getpaseo/plugin/client';
import type { Group } from '../shared/model';
import type { FolderPatch } from '../shared/folder-view';
import { ContextMenu, type MenuPoint } from './context-menu';
import { FeedbackPressable as Pressable, Glyph } from './visuals';
import { FolderEditor } from './folder-editor';
import { useSidebarMetrics } from './density';
import { t } from './i18n';
export interface FolderControls {
  revision(hostId:string):string;
  update(hostId:string,id:string,patch:FolderPatch,revision:string,baseline?:Group):Promise<boolean>;
  action(hostId:string,group:Group,action:'rename'|'child'|'delete'):Promise<boolean|void>|boolean|void;
  moveUp?(hostId:string,group:Group):Promise<boolean>;
}
export const FolderControlsContext=createContext<FolderControls|null>(null);
/** Menus and editors live in portals, outside the draggable row and its animated contents. */
export function FolderActions({hostId,group,view,requestedAnchor,onMenuClose}:{hostId:string;group:Group;view:PluginSidebarViewProps;requestedAnchor?:MenuPoint|null;onMenuClose?():void}){
  const controls=useContext(FolderControlsContext);const metrics=useSidebarMetrics();
  const button=useRef<View>(null);const [anchor,setAnchor]=useState<MenuPoint|null>(null);const [editing,setEditing]=useState(false);const [error,setError]=useState<string|null>(null);const revision=useRef('');const [busy,setBusy]=useState(false);
  const baseline=useRef<Group|undefined>(undefined);
  const point=anchor??requestedAnchor??null;
  const closeMenu=()=>{setAnchor(null);onMenuClose?.()};
  if(!controls)return null;
  const edit=()=>{revision.current=controls.revision(hostId);baseline.current=group;setEditing(true)};
  const pin=async()=>{if(busy)return;setBusy(true);setError(null);try{if(!await controls.update(hostId,group.id,{pinned:!group.pinned},controls.revision(hostId)))setError(t('Could not update folder. Please try again.'));}catch{setError(t('Could not update folder. Please try again.'))}finally{setBusy(false)}};
  return <>
    <Pressable theme={view.theme} focusRef={button} accessibilityRole="button" accessibilityLabel={t('Folder actions for {0}',group.name)} accessibilityState={{expanded:!!point,disabled:busy}} disabled={busy} onPress={()=>button.current?.measureInWindow((x,y,width,height)=>setAnchor(rowMenuAnchor(x,y,width,height)))} style={{width:metrics.action,minHeight:metrics.action,alignItems:'center',justifyContent:'center',borderRadius:6}}><Glyph name="menu" color={view.theme.colors.foregroundMuted}/></Pressable>
    <ContextMenu anchor={point} close={closeMenu} view={view} actions={[
      {id:'edit',label:t('Edit'),onSelect:edit},
      {id:'pin',label:t(group.pinned?'Unpin folder':'Pin folder'),onSelect:()=>{void pin()}},
      ...(!group.parentId?[{id:'child',label:t('New subfolder…'),onSelect:()=>{void controls.action(hostId,group,'child')}}]:[]),
      ...(controls.moveUp?[{id:'move-up',label:t('Move up'),onSelect:()=>{void controls.moveUp!(hostId,group)}}]:[]),
      {id:'delete',label:t('Delete folder'),danger:true,onSelect:()=>{void controls.action(hostId,group,'delete')}},
    ]}/>
    {editing&&<FolderEditor group={group} view={view} close={()=>setEditing(false)} save={patch=>controls.update(hostId,group.id,patch,revision.current,baseline.current)} remove={async()=>controls.revision(hostId)===revision.current && await controls.action(hostId,group,'delete')!==false}/>}
    {error&&<Text accessibilityRole="alert" style={{fontSize:11,color:view.theme.colors.statusDanger,maxWidth:200}}>{error}</Text>}
  </>;
}
