import { CreateSettingsState, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Settings {
}

export const createSettingsState: CreateSettingsState<Settings> = () => ({
})

function SettingsEditorComp(_props: SettingsEditorReactComponentProps<Settings>) {
  return (
    <>
      <SettingBlock
        title='Usage'
        moreInfo='Manage events with a month calendar view. Click a day to add or view events.'
      >
        <div style={{fontSize: '12px', color: 'var(--freeter-mutedText)'}}>
          <p>Navigate months with the arrow buttons. Click a day to add an event, or click an existing event to edit/delete it.</p>
        </div>
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
