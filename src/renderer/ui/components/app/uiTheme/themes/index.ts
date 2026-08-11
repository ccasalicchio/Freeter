import { UiThemeId } from '@/base/uiTheme';
import { darkTheme } from '@/ui/components/app/uiTheme/themes/dark';
import { lightTheme } from '@/ui/components/app/uiTheme/themes/light';
import { nordTheme } from '@/ui/components/app/uiTheme/themes/nord';
import { catppuccinTheme } from '@/ui/components/app/uiTheme/themes/catppuccin';
import { solarizedDarkTheme } from '@/ui/components/app/uiTheme/themes/solarized-dark';
import { gruvboxDarkTheme } from '@/ui/components/app/uiTheme/themes/gruvbox-dark';
import { draculaTheme } from '@/ui/components/app/uiTheme/themes/dracula';
import { highContrastTheme } from '@/ui/components/app/uiTheme/themes/high-contrast';

type UiTheme = typeof darkTheme;

export const uiThemes: Record<UiThemeId, UiTheme> = {
  'dark': darkTheme,
  'light': lightTheme,
  'nord': nordTheme,
  'catppuccin': catppuccinTheme,
  'solarized-dark': solarizedDarkTheme,
  'gruvbox-dark': gruvboxDarkTheme,
  'dracula': draculaTheme,
  'high-contrast': highContrastTheme,
}
