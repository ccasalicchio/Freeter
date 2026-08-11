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
        moreInfo='Build and send HTTP requests directly from this widget. Supports GET, POST, PUT, PATCH, and DELETE methods.'
      >
        <div style={{fontSize: '12px', color: 'var(--freeter-mutedText)'}}>
          <p>Type a URL, select a method, add optional headers and body, then click Send.</p>
          <p>Saved requests appear in the dropdown.</p>
        </div>
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
