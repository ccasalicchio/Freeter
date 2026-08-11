import { CreateSettingsState, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export interface Settings {
  maxItems: number;
  pollIntervalMs: number;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  maxItems: typeof settings.maxItems === 'number' ? settings.maxItems : 50,
  pollIntervalMs: typeof settings.pollIntervalMs === 'number' ? settings.pollIntervalMs : 1000,
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;
  return (
    <>
      <SettingBlock
        titleForId='clipboard-history-max-items'
        title='Max Items'
        moreInfo='Maximum number of clipboard entries to store. Oldest entries are removed when the limit is reached.'
      >
        <select id="clipboard-history-max-items" value={settings.maxItems} onChange={e => {
          updateSettings({
            ...settings,
            maxItems: Number(e.target.value) || 50
          })
        }}>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
      </SettingBlock>

      <SettingBlock
        titleForId='clipboard-history-poll-interval'
        title='Check Interval'
        moreInfo='How often to check the clipboard for changes (in milliseconds).'
      >
        <select id="clipboard-history-poll-interval" value={settings.pollIntervalMs} onChange={e => {
          updateSettings({
            ...settings,
            pollIntervalMs: Number(e.target.value) || 1000
          })
        }}>
          <option value={500}>500 ms</option>
          <option value={1000}>1 second</option>
          <option value={2000}>2 seconds</option>
          <option value={5000}>5 seconds</option>
        </select>
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
