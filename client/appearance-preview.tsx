import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { PluginSurfaceProps } from '@getpaseo/plugin/client';
import type { z } from 'zod';
import type { Appearance } from '../shared/appearance';
import { displayPreferences, workspaceRouting } from '../shared/settings';
import { conversationOrder, matchesConversation, type ConversationSnapshot } from '../shared/conversations';
import { orderFolders } from '../shared/folder-order';
import type { Group } from '../shared/model';
import { sidebarMetrics } from './density';
import { BranchIcon, Glyph, StatusMark } from './visuals';
import { t, timeLabel } from './i18n';

type Display = z.infer<typeof displayPreferences.schema>;
type Routing = z.infer<typeof workspaceRouting.schema>;
type DemoChat = ConversationSnapshot & { folder: string; project: string; backgroundWorkspace: boolean; minutes: number };

/** Isolated sample data: preview interactions never call the host or edit real chats. */
export function AppearancePreview({ values, theme, compact = false, display = displayPreferences.schema.parse({}), routing = workspaceRouting.schema.parse({}) }: {
  values: Appearance; theme: PluginSurfaceProps['theme']; compact?: boolean; display?: Display; routing?: Routing;
}) {
  const look = sidebarMetrics(compact, values), c = theme.colors;
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [folded, setFolded] = useState<Record<string, boolean>>({ personal: true, 'pinned-work': true });
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});
  const [subtasks, setSubtasks] = useState(false);
  const templates = ['Fix notifications', 'Plan the next release', 'Review the design and accessibility of the conversation sidebar', 'Write documentation'];
  const chats: DemoChat[] = Array.from({ length: 34 }, (_, index) => ({
    id: `preview-${index}`, hostId: index % 3 === 2 ? 'remote' : 'local',
    title: t(templates[index % templates.length]) + (index > 3 ? ` · ${index + 1}` : ''),
    status: index === 0 ? 'running' : index === 1 ? 'permission' : index === 2 ? 'error' : 'idle',
    requiresAttention: index === 1 || index === 2 || index === 3,
    attentionReason: index === 2 ? 'error' : null,
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
    lastActivityAt: new Date(Date.UTC(2026, 0, 2, 0, 34 - index)).toISOString(),
    folder: index % 3 === 0 ? 'work' : index % 3 === 1 ? 'design' : 'personal',
    project: index % 2 === 0 ? 'Paseo' : 'Website', backgroundWorkspace: index === 4, minutes: index * 5,
  }));
  const options = { sortBy: display.sortBy, sortDirection: display.sortDirection, filter: display.filter, search: query };
  const visible = chats.filter(chat => matchesConversation(chat, options) && (display.showBackground || !chat.backgroundWorkspace) && (tab === 'all' || chat.folder !== 'personal'));
  const sorted = [...visible].sort(conversationOrder(options));
  const pins = values.showPinned ? visible.filter(chat => chat.id === 'preview-1') : [];
  const recent = [...visible].filter(chat => chat.id !== 'preview-1').sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt)).slice(0, display.recentLimit);
  const progress = visible.filter(chat => chat.status !== 'idle' || chat.requiresAttention);
  const groups: Group[] = [
    { id: 'work', name: t('Work'), icon: 'code', pinned: true, workspacePaths: ['/projects/**'], agentIds: chats.filter(chat => chat.folder === 'work').map(chat => chat.id) },
    { id: 'design', parentId: 'work', name: t('Design'), icon: 'emoji:🎨', agentIds: chats.filter(chat => chat.folder === 'design').map(chat => chat.id) },
    { id: 'personal', name: t('Personal'), icon: 'book', agentIds: chats.filter(chat => chat.folder === 'personal').map(chat => chat.id) },
  ];
  const ordered = orderFolders(groups, display.folderSortBy, display.folderSortDirection, new Map(chats.map(chat => [chat.id, Date.parse(chat.lastActivityAt)])));
  const text = { color: c.foreground, fontSize: look.text, lineHeight: look.line };
  const muted = { color: c.foregroundMuted, fontSize: look.nestedText, lineHeight: look.nestedLine };
  const toggle = (id: string) => setFolded(previous => ({ ...previous, [id]: !previous[id] }));

  function row(chat: DemoChat, key: string, depth = 1) {
    return <View key={key} style={{ minHeight: look.row, marginLeft: look.inset + depth * look.indentation + 18, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: look.gap, borderRadius: 5, backgroundColor: chat.id === 'preview-0' && values.followActiveChat ? c.surface2 : undefined }}>
      {look.showStatusDots && <StatusMark state={chat.id === 'preview-3' ? 'updated' : chat.status} theme={theme} loadingEffect={display.loadingEffect} loadingColor={display.loadingColor} />}
      <View style={{ flex: 1, minWidth: 0, paddingVertical: 4 }}>
        <Text numberOfLines={look.titleLines} style={text}>{chat.title}</Text>
        {display.showServer && <Text numberOfLines={1} style={muted}>{chat.hostId === 'local' ? 'Local' : 'Remote'}{chat.backgroundWorkspace ? ` · ${t('Background workspace')}` : ''}</Text>}
      </View>
      {look.showActivity && <Text style={muted}>{timeLabel(chat.minutes ? `${chat.minutes}m` : 'now')}</Text>}
      <Glyph name="menu" color={c.foregroundMuted} size={12} />
    </View>;
  }
  function heading(id: string, label: string, count: number, icon: string, depth = 0, pinned = false, state?: string) {
    return <Pressable accessibilityRole="button" accessibilityLabel={label} aria-expanded={!folded[id]} onPress={() => toggle(id)} style={{ minHeight: look.folder, marginTop: look.groupGap, paddingLeft: look.inset + 4 + depth * look.indentation, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: look.gap }}>
      <View style={{ transform: [{ rotate: folded[id] ? '0deg' : '90deg' }] }}><Glyph name="chevron" color={c.foregroundMuted} /></View>
      {look.showFolderIcons && <BranchIcon icon={icon} open={!folded[id]} state={!folded[id] || look.showFoldedStatus ? state : undefined} hasUpdates={id === 'personal' && look.showFoldedStatus} theme={theme} loadingEffect={display.loadingEffect} loadingColor={display.loadingColor} />}
      <Text numberOfLines={1} style={{ ...text, flex: 1, fontWeight: look.boldGroupNames ? '600' : '400' }}>{label}</Text>
      {pinned && <Glyph name="star" color={c.foregroundMuted} size={11} />}
      {display.showCounts && <Text style={muted}>{count}</Text>}
    </Pressable>;
  }
  function section(id: string, label: string, rows: DemoChat[], icon: string) {
    return <View key={id}>{heading(id, label, rows.length, icon)}{!folded[id] && rows.map(chat => row(chat, `${id}-${chat.id}`))}</View>;
  }
  function folder(group: Group, alias = false) {
    const id = alias ? `pinned-${group.id}` : group.id;
    const rows = sorted.filter(chat => chat.folder === group.id);
    return <View key={id}>
      {heading(id, group.name, rows.length, group.icon || 'folder', group.parentId && !alias ? 1 : 0, !!group.pinned, group.id === 'personal' ? 'permission' : undefined)}
      {!folded[id] && <>
        {group.workspacePaths && routing.enabled && <Text style={{ ...muted, paddingLeft: look.inset + look.indentation + 22 }}>/projects/**</Text>}
        {(showAll[id] ? rows : rows.slice(0, 3)).map(chat => row(chat, `${id}-${chat.id}`, group.parentId && !alias ? 2 : 1))}
        {group.id === 'work' && <>
          <Pressable accessibilityRole="button" accessibilityLabel={t('{0} subtasks', 2)} aria-expanded={subtasks} onPress={() => setSubtasks(!subtasks)} style={{ minHeight: look.row, paddingLeft: look.indentation * 2 + 24, flexDirection: 'row', alignItems: 'center', gap: look.gap }}><Glyph name="subtask" color={c.statusWarning} /><Text style={muted}>{t('{0} subtasks', 2)}</Text></Pressable>
          {subtasks && <>{row({ ...chats[1], title: t('Check accessibility') }, `${id}-subtask`, 2)}{row({ ...chats[2], title: t('Write documentation') }, `${id}-subtask-2`, 2)}</>}
        </>}
        {rows.length > 3 && <Pressable accessibilityRole="button" onPress={() => setShowAll(previous => ({ ...previous, [id]: !previous[id] }))} style={{ minHeight: look.row, justifyContent: 'center', paddingLeft: look.indentation + 24 }}><Text style={muted}>{showAll[id] ? t('Show less') : t('Show {0} more', rows.length - 3)}</Text></Pressable>}
        {!alias && ordered.filter(child => child.parentId === group.id).map(child => folder(child))}
      </>}
    </View>;
  }
  function automaticGroups() {
    const servers = display.grouping === 'server' || display.grouping === 'server-project';
    return (servers ? ['local', 'remote'] : ['all']).map(host => {
      const hostChats = sorted.filter(chat => host === 'all' || chat.hostId === host);
      const label = host === 'local' ? 'Local' : 'Remote';
      return <View key={host}>
        {servers && heading(host, label, hostChats.length, 'server')}
        {(!servers || !folded[host]) && (display.grouping === 'server' ? hostChats.slice(0, 4).map(chat => row(chat, `server-${chat.id}`)) : ['Paseo', 'Website'].map(project => {
          const rows = hostChats.filter(chat => chat.project === project), id = `${host}-${project}`;
          return <View key={id}>{heading(id, project, rows.length, 'project', servers ? 1 : 0)}{!folded[id] && rows.slice(0, 4).map(chat => row(chat, `project-${chat.id}`, servers ? 2 : 1))}</View>;
        }))}
      </View>;
    });
  }
  return <View style={{ gap: 8 }}>
    <Text style={muted}>{t('Sample conversations. Change settings to preview them; scroll to see every section.')}</Text>
    <View accessibilityLabel={t('Sidebar preview')} style={{ maxWidth: 420, width: '100%', borderWidth: 1, borderColor: c.border, backgroundColor: c.surface0, borderRadius: 8, overflow: 'hidden' }}>
      <View style={{ padding: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <View style={{ flexDirection: 'row', gap: 4 }}>{['all', 'work'].map(id => <Pressable key={id} accessibilityRole="tab" accessibilityLabel={t(id === 'all' ? 'All' : 'Work')} accessibilityState={{ selected: tab === id }} onPress={() => setTab(id)} style={{ minHeight: compact ? 44 : 28, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 5, backgroundColor: tab === id ? c.surface2 : undefined }}><Text style={text}>{t(id === 'all' ? 'All' : 'Work')}</Text></Pressable>)}</View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Glyph name="search" color={c.foregroundMuted} /><TextInput accessibilityLabel={t('Search sample conversations')} placeholder={t('Search conversations…')} placeholderTextColor={c.foregroundMuted} value={query} onChangeText={setQuery} style={{ ...text, flex: 1, minWidth: 0, minHeight: compact ? 44 : 30 }} /></View>
        <Text style={muted}>{t('Group by')}: {t(({ manual: 'Custom folders', project: 'Project', server: 'Server', 'server-project': 'Server / Project' })[display.grouping])} · {t(({ activity: 'Last activity', created: 'Creation time', title: 'Title', manual: 'Custom order' })[display.sortBy])}</Text>
      </View>
      <ScrollView nestedScrollEnabled style={{ maxHeight: compact ? 480 : 540 }} contentContainerStyle={{ paddingBottom: 8 }}>
        {!query.trim() && <>
          {values.showPinned && section('pins', t('Pinned'), pins, 'star')}
          {display.showRecent && section('recent', t('Recent'), recent, 'clock')}
          {section('progress', t('In progress'), progress, 'conversations')}
        </>}
        {display.grouping === 'manual' && <>{heading('pinned-folders', t('Pinned folders'), 1, 'star')}{!folded['pinned-folders'] && folder(groups[0], true)}</>}
        {display.grouping === 'manual' ? ordered.filter(group => !group.parentId).map(group => folder(group)) : automaticGroups()}
        {!visible.length && <Text style={{ ...muted, padding: 12 }}>{t('No matching conversations')}</Text>}
      </ScrollView>
    </View>
  </View>;
}
