import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'password-vault',
  icon: widgetSvg,
  name: 'Password Vault',
  minSize: {
    w: 2,
    h: 2
  },
  description: 'The Password Vault widget securely stores your credentials using your OS keychain encryption. Add, view, copy, and manage passwords with ease.',
  maximizable: true,
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['dataStorage', 'clipboard', 'safeStorage']
}

export default widgetType;
