import { useRef, useState } from 'react';
import { Modal, Pressable as NativePressable, FlatList, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import type { PluginSidebarViewProps } from '@getpaseo/plugin/client';
import type { Group } from '../shared/model';
import type { FolderPatch } from '../shared/folder-view';
import { popoverPosition, type PopoverAnchor } from '../shared/popover';
import { FeedbackPressable as Pressable, Glyph } from './visuals';
import { t } from './i18n';
import {normalizeWorkspacePaths} from '../shared/workspace-routing';

const COLORS = ['#202123','#ef4444','#f97316','#f59e0b','#22c55e','#3b82f6','#8b5cf6','#ec4899'];
export { FOLDER_ICONS } from '../shared/lucide-icons';
import { FOLDER_ICONS, iconSearchText } from '../shared/lucide-icons';
const EMOJIS = ['📁','💼','🏠','💡','🚀','💻','🎨','📚','🎓','📝','🎵','🎬','🧪','🌱','🩺','🎮','📊','☕','🏋️','⚖️','🎙️','✈️','🌍','🔧','🐾','🧠','❤️','🎁','🗂️','📷','🚗','🔒'];

export function FolderIconPicker({ anchor, icon, color, view, close, change }: {anchor:PopoverAnchor;icon:string;color?:string;view:PluginSidebarViewProps;close():void;change(patch:FolderPatch):void}) {
  const {width,height}=useWindowDimensions();
  const [tab,setTab]=useState<'icons'|'emoji'>(icon.startsWith('emoji:')?'emoji':'icons');
  const [search,setSearch]=useState(''); const [custom,setCustom]=useState('');
  const c=view.theme.colors;
  const position=popoverPosition(anchor,{width,height},{width:360,height:view.layout.compact?460:340});
  const query=search.trim().toLocaleLowerCase();
  const matches=FOLDER_ICONS.filter(entry=>iconSearchText(entry,t(entry[1])).includes(query));
  const tileSize=view.layout.compact?44:36;
  const columns=Math.max(1,Math.floor((position.width-16+4)/(tileSize+4)));
  const choose=(value:string)=>{change({icon:value});close()};
  return <Modal transparent visible animationType="none" onRequestClose={close}>
    <View style={{flex:1}} {...{onKeyDown:(event:{key:string;stopPropagation():void})=>{if(event.key==='Escape'){event.stopPropagation();close()}}}}>
      <NativePressable accessibilityLabel={t('Close icon picker')} onPress={close} style={{position:'absolute',inset:0}} />
      <View role="dialog" accessibilityLabel={t('Folder icon')} accessibilityViewIsModal style={{...position,position:'absolute',backgroundColor:c.surface0,borderColor:c.border,borderWidth:1,borderRadius:12,padding:8,shadowColor:'#000',shadowRadius:12,shadowOpacity:.15,elevation:8,gap:8}}>
        <View style={{flexDirection:'row',gap:4}}>{(['emoji','icons'] as const).map(value=><Pressable key={value} theme={view.theme} accessibilityRole="tab" accessibilityLabel={t(value==='icons'?'Icons':'Emoji')} accessibilityState={{selected:tab===value}} onPress={()=>setTab(value)} style={{paddingHorizontal:12,minHeight:view.layout.compact?44:28,justifyContent:'center',borderRadius:16,backgroundColor:tab===value?c.surface2:'transparent'}}><Text style={{color:tab===value?c.foreground:c.foregroundMuted,fontSize:12}}>{t(value==='icons'?'Icons':'Emoji')}</Text></Pressable>)}</View>
        {tab==='icons'&&<TextInput accessibilityLabel={t('Search icons')} value={search} onChangeText={setSearch} placeholder={t('Search icons…')} placeholderTextColor={c.foregroundMuted} style={{minHeight:view.layout.compact?44:36,paddingHorizontal:10,borderWidth:1,borderColor:c.border,borderRadius:8,color:c.foreground,fontSize:12}}/>}
        <View style={{flexDirection:'row',justifyContent:'space-between',flexWrap:'wrap',gap:2}}>{COLORS.map(value=><Pressable key={value} theme={view.theme} accessibilityRole="button" accessibilityLabel={t('Icon color {0}',value)} accessibilityState={{selected:color===value}} onPress={()=>change({color:value})} style={{width:view.layout.compact?44:32,height:view.layout.compact?44:32,borderRadius:20,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:color===value?c.foregroundMuted:'transparent'}}><View style={{backgroundColor:value,width:24,height:24,borderRadius:12}}/></Pressable>)}</View>
        {tab==='icons'?<FlatList key={`icons:${columns}`} data={matches} numColumns={columns} keyExtractor={entry=>entry[0]} keyboardShouldPersistTaps="handled" initialNumToRender={columns*5} maxToRenderPerBatch={columns*4} windowSize={5} style={{maxHeight:view.layout.compact?240:180}} contentContainerStyle={{gap:4}} columnWrapperStyle={columns>1?{gap:4}:undefined} ListEmptyComponent={<Text style={{padding:12,color:c.foregroundMuted,fontSize:12}}>{t('No icons found')}</Text>} renderItem={({item:[name,label]})=><Pressable theme={view.theme} accessibilityRole="button" accessibilityLabel={t(label)} accessibilityState={{selected:icon===name}} onPress={()=>choose(name)} style={{width:tileSize,height:tileSize,borderRadius:8,alignItems:'center',justifyContent:'center',backgroundColor:icon===name?c.surface2:'transparent'}}><Glyph name={name} size={20} color={color||c.foreground}/></Pressable>}/>:<View style={{flexDirection:'row',flexWrap:'wrap',gap:4}}>{EMOJIS.map(value=><Pressable key={value} theme={view.theme} accessibilityRole="button" accessibilityLabel={value} onPress={()=>choose('emoji:'+value)} style={{width:tileSize,height:tileSize,alignItems:'center',justifyContent:'center',borderRadius:8,backgroundColor:icon==='emoji:'+value?c.surface2:'transparent'}}><Text style={{fontSize:23}}>{value}</Text></Pressable>)}</View>}
        {tab==='emoji'&&<View style={{flexDirection:'row',gap:8}}><TextInput accessibilityLabel={t('Custom emoji')} value={custom} onChangeText={setCustom} maxLength={32} placeholder="✨" style={{flex:1,minHeight:view.layout.compact?44:36,color:c.foreground,paddingHorizontal:8,borderWidth:1,borderColor:c.border,borderRadius:8}} onSubmitEditing={()=>{if(custom.trim())choose('emoji:'+custom.trim())}}/><Pressable theme={view.theme} accessibilityLabel={t('Use emoji')} disabled={!custom.trim()} onPress={()=>choose('emoji:'+custom.trim())} style={{justifyContent:'center',padding:8}}><Text style={{color:c.foreground}}>{t('Use emoji')}</Text></Pressable></View>}
        <Pressable theme={view.theme} accessibilityRole="button" accessibilityLabel={t('Restore default icon')} onPress={()=>{change({icon:undefined,color:undefined});close()}} style={{minHeight:28,justifyContent:'center',paddingHorizontal:6}}><Text style={{color:c.foregroundMuted,fontSize:12}}>{t('Restore default icon')}</Text></Pressable>
      </View>
    </View>
  </Modal>;
}

export function FolderEditor({ group, view, close, save, remove, creating = false }: {group:Group;view:PluginSidebarViewProps;close():void;save(patch:FolderPatch):Promise<boolean>;remove?():Promise<boolean>;creating?:boolean}) {
  const title=creating ? (group.parentId?'New subfolder':'New folder') : 'Edit folder';
  const [name,setName]=useState(group.name); const [icon,setIcon]=useState(group.icon||'folder');const [color,setColor]=useState(group.color);const [pinned,setPinned]=useState(!!group.pinned);
  const [paths,setPaths]=useState<string[]>(group.workspacePaths??[]);
  const [busy,setBusy]=useState(false);const pending=useRef(false);const [error,setError]=useState<string|null>(null);const [anchor,setAnchor]=useState<PopoverAnchor|null>(null);const iconButton=useRef<View>(null);
  const c=view.theme.colors;
  const commit=async(deleting=false)=>{if(pending.current||(!deleting&&!name.trim()))return;pending.current=true;setBusy(true);setError(null);try{const normalized=deleting?[]:normalizeWorkspacePaths(paths);const ok=deleting?await remove?.():await save({name:name.trim(),icon:icon==='folder'?undefined:icon,color,pinned,...(normalized.length||group.workspacePaths?{workspacePaths:normalized}:{})});if(ok)close();else setError(t(creating?'Could not create folder. Please try again.':'Folder changed elsewhere. Close the editor and try again.'));}catch(error){setError(error instanceof Error?t(error.message):t('Could not save settings. Check the connection and try again.'))}finally{pending.current=false;setBusy(false)}};
  return <Modal transparent visible animationType="fade" onRequestClose={()=>{if(!busy)close()}}>
    <View style={{flex:1,justifyContent:'center',alignItems:'center',padding:16,backgroundColor:'rgba(0,0,0,0.25)'}} {...{onKeyDown:(event:{key:string;stopPropagation():void})=>{if(event.key==='Escape'&&!busy&&!anchor){event.stopPropagation();close()}}}}>
      <NativePressable accessibilityLabel={t('Close folder editor')} disabled={busy} onPress={close} style={{position:'absolute',inset:0}} />
      <View role="dialog" accessibilityLabel={t(title)} accessibilityViewIsModal style={{width:'100%',maxWidth:500,maxHeight:'90%',padding:20,borderRadius:18,backgroundColor:c.surface0,borderWidth:1,borderColor:c.border,gap:16}}>
        <View style={{flexDirection:'row',alignItems:'center'}}><Text style={{flex:1,color:c.foreground,fontSize:20,fontWeight:'600'}}>{t(title)}</Text><Pressable theme={view.theme} accessibilityLabel={t('Close folder editor')} disabled={busy} onPress={close} style={{width:28,height:28,alignItems:'center',justifyContent:'center'}}><Glyph name="close" color={c.foregroundMuted}/></Pressable></View>
        <ScrollView keyboardShouldPersistTaps="handled" style={{flexShrink:1}} contentContainerStyle={{gap:14}}>
        <View style={{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:c.border,borderRadius:10,paddingHorizontal:4}}>
          <Pressable theme={view.theme} focusRef={iconButton} accessibilityRole="button" accessibilityLabel={t('Change folder icon')} disabled={busy} onPress={()=>iconButton.current?.measureInWindow((x,y,w,h)=>setAnchor({x,y:y+h+6}))} style={{width:40,height:40,alignItems:'center',justifyContent:'center',borderRightWidth:1,borderRightColor:c.border}}><Glyph name={icon} color={color||c.foreground} size={18}/></Pressable>
          <TextInput accessibilityLabel={t('Folder name')} autoFocus value={name} onChangeText={value=>{setName(value);setError(null)}} maxLength={60} editable={!busy} onSubmitEditing={()=>{void commit()}} style={{flex:1,minWidth:0,minHeight:40,paddingHorizontal:12,color:c.foreground,fontSize:14}}/>
        </View>
        <Pressable theme={view.theme} accessibilityRole="checkbox" accessibilityLabel={t('Pin folder')} accessibilityState={{checked:pinned,disabled:busy}} disabled={busy} onPress={()=>setPinned(!pinned)} style={{flexDirection:'row',alignItems:'center',gap:10,minHeight:36}}><Glyph name={'Star'} color={pinned?c.accent:c.foregroundMuted} size={16}/><Text style={{color:c.foreground,fontSize:13,flex:1}}>{t('Pin folder')}</Text>{pinned&&<Glyph name="check" color={c.accent}/>}</Pressable>
        <View style={{gap:8}}><Text style={{color:c.foreground,fontSize:13}}>{t('Linked workspace directories')}</Text><Text style={{color:c.foregroundMuted,fontSize:12}}>{t('New chats are added here when their workspace path matches a directory or pattern.')}</Text><Text style={{color:c.foregroundMuted,fontSize:12}}>{t('* matches within one directory name; ** matches across directories. Examples: **recmeet** or /projects/*')}</Text>
          {paths.map((value,index)=><View key={index} style={{flexDirection:'row',alignItems:'center',gap:6,borderWidth:1,borderColor:c.border,borderRadius:8,paddingHorizontal:8}}><Glyph name="folder" color={c.foregroundMuted}/><TextInput accessibilityLabel={t('Workspace directory {0}',index+1)} value={value} editable={!busy} onChangeText={text=>setPaths(current=>current.map((path,i)=>i===index?text:path))} placeholder={t('Absolute path or pattern with * or **')} placeholderTextColor={c.foregroundMuted} style={{flex:1,minWidth:0,minHeight:40,color:c.foreground,fontSize:12}}/><Pressable theme={view.theme} accessibilityLabel={t('Remove directory {0}',index+1)} disabled={busy} onPress={()=>setPaths(current=>current.filter((_,i)=>i!==index))} style={{minWidth:view.layout.compact?44:28,minHeight:40,alignItems:'center',justifyContent:'center'}}><Glyph name="close" color={c.foregroundMuted}/></Pressable></View>)}
          <Pressable theme={view.theme} accessibilityRole="button" accessibilityLabel={t('Add directory')} disabled={busy||paths.length>=64} onPress={()=>setPaths(current=>[...current,''])} style={{flexDirection:'row',alignItems:'center',gap:8,minHeight:view.layout.compact?44:36,paddingHorizontal:8,borderWidth:1,borderColor:c.border,borderRadius:8}}><Glyph name="plus" color={c.foregroundMuted}/><Text style={{color:c.foreground,fontSize:12}}>{t('Add directory')}</Text></Pressable>
        </View>
        {error&&<Text accessibilityRole="alert" style={{color:c.statusDanger,fontSize:12}}>{error}</Text>}
        </ScrollView>
        <View style={{flexDirection:'row',alignItems:'center',gap:8,flexWrap:'wrap',marginTop:4}}>
          {!creating&&remove&&<Pressable theme={view.theme} accessibilityRole="button" accessibilityLabel={t('Delete folder')} disabled={busy} onPress={()=>{void commit(true)}} style={{minHeight:view.layout.compact?44:36,borderRadius:10,paddingHorizontal:12,justifyContent:'center',backgroundColor:c.surface1}}><Text style={{color:c.statusDanger,fontSize:13}}>{t('Delete folder')}</Text></Pressable>}<View style={{flex:1}}/>
          <Pressable theme={view.theme} accessibilityRole="button" accessibilityLabel={t('Cancel')} disabled={busy} onPress={close} style={{minHeight:view.layout.compact?44:36,paddingHorizontal:10,justifyContent:'center'}}><Text style={{color:c.foregroundMuted,fontSize:13}}>{t('Cancel')}</Text></Pressable>
          <Pressable theme={view.theme} accessibilityRole="button" accessibilityLabel={t(creating?'Create folder':'Save folder')} hoverBackground={c.foreground} pressedBackground={c.foreground} disabled={busy||!name.trim()} onPress={()=>{void commit()}} style={({pressed})=>({minHeight:view.layout.compact?44:36,borderRadius:10,paddingHorizontal:16,justifyContent:'center',backgroundColor:c.foreground,opacity:(busy||!name.trim()) ? .7 : pressed ? .9 : 1})}><Text style={{color:c.surface0,fontSize:13}}>{busy?t('Saving…'):t(creating?'Create':'Save')}</Text></Pressable>
        </View>
        {!creating&&<Text style={{fontSize:11,color:c.foregroundMuted}}>{t('Deleting a folder keeps its conversations.')}</Text>}
      </View>
    </View>
    {anchor&&<FolderIconPicker anchor={anchor} icon={icon} color={color} view={view} close={()=>setAnchor(null)} change={patch=>{if('icon'in patch)setIcon(patch.icon||'folder');if('color'in patch)setColor(patch.color)}}/>}
  </Modal>;
}
