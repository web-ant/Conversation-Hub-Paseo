import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useSettings, type PluginSurfaceProps } from '@getpaseo/plugin/client';
import { SettingsAction, SettingsCard, SettingsSection, SettingsSelect, SettingsSwitch } from '@getpaseo/plugin/client/ui';
import { appearance, type Appearance } from '../shared/appearance';
import { displayPreferences,workspaceRouting } from '../shared/settings';
import { AppearancePreview } from './appearance-preview';
export { AppearancePreview } from './appearance-preview';
import { t, useAppLanguage } from './i18n';
import { PluginInformation } from './plugin-info';
export { ConversationHubIcon } from './plugin-info';

export function AppearanceSettings({ theme, layout }: PluginSurfaceProps) {
  useAppLanguage();
  const settings = useSettings(appearance);
  const display = useSettings(displayPreferences);
  const routing=useSettings(workspaceRouting);
  const [draft, setDraft] = useState<Appearance | null>(null);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState<string | null>(null);
  if (settings.status !== 'ready') return <Text style={{ color: theme.colors.foregroundMuted }}>{settings.status === 'loading' ? t('Loading…') : t(settings.error)}</Text>;
  const values = draft ?? settings.values;
  async function update(patch: Partial<Appearance>) {
    if (pending.current || settings.status !== 'ready') return;
    const next = { ...settings.values, ...patch };
    pending.current = true; setSaving(true); setDraft(next); setError(null);
    try { if (!await settings.save(next, settings.revision)) setError(t('Settings changed elsewhere. Please try again.')); }
    catch { setError(t('Could not save settings. Check the connection and try again.')); }
    finally { pending.current = false; setSaving(false); setDraft(null); }
  }
  async function updateDisplay(patch: Partial<Extract<typeof display, {status:'ready'}>['values']>) {
    if (pending.current || display.status !== 'ready') return;
    pending.current = true; setSaving(true); setError(null);
    try { if (!await display.save({ ...display.values, ...patch }, display.revision)) setError(t('Settings changed elsewhere. Please try again.')); }
    catch { setError(t('Could not save settings. Check the connection and try again.')); }
    finally { pending.current = false; setSaving(false); }
  }
  async function updateRouting(patch:Partial<Extract<typeof routing,{status:'ready'}>['values']>){if(pending.current||routing.status!=='ready')return;pending.current=true;setSaving(true);setError(null);try{if(!await routing.save({...routing.values,...patch},routing.revision))setError(t('Settings changed elsewhere. Please try again.'))}catch{setError(t('Could not save settings. Check the connection and try again.'))}finally{pending.current=false;setSaving(false);}}
  return <View style={{ gap: 24, paddingBottom: 24 }}>
    <PluginInformation theme={theme} compact={layout.compact} language={values.language} />
    <SettingsSection title={t('Language')}><SettingsCard><SettingsSelect label={t('Interface language')} hint={t('Automatic follows the language selected in Paseo.')} value={values.language} options={[{value:'auto',label:t('Same as Paseo')},{value:'en',label:'English'},{value:'ru',label:'Русский'}]} disabled={saving} onValueChange={language => { void update({ language }); }} /></SettingsCard></SettingsSection>
    <SettingsSection title={t('Preview')}><AppearancePreview values={values} theme={theme} compact={layout.compact} display={display.status === 'ready' ? display.values : undefined} routing={routing.status === 'ready' ? routing.values : undefined} /></SettingsSection>
    <SettingsSection title={t('Text and spacing')}><SettingsCard>
      <SettingsSelect label={t('Text size')} hint={t('Applies to sidebar text. Secondary text is one point smaller.')} value={String(values.textSize)} options={[10,11,12,13,14,15,16,17,18].map(value => ({value:String(value),label:t(value === 12 ? '{0} pt (default)' : '{0} pt',value)}))} disabled={saving} onValueChange={value => { void update({textSize:Number(value)}); }} />
      <SettingsSelect label={t('Row spacing')} hint={t('Changes the height of each row.')} value={values.rowSpacing} options={(['compact','normal','relaxed'] as const).map(value => ({value,label:t(({compact:'Compact',normal:'Normal',relaxed:'Spacious'})[value])}))} disabled={saving} onValueChange={rowSpacing => { void update({rowSpacing}); }} />
      <SettingsSelect label={t('Space between groups')} hint={t('Adds space above each folder.')} value={values.groupSpacing} options={(['none','small','medium','large'] as const).map(value => ({value,label:t(({none:'None',small:'Small',medium:'Medium',large:'Large'})[value])}))} disabled={saving} onValueChange={groupSpacing => { void update({groupSpacing}); }} />
      <SettingsSelect label={t('Indentation')} hint={t('Controls the indentation of folders and conversations.')} value={values.indent} options={(['narrow','normal','wide'] as const).map(value => ({value,label:t(({narrow:'Narrow indentation',normal:'Normal indentation',wide:'Wide indentation'})[value])}))} disabled={saving} onValueChange={indent => { void update({indent}); }} />
      <SettingsSelect label={t('Titles')} value={String(values.titleLines)} options={[{value:'1',label:t('Single line')},{value:'2',label:t('Two lines')}]} disabled={saving} onValueChange={value => { void update({titleLines:Number(value) as 1|2}); }} />
    </SettingsCard></SettingsSection>
    <SettingsSection title={t('Navigation')}><SettingsCard><SettingsSwitch label={t('Reveal the open conversation')} hint={t('Expand its folder and scroll to the conversation without moving keyboard focus.')} value={values.followActiveChat} disabled={saving} onValueChange={followActiveChat=>{void update({followActiveChat})}}/></SettingsCard></SettingsSection>
    {routing.status==='ready'&&<SettingsSection title={t('Workspace folder assignment')}><SettingsCard>
      {([
       ['enabled','Automatically assign new workspaces','Set linked directories or patterns when creating or editing a folder.'],
       ['includeSubdirectories','Include nested directories','Applies to plain paths. Patterns use their own * and ** depth.'],
       ['includeWorktrees','Include git worktrees','Match worktrees using their original repository directory.'],
       ['includeSubagents','Assign subprocesses too','Manual folder placement always takes priority.'],
      ]as const).map(([key,label,hint])=><SettingsSwitch key={key} label={t(label)} hint={t(hint)} value={routing.values[key]} disabled={saving} onValueChange={value=>{void updateRouting({[key]:value})}}/>)}
    </SettingsCard></SettingsSection>}
    <SettingsSection title={t('Visible elements')}><SettingsCard>
      {([
        ['boldGroupNames','Bold group names'],['showFolderIcons','Folder and project icons'],['showStatusDots','Conversation status dots'],
        ['showFoldedStatus','Status on folded rows'],['showPinned','Pinned section'],['showActivity','Last activity next to the title'],
      ] as const).map(([key,label]) => <SettingsSwitch key={key} label={t(label)} value={values[key]} disabled={saving} onValueChange={value => { void update({[key]:value}); }} />)}
    </SettingsCard></SettingsSection>
    {display.status === 'ready' && <SettingsSection title={t('Conversations')}><SettingsCard>
      <SettingsSwitch label={t('Show recent conversations')} hint={t('Shown below pinned conversations, newest activity first. Pinned conversations are excluded.')} value={display.values.showRecent} disabled={saving} onValueChange={showRecent => { void updateDisplay({showRecent}); }} />
      <SettingsSelect label={t('Recent conversation limit')} value={String(display.values.recentLimit)} options={[5,10,15,20,30].map(value => ({value:String(value),label:t('{0} conversations',value)}))} disabled={saving || !display.values.showRecent} onValueChange={value => { void updateDisplay({recentLimit:Number(value)}); }} />
      <SettingsSelect label={t('Group by')} value={display.values.grouping} options={(['manual','project','server','server-project'] as const).map(value => ({value,label:t(({manual:'Custom folders',project:'Project',server:'Server','server-project':'Server / Project'})[value])}))} disabled={saving} onValueChange={grouping => { void updateDisplay({grouping}); }} />
      <SettingsSelect label={t('Sort by')} value={display.values.sortBy} options={(['activity','created','title','manual'] as const).map(value => ({value,label:t(({activity:'Last activity',created:'Creation time',title:'Title',manual:'Custom order'})[value])}))} disabled={saving} onValueChange={sortBy => { void updateDisplay({sortBy}); }} />
      <SettingsSwitch label={t('Conversation counts')} value={display.values.showCounts} disabled={saving} onValueChange={showCounts => { void updateDisplay({showCounts}); }} />
      <SettingsSwitch label={t('Server labels')} value={display.values.showServer} disabled={saving} onValueChange={showServer => { void updateDisplay({showServer}); }} />
      <SettingsSwitch label={t('Show background workspaces')} value={display.values.showBackground} disabled={saving} onValueChange={showBackground => { void updateDisplay({showBackground}); }} />
    </SettingsCard></SettingsSection>}
    {display.status === 'ready' && <SettingsSection title={t('Folders')}><SettingsCard>
      <SettingsSelect label={t('Sort folders by')} hint={t('Last activity includes conversations in subfolders. Custom order preserves your drag order.')} value={display.values.folderSortBy} options={(['manual','title','activity'] as const).map(value => ({value,label:t(({manual:'Custom order',title:'Name',activity:'Last activity'})[value])}))} disabled={saving} onValueChange={folderSortBy => { void updateDisplay({folderSortBy,...(folderSortBy === 'activity' ? {folderSortDirection:'desc' as const} : folderSortBy === 'title' ? {folderSortDirection:'asc' as const} : {})}); }} />
      <SettingsSelect label={t('Folder sort direction')} value={display.values.folderSortDirection} options={[{value:'asc' as const,label:t('Ascending')},{value:'desc' as const,label:t('Descending')}]} disabled={saving || display.values.folderSortBy === 'manual'} onValueChange={folderSortDirection => { void updateDisplay({folderSortDirection}); }} />
    </SettingsCard></SettingsSection>}
    <SettingsSection title={t('Restore defaults')}><SettingsCard><SettingsAction label={t('Reset appearance')} hint={t('Folders, conversations and their order are preserved.')} actionLabel={t('Reset')} disabled={saving} onPress={() => { if (!pending.current && settings.status === 'ready') { pending.current=true;setSaving(true);setError(null);void settings.reset().catch(() => setError(t('Could not save settings. Check the connection and try again.'))).finally(()=>{pending.current=false;setSaving(false);}); } }} /></SettingsCard></SettingsSection>
    {error && <Text accessibilityRole="alert" style={{ color: theme.colors.statusDanger }}>{error ? t(error) : null}</Text>}
  </View>;
}
