/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

const uiThemeIds = ['dark', 'light', 'nord', 'catppuccin', 'solarized-dark', 'gruvbox-dark', 'dracula', 'high-contrast'] as const;
export const autoThemeId = 'auto';

export type UiThemeId = typeof uiThemeIds[number];

export const defaultUiThemeId: UiThemeId = 'light';

export interface UiThemeData {
  name: string;
}

export const uiThemeDataById: Record<UiThemeId, UiThemeData> = {
  ['dark']: { name: 'Dark' },
  ['light']: { name: 'Light' },
  ['nord']: { name: 'Nord' },
  ['catppuccin']: { name: 'Catppuccin Mocha' },
  ['solarized-dark']: { name: 'Solarized Dark' },
  ['gruvbox-dark']: { name: 'Gruvbox Dark' },
  ['dracula']: { name: 'Dracula' },
  ['high-contrast']: { name: 'High Contrast' },
}

export const uiThemes = uiThemeIds.map(id => ({ id, ...uiThemeDataById[id] }));

function isUiThemeId(id: string): id is UiThemeId {
  return !!(uiThemeDataById[id as UiThemeId]);
}

export function sanitizeUiThemeId(id: string): UiThemeId {
  if (isUiThemeId(id)) {
    return id;
  }
  return defaultUiThemeId;
}

export function resolveUiThemeId(id: string): UiThemeId {
  if (id === autoThemeId) {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return sanitizeUiThemeId(id);
}
