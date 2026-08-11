/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ApplicationSettingsViewModelHook } from '@/ui/components/applicationSettings/applicationSettingsViewModel';
import clsx from 'clsx';
import styles from './applicationSettings.module.scss';
import settingsScreenStyles from '@/ui/components/basic/settingsScreen/settingsScreen.module.scss'
import { SettingsScreen } from '@/ui/components/basic/settingsScreen/settingsScreen';
import { SettingBlock } from '@/widgets/appModules';
import { memo, useState } from 'react';
import { convertBoolToStr, convertStrToBool } from '@/base/convTypes';

type Deps = {
  useApplicationSettingsViewModel: ApplicationSettingsViewModelHook;
}

type SettingsTab = 'general' | 'appearance' | 'backup';

const themeOverrideVars: { key: string; name: string }[] = [
  { key: 'background', name: 'Background' },
  { key: 'componentBackground', name: 'Component Background' },
  { key: 'componentColor', name: 'Text Color' },
  { key: 'primary', name: 'Accent Color' },
  { key: 'buttonBackground', name: 'Button Background' },
  { key: 'buttonColor', name: 'Button Text' },
];

function colorInputValue(val: string | undefined): string {
  return (val && /^#[0-9a-fA-F]{6}/.test(val)) ? val.slice(0, 7) : '#000000';
}

export function createApplicationSettingsComponent({
  useApplicationSettingsViewModel,
}: Deps) {
  function ApplicationSettings() {
    const [tab, setTab] = useState<SettingsTab>('general');

    const {
      appConfig,
      hotkeyOptions,
      updateSettings,
      onOkClickHandler,
      onCancelClickHandler,
      uiThemeOptions,
      inactiveAfterOptions,
      activateOnProjectSwitchOptions
    } = useApplicationSettingsViewModel();

    if (!appConfig) {
      return null;
    }

    const tabs: { id: SettingsTab; name: string }[] = [
      { id: 'general', name: 'General' },
      { id: 'appearance', name: 'Appearance' },
      { id: 'backup', name: 'Backup' },
    ];

    return (<SettingsScreen title='Application Settings' onOkClick={onOkClickHandler} onCancelClick={onCancelClickHandler}>
      <div className={clsx(settingsScreenStyles['settings-screen-panel'], styles['settings-editor'])}>
        <div className={styles['settings-tabs']} role='tablist'>
          {tabs.map(t => (
            <button
              key={t.id}
              role='tab'
              aria-selected={tab === t.id}
              className={clsx(styles['settings-tab'], tab === t.id && styles['is-active'])}
              onClick={() => setTab(t.id)}
            >{t.name}</button>
          ))}
        </div>

        <div className={clsx(styles['settings-tab-panel'], tab === 'general' && styles['is-active'])}>
          <SettingBlock
            titleForId='main-hot-key'
            title='Hotkey Combination'
            moreInfo='Hotkey enables you to bring Freeter to the front of the screen by pressing the specified key
                      combination.'
          >
            <select id="main-hot-key" value={appConfig.mainHotkey} onChange={e => updateSettings({
              ...appConfig,
              mainHotkey: e.target.value
            })}>
              {hotkeyOptions.map(item=>(
                <option key={item.value} value={item.value}>{item.caption}</option>
              ))}
            </select>
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
              <select id="mem-saver-inactive" value={appConfig.memSaver.workflowInactiveAfter} onChange={e => updateSettings({
                ...appConfig,
                memSaver: {
                  ...appConfig.memSaver,
                  workflowInactiveAfter: Number.parseInt(e.target.value)
                }
              })}>
                {inactiveAfterOptions.map(item=>(
                  <option key={item.val} value={item.val}>{item.name}</option>
                ))}
              </select>
            </SettingBlock>
            <SettingBlock
              titleForId='mem-saver-activate-on-project'
              title='Activate all workflows when switching project'
              moreInfo='When turned on, switching to a project will activate all of its workflows.'
            >
              <select id="mem-saver-activate-on-project" value={convertBoolToStr(appConfig.memSaver.activateWorkflowsOnProjectSwitch)} onChange={e => updateSettings({
                ...appConfig,
                memSaver: {
                  ...appConfig.memSaver,
                  activateWorkflowsOnProjectSwitch: convertStrToBool(e.target.value)
                }
              })}>
                {activateOnProjectSwitchOptions.map(item=>(
                  <option key={convertBoolToStr(item.val)} value={convertBoolToStr(item.val)}>{item.name}</option>
                ))}
              </select>
            </SettingBlock>
          </SettingBlock>
        </div>

        <div className={clsx(styles['settings-tab-panel'], tab === 'appearance' && styles['is-active'])}>
          <SettingBlock
            titleForId='ui-theme'
            title='User Interface Theme'
            moreInfo='The interface theme defines the appearance of all visual elements of the user interface.'
          >
            <select id="ui-theme" value={appConfig.uiTheme} onChange={e => updateSettings({
              ...appConfig,
              uiTheme: e.target.value
            })}>
              {uiThemeOptions.map(item=>(
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </SettingBlock>

          <SettingBlock
            title='Theme Editor'
            moreInfo='Override individual colors of the selected theme. Cleared overrides fall back to the theme defaults.'
          >
            {themeOverrideVars.map(v => (
              <div key={v.key} className={styles['theme-override-row']}>
                <input
                  type='color'
                  id={`theme-override-${v.key}`}
                  value={colorInputValue(appConfig.themeOverrides[v.key])}
                  onChange={e => updateSettings({
                    ...appConfig,
                    themeOverrides: { ...appConfig.themeOverrides, [v.key]: e.target.value }
                  })}
                />
                <label htmlFor={`theme-override-${v.key}`}>{v.name}{appConfig.themeOverrides[v.key] ? '' : ' (theme default)'}</label>
                {appConfig.themeOverrides[v.key] && (
                  <button onClick={() => {
                    const rest = { ...appConfig.themeOverrides };
                    delete rest[v.key];
                    updateSettings({ ...appConfig, themeOverrides: rest });
                  }}>Reset</button>
                )}
              </div>
            ))}
          </SettingBlock>
        </div>

        <div className={clsx(styles['settings-tab-panel'], tab === 'backup' && styles['is-active'])}>
          <SettingBlock
            titleForId='auto-backup-enabled'
            title='Automatic Backups'
            moreInfo='When enabled, Freeter writes a daily backup of your profile (projects, workflows, widgets and their data) to the folder below.'
          >
            <div>
              <label>
                <input type='checkbox' id='auto-backup-enabled' checked={appConfig.autoBackup.enabled} onChange={_ => updateSettings({
                  ...appConfig,
                  autoBackup: { ...appConfig.autoBackup, enabled: !appConfig.autoBackup.enabled }
                })} />
                {' Enable daily backups'}
              </label>
            </div>
          </SettingBlock>
          <SettingBlock
            titleForId='auto-backup-folder'
            title='Backup Folder'
            moreInfo='Full path of the folder to store backups in (e.g. a synced cloud folder).'
          >
            <input
              type='text'
              id='auto-backup-folder'
              value={appConfig.autoBackup.folder}
              placeholder='e.g. C:\Users\me\Box\FreeterBackups'
              onChange={e => updateSettings({
                ...appConfig,
                autoBackup: { ...appConfig.autoBackup, folder: e.target.value }
              })}
            />
          </SettingBlock>
          <SettingBlock
            titleForId='auto-backup-on-close'
            title='Back Up On Close'
            moreInfo='Also write a backup every time the app closes.'
          >
            <div>
              <label>
                <input type='checkbox' id='auto-backup-on-close' checked={appConfig.autoBackup.onClose} onChange={_ => updateSettings({
                  ...appConfig,
                  autoBackup: { ...appConfig.autoBackup, onClose: !appConfig.autoBackup.onClose }
                })} />
                {' Back up when the app closes'}
              </label>
            </div>
          </SettingBlock>
        </div>
      </div>
    </SettingsScreen>)
  }

  return memo(ApplicationSettings);
}

export type ApplicationSettingsComponent = ReturnType<typeof createApplicationSettingsComponent>;
