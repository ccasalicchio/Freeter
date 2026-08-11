import { CreateSettingsState, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export interface Settings {
  language: string;
  showLineNumbers: boolean;
  wrapLines: boolean;
}

const languages = [
  'typescript', 'javascript', 'python', 'rust', 'go', 'sql', 'bash',
  'json', 'yaml', 'html', 'css', 'csharp', 'java',
];

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  language: typeof settings.language === 'string' && languages.includes(settings.language) ? settings.language : 'typescript',
  showLineNumbers: typeof settings.showLineNumbers === 'boolean' ? settings.showLineNumbers : true,
  wrapLines: typeof settings.wrapLines === 'boolean' ? settings.wrapLines : false,
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;
  return (
    <>
      <SettingBlock
        titleForId='code-snippet-lang'
        title='Language'
        moreInfo='Select the programming language for syntax highlighting.'
      >
        <select id="code-snippet-lang" value={settings.language} onChange={e => {
          updateSettings({...settings, language: e.target.value})
        }}>
          {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
        </select>
      </SettingBlock>

      <SettingBlock title='Display'>
        <div>
          <label>
            <input type="checkbox" checked={settings.showLineNumbers} onChange={_=>updateSettings({...settings, showLineNumbers: !settings.showLineNumbers})}/>
            {' '}Show Line Numbers
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" checked={settings.wrapLines} onChange={_=>updateSettings({...settings, wrapLines: !settings.wrapLines})}/>
            {' '}Wrap Lines
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
