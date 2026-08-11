import { CreateSettingsState, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export interface Settings {
  updateIntervalSec: number;
  showCpu: boolean;
  showMem: boolean;
  maxDataPoints: number;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  updateIntervalSec: typeof settings.updateIntervalSec === 'number' ? settings.updateIntervalSec : 2,
  showCpu: typeof settings.showCpu === 'boolean' ? settings.showCpu : true,
  showMem: typeof settings.showMem === 'boolean' ? settings.showMem : true,
  maxDataPoints: typeof settings.maxDataPoints === 'number' ? settings.maxDataPoints : 60,
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;
  return (
    <>
      <SettingBlock
        titleForId='sysmon-interval'
        title='Update Interval'
        moreInfo='How often to refresh system metrics.'
      >
        <select id="sysmon-interval" value={settings.updateIntervalSec} onChange={e => {
          updateSettings({...settings, updateIntervalSec: Number(e.target.value) || 2})
        }}>
          <option value={1}>1 second</option>
          <option value={2}>2 seconds</option>
          <option value={5}>5 seconds</option>
        </select>
      </SettingBlock>

      <SettingBlock
        title='Metrics to Display'
      >
        <div>
          <label>
            <input type="checkbox" checked={settings.showCpu} onChange={_=>updateSettings({...settings, showCpu: !settings.showCpu})}/>
            {' '}CPU Usage
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" checked={settings.showMem} onChange={_=>updateSettings({...settings, showMem: !settings.showMem})}/>
            {' '}Memory Usage
          </label>
        </div>
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
