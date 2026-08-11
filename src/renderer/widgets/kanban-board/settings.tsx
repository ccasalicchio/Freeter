import { CreateSettingsState, List, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export interface Settings {
  columns: List<string>;
}

const defaultColumns = ['To Do', 'In Progress', 'Done'];

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  columns: Array.isArray(settings.columns) ? settings.columns.filter(c => typeof c === 'string') : defaultColumns,
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;
  return (
    <>
      <SettingBlock
        title='Column Names'
        moreInfo='One column name per line. Changes apply to new boards.'
      >
        <div>
          <textarea
            id='kanban-columns'
            rows={4}
            value={settings.columns.join('\n')}
            onChange={e => updateSettings({...settings, columns: e.target.value.split('\n').filter(c => c.trim())})}
            placeholder={'To Do\nIn Progress\nDone'}
          />
        </div>
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
