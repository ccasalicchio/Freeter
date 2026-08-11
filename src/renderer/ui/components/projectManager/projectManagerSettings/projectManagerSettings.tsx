/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { convertStrToUndBool, convertStrToUndNum, convertUndBoolToStr, convertUndNumToStr } from '@/base/convTypes';
import { sanitizePartialMemSaverConfig } from '@/base/memSaver';
import { ProjectManagerSettingsProps, useProjectManagerSettingsViewModel } from '@/ui/components/projectManager/projectManagerSettings/projectManagerSettingsViewModel';
import { Button, SettingBlock } from '@/widgets/appModules';
import { IconPicker } from '@/ui/components/basic/iconPicker/iconPicker';

export function ProjectManagerSettings(props: ProjectManagerSettingsProps) {
  const {
    settings,
    browseDir,
    updateSettings,
    refNameInput,
    inactiveAfterOptions,
    activateOnProjectSwitchOptions,
  } = useProjectManagerSettingsViewModel(props);

  return (
    settings!==null &&
    <div role="tabpanel">
      <SettingBlock
        titleForId='name'
        title='Name'
      >
        <input id="name" type="text" ref={refNameInput} value={settings.name} onChange={e => updateSettings({
          ...settings,
          name: e.target.value
        })}/>
      </SettingBlock>
      <SettingBlock
        titleForId='project-root-folder'
        title='Root Folder (optional)'
        moreInfo='Base folder of this project. Used as the starting point for project-related file paths.'
      >
        <input id="project-root-folder" type="text" value={settings.rootFolder ?? ''} placeholder='e.g. C:\Projects\my-project' onChange={e => updateSettings({
          ...settings,
          rootFolder: e.target.value
        })}/>
        <Button caption='Browse…' onClick={async () => {
          const dir = await browseDir();
          if (dir) {
            updateSettings({ ...settings, rootFolder: dir });
          }
        }} />
      </SettingBlock>
      <SettingBlock
        title='Project Icon (optional)'
        moreInfo='Pick a gallery icon and color, or set a custom image URL/path (the image wins when both are set).'
      >
        <IconPicker
          glyphId={settings.icon?.glyph ?? ''}
          color={settings.icon?.color ?? ''}
          onSelectGlyph={glyph => updateSettings({
            ...settings,
            icon: { glyph, color: settings.icon?.color ?? '', image: settings.icon?.image ?? '' }
          })}
          onSelectColor={color => updateSettings({
            ...settings,
            icon: { glyph: settings.icon?.glyph ?? '', color, image: settings.icon?.image ?? '' }
          })}
        />
        <input type="text" aria-label='Custom project image' value={settings.icon?.image ?? ''} placeholder='Custom image URL or local path (optional)' onChange={e => updateSettings({
          ...settings,
          icon: { glyph: settings.icon?.glyph ?? '', color: settings.icon?.color ?? '', image: e.target.value }
        })}/>
      </SettingBlock>
      <SettingBlock
        title='Memory Saver'
        moreInfo='Freeter frees up memory from inactive workflows.
                  This gives active workflows more computer resources and keeps Freeter
                  fast. Your inactive workflows automatically become active again when
                  you go back to them.'
      >
        <SettingBlock
          titleForId='mem-saver-inactive'
          title='Workflow becomes inactive after'
          moreInfo='This setting defines when workflows become inactive.'
        >
          <select id="mem-saver-inactive" value={convertUndNumToStr(settings.memSaver.workflowInactiveAfter)} onChange={e => updateSettings({
            ...settings,
            memSaver: sanitizePartialMemSaverConfig({
              ...settings.memSaver,
              workflowInactiveAfter: convertStrToUndNum(e.target.value)
            })
          })}>
            {inactiveAfterOptions.map(item=>(
              <option
                key={convertUndNumToStr(item.val)}
                value={convertUndNumToStr(item.val)}
              >{item.name}</option>
            ))}
          </select>
        </SettingBlock>
        <SettingBlock
          titleForId='mem-saver-activate-on-project'
          title='Activate all workflows when switching project'
          moreInfo='When turned on, switching to a project will activate all of its workflows.'
        >
          <select id="mem-saver-activate-on-project" value={convertUndBoolToStr(settings.memSaver.activateWorkflowsOnProjectSwitch)} onChange={e => updateSettings({
            ...settings,
            memSaver: sanitizePartialMemSaverConfig({
              ...settings.memSaver,
              activateWorkflowsOnProjectSwitch: convertStrToUndBool(e.target.value)
            })
          })}>
            {activateOnProjectSwitchOptions.map(item=>(
              <option
                key={convertUndBoolToStr(item.val)}
                value={convertUndBoolToStr(item.val)}
              >{item.name}</option>
            ))}
          </select>
        </SettingBlock>
      </SettingBlock>
    </div>
  )
}
