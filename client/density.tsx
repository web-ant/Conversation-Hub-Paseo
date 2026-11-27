import { createContext, useContext, type ReactNode } from 'react';
import { useSettings, type PluginSidebarViewProps } from '@getpaseo/plugin/client';
import { appearance, DEFAULT_APPEARANCE, type Appearance } from '../shared/appearance';

/** Rows grow with the font and native touch targets never shrink below 44 px. */
export function sidebarMetrics(touch: boolean, values: Appearance = DEFAULT_APPEARANCE) {
  const text = values.textSize;
  const line = Math.round(text * 1.34);
  const row = Math.max(({ compact: 24, normal: 28, relaxed: 34 })[values.rowSpacing], line + 8, touch ? 44 : 0);
  return {
    ...values, dense: !touch,
    text, line, nestedText: Math.max(9, text - 1), nestedLine: Math.round(Math.max(9, text - 1) * 1.4),
    folderText: text, row, folder: row + (touch ? 0 : 2),
    section: Math.max(touch ? 36 : 24, line + 4), toolbar: Math.max(touch ? 40 : 28, line + 8),
    action: row, inset: touch ? 8 : 4, gap: touch ? 8 : 4,
    groupGap: ({ none: 0, small: 4, medium: 10, large: 20 })[values.groupSpacing],
    indentation: ({ narrow: 8, normal: 12, wide: 20 })[values.indent],
  };
}
const DensityContext = createContext(sidebarMetrics(false));
export const useSidebarMetrics = () => useContext(DensityContext);
export const ViewActionsContext = createContext({ openAppearanceSettings() {} });
export function SidebarDensityProvider({ view, children }: { view: PluginSidebarViewProps; children: ReactNode }) {
  const settings = useSettings(appearance);
  const values = settings.status === 'ready' ? settings.values : DEFAULT_APPEARANCE;
  return <DensityContext.Provider value={sidebarMetrics(view.layout.compact, values)}>{children}</DensityContext.Provider>;
}
