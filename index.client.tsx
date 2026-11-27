import type { PluginClientContext, PluginSidebarViewProps } from '@getpaseo/plugin/client';
import { SidebarWithTabs } from './client/sidebar';
import { messages } from './client/i18n';
import { AppearanceSettings, ConversationHubIcon } from './client/settings-screen';
import { ViewActionsContext } from './client/density';
export default function contribute(client: PluginClientContext) {
  const actions = { openAppearanceSettings: () => client.openSettings('appearance') };
  function SidebarView(props: PluginSidebarViewProps) {
    return <ViewActionsContext.Provider value={actions}><SidebarWithTabs {...props} /></ViewActionsContext.Provider>;
  }
  const cleanup = [
    client.addSettingsScreen({ id: 'appearance', title: messages.message('settingsTitle'), icon: ConversationHubIcon, Component: AppearanceSettings }),
    client.addSidebarView({ id: 'folders', title: messages.message('viewTitle'), description: messages.message('viewDescription'), Component: SidebarView }),
  ];
  return async () => { for (const dispose of cleanup) await dispose(); };
}
