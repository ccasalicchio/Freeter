import { CreateSettingsState, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export interface Settings {
  spellCheck: boolean;
  markdown: boolean;
  renderMode: 'source' | 'preview' | 'split';
  fontSize: number;
  contentStyle: 'default' | 'document' | 'compact';
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  spellCheck: typeof settings.spellCheck === 'boolean' ? settings.spellCheck : false,
  markdown: typeof settings.markdown === 'boolean' ? settings.markdown : true,
  // single-pane preview by default; the widget action bar has View/Edit buttons
  renderMode: (settings.renderMode === 'source' || settings.renderMode === 'preview' || settings.renderMode === 'split') ? settings.renderMode : 'preview',
  fontSize: typeof settings.fontSize === 'number' ? settings.fontSize : 14,
  contentStyle: (settings.contentStyle === 'document' || settings.contentStyle === 'compact') ? settings.contentStyle : 'default',
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;
  return (
    <>
      <SettingBlock
        titleForId='note-markdown'
        title='Markdown'
      >
        <div>
          <label>
            <input type="checkbox" id="note-markdown" checked={settings.markdown} onChange={_=>updateSettings({
              ...settings,
              markdown: !settings.markdown
            })}/>
            {' '}Enable Markdown editor
          </label>
        </div>
      </SettingBlock>

      {settings.markdown && (
        <SettingBlock
          titleForId='note-render-mode'
          title='Editor Mode'
          moreInfo='Choose how the markdown content is displayed.'
        >
          <select id="note-render-mode" value={settings.renderMode} onChange={e => {
            updateSettings({...settings, renderMode: e.target.value as Settings['renderMode']})
          }}>
            <option value="source">Source</option>
            <option value="preview">Preview</option>
            <option value="split">Split</option>
          </select>
        </SettingBlock>
      )}

      {settings.markdown && (
        <SettingBlock
          titleForId='note-font-size'
          title='Font Size'
        >
          <select id="note-font-size" value={settings.fontSize} onChange={e => {
            updateSettings({...settings, fontSize: Number(e.target.value) || 14})
          }}>
            <option value={12}>12px</option>
            <option value={14}>14px</option>
            <option value={16}>16px</option>
            <option value={18}>18px</option>
            <option value={20}>20px</option>
          </select>
        </SettingBlock>
      )}

      {settings.markdown && (
        <SettingBlock
          titleForId='note-content-style'
          title='Content Style'
          moreInfo='Typography style of the rendered note.'
        >
          <select id="note-content-style" value={settings.contentStyle} onChange={e => {
            updateSettings({
              ...settings,
              contentStyle: (e.target.value === 'document' || e.target.value === 'compact') ? e.target.value : 'default'
            })
          }}>
            <option value='default'>Default</option>
            <option value='document'>Document (serif, relaxed)</option>
            <option value='compact'>Compact</option>
          </select>
        </SettingBlock>
      )}

      <SettingBlock
        titleForId='note-spell-check'
        title='Spell Checker'
      >
        <div>
          <label>
            <input type="checkbox" id="note-spell-check" checked={settings.spellCheck} onChange={_=>updateSettings({
              ...settings,
              spellCheck: !settings.spellCheck
            })}/>
            {' '}Enable spell checking
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
