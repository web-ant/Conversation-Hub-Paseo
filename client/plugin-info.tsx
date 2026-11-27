import { useState, type ReactNode } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useTranslation, type PluginIconProps, type PluginSurfaceProps } from '@getpaseo/plugin/client';
import { SettingsCard, SettingsSection } from '@getpaseo/plugin/client/ui';
import type { Appearance } from '../shared/appearance';
import { pluginInfo } from './plugin-info-content';
import { pluginIconUri } from './plugin-icon-data';
import { messages, t } from './i18n';

// Embed the PNG so native and remote clients need neither a local filesystem URL nor a registry listing.
export function ConversationHubIcon({ size }: PluginIconProps) {
  return <Image accessibilityLabel={t('Conversation Hub icon')} source={{ uri: pluginIconUri }} style={{ width: size, height: size, borderRadius: Math.round(size * .2) }} />;
}

/** Render inline formatting without stripping stars from directory patterns inside code spans. */
function InlineText({ text }: { text: string }) {
  const tokens = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: Array<string | ReactNode> = [];
  let start = 0;
  for (const match of text.matchAll(tokens)) {
    parts.push(text.slice(start, match.index));
    parts.push(<Text key={match.index} style={match[2] ? { fontWeight: '600' } : undefined}>{match[1] ?? match[2] ?? match[3]}</Text>);
    start = match.index! + match[0].length;
  }
  parts.push(text.slice(start));
  return <>{parts}</>;
}

export function PluginInformation({ theme, compact, language }: { theme: PluginSurfaceProps['theme']; compact: boolean; language: Appearance['language'] }) {
  const appLocale = useTranslation(messages).locale;
  const [selected, setSelected] = useState<'ru' | 'en' | null>(null);
  const [expanded, setExpanded] = useState(false);
  const locale = selected ?? ((language === 'auto' ? appLocale : language).toLowerCase().startsWith('ru') ? 'ru' : 'en');
  const blocks = pluginInfo[locale], c = theme.colors;
  const body = { color: c.foreground, fontSize: 13, lineHeight: 20 };
  return <SettingsSection title={t('About the plugin')}>
    <SettingsCard><View style={{ padding: compact ? 12 : 16, gap: 16 }}>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <ConversationHubIcon size={compact ? 56 : 72} color={c.foreground} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text accessibilityRole="header" style={{ color: c.foreground, fontSize: compact ? 19 : 22, fontWeight: '600' }}>{pluginInfo.name}</Text>
          <Text style={{ color: c.foregroundMuted, fontSize: 12 }}>{locale === 'ru' ? 'Папки, вкладки и задачи в одном месте' : 'Folders, tabs, and tasks in one place'}</Text>
        </View>
      </View>
      <View accessibilityRole="tablist" accessibilityLabel={t('Description language')} style={{ flexDirection: 'row', gap: 8 }}>
        {(['ru', 'en'] as const).map(value => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: locale === value }} accessibilityLabel={value === 'ru' ? 'Русский' : 'English'} onPress={() => setSelected(value)} style={{ minHeight: compact ? 44 : 32, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1, borderColor: locale === value ? c.accent : c.border, borderRadius: 6, backgroundColor: locale === value ? c.surface2 : undefined }}><Text style={{ color: c.foreground, fontSize: 12 }}>{value === 'ru' ? 'Русский' : 'English'}</Text></Pressable>)}
      </View>
      <Text style={body}><InlineText text={blocks[0].text} /></Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {blocks.filter(block => block.kind === 'heading').slice(0, 6).map(block => <View key={block.text} style={{ borderRadius: 5, backgroundColor: c.surface1, paddingVertical: 5, paddingHorizontal: 8 }}><Text style={{ color: c.foregroundMuted, fontSize: 11 }}>{block.text}</Text></View>)}
      </View>
      <Pressable accessibilityRole="button" aria-expanded={expanded} accessibilityLabel={t(expanded ? 'Hide full description' : 'Read full description')} onPress={() => setExpanded(!expanded)} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: c.border }}><Text style={{ color: c.accent, fontSize: 13 }}>{t(expanded ? 'Hide full description' : 'Read full description')}</Text></Pressable>
      {expanded && <View style={{ gap: 12 }}>
        {blocks.slice(1).map((block, index) => block.kind === 'heading'
          ? <Text key={index} accessibilityRole="header" style={{ ...body, fontWeight: '600', fontSize: 15, marginTop: 8 }}>{block.text}</Text>
          : <Text key={index} style={body}><InlineText text={block.text} /></Text>)}
      </View>}
    </View></SettingsCard>
  </SettingsSection>;
}
