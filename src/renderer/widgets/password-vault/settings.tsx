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
        title='About'
        moreInfo='Passwords are encrypted using your OS keychain (safeStorage) and stored securely.'
      >
        <div style={{fontSize: '12px', color: 'var(--freeter-mutedText)'}}>
          <p>Add credential entries with site name, username, password, URL, and notes.</p>
          <p>Passwords are encrypted at rest via the OS keychain and decrypted on demand.</p>
          <p>Copied passwords are cleared from clipboard automatically.</p>
        </div>
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
