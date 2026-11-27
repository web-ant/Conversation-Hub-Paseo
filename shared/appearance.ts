import { defineSettings } from '@getpaseo/plugin';
import { z } from 'zod';

/** Appearance is per device; the daemon's folders and memberships remain shared. */
export const appearance = defineSettings({
  id: 'appearance', scope: 'device', version: 1,
  schema: z.object({
    textSize: z.number().int().min(10).max(18).default(12),
    rowSpacing: z.enum(['compact', 'normal', 'relaxed']).default('normal'),
    groupSpacing: z.enum(['none', 'small', 'medium', 'large']).default('small'),
    indent: z.enum(['narrow', 'normal', 'wide']).default('normal'),
    boldGroupNames: z.boolean().default(true),
    showFolderIcons: z.boolean().default(true),
    showStatusDots: z.boolean().default(true),
    showFoldedStatus: z.boolean().default(true),
    showPinned: z.boolean().default(true),
    followActiveChat: z.boolean().default(true),
    showActivity: z.boolean().default(true),
    titleLines: z.number().int().min(1).max(2).default(1),
    language: z.enum(['auto', 'en', 'ru']).default('auto'),
  }),
});
export type Appearance = z.infer<typeof appearance.schema>;
export const DEFAULT_APPEARANCE = appearance.schema.parse({});
