/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Button, CreateSettingsState, List, ReactComponent, SettingsEditorReactComponentProps, addItemToList, delete14Svg, removeItemFromList, SettingBlock, SettingRow, SettingActions } from '@/widgets/appModules';
import { useEffect, useRef, useState } from 'react';

export type IconMode = 'default' | 'favicon' | 'custom';

export interface Settings {
  urls: List<string>,
  iconMode: IconMode,
  customIcon: string,
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  urls: Array.isArray(settings.urls) ? settings.urls.map(path=>typeof path==='string'?path:'') : [''],
  iconMode: (settings.iconMode === 'favicon' || settings.iconMode === 'custom') ? settings.iconMode : 'default',
  customIcon: typeof settings.customIcon === 'string' ? settings.customIcon : '',
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const urlRefs = useRef<Array<HTMLInputElement|null>>([]);
  const {updateSettings} = settingsApi;
  const [triggerLastUrlFocus, setTriggerLastUrlFocus] = useState(false);

  useEffect(() => {
    if (triggerLastUrlFocus) {
      urlRefs.current[settings.urls.length-1]?.focus();
      setTriggerLastUrlFocus(false);
    }
  }, [settings.urls.length, triggerLastUrlFocus])

  const updateUrlsSetting = (urls: List<string>) => updateSettings({...settings, urls})

  const updUrl = (i: number, url: string) =>
    updateUrlsSetting(settings.urls.map((_path, _i) => i!==_i ? _path : url))
  const addPath = () =>
    updateUrlsSetting(addItemToList(settings.urls, ''))
  const deletePath = (i: number) =>
    updateUrlsSetting(removeItemFromList(settings.urls, i))

  return (
    <>
      <SettingBlock
        titleForId='url0'
        title='URLs'
        moreInfo='Specify the URLs to open with Web Browser.'
      >
        {settings.urls.map((url, i) => (
          <SettingRow key={i}>
            <input
              ref={(el) => {urlRefs.current[i] = el}}
              id={'url'+i}
              type="text"
              value={url}
              placeholder={'Enter a URL'}
              onChange={e => updUrl(i, e.target.value)}
            />
            <SettingActions
              actions={[{
                id: 'DELETE',
                icon: delete14Svg,
                title: 'Delete URL',
                doAction: async () => deletePath(i)
              }]}
            />
          </SettingRow>
        ))}
        <div>
          <Button
            onClick={_ => {
              addPath();
              setTriggerLastUrlFocus(true);
            }}
            caption={'Add a URL'}
            primary={true}
          ></Button>
        </div>
      </SettingBlock>

      <SettingBlock
        titleForId='link-icon-mode'
        title='Icon'
        moreInfo='Default shows the built-in link icon. Site Favicon loads the icon of the first URL. Custom Image uses an image URL or local file path.'
      >
        <select id='link-icon-mode' value={settings.iconMode} onChange={e => updateSettings({
          ...settings,
          iconMode: (e.target.value === 'favicon' || e.target.value === 'custom') ? e.target.value : 'default'
        })}>
          <option value='default'>Default Icon</option>
          <option value='favicon'>Site Favicon</option>
          <option value='custom'>Custom Image</option>
        </select>
        {settings.iconMode === 'custom' && (
          <SettingRow>
            <input
              id='link-custom-icon'
              type='text'
              value={settings.customIcon}
              placeholder='Image URL or local file path'
              onChange={e => updateSettings({ ...settings, customIcon: e.target.value })}
            />
          </SettingRow>
        )}
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
