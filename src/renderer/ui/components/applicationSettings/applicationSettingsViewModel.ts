/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { CloseApplicationSettingsUseCase } from '@/application/useCases/applicationSettings/closeApplicationSettings';
import { ShowOpenDirDialogUseCase } from '@/application/useCases/dialog/showOpenDirDialog';
import { GetMainHotkeyOptionsUseCase } from '@/application/useCases/applicationSettings/getMainHotkeyOptions';
import { SaveApplicationSettingsUseCase } from '@/application/useCases/applicationSettings/saveApplicationSettings';
import { UpdateApplicationSettingsUseCase } from '@/application/useCases/applicationSettings/updateApplicationSettings';
import { AppConfig } from '@/base/appConfig';
import { memSaverConfigAppActivateOnProjectSwitchOptions, memSaverConfigAppInactiveAfterOptions } from '@/base/memSaver';
import { uiThemes, autoThemeId } from '@/base/uiTheme';
import { UseAppState } from '@/ui/hooks/appState';
import { useCallback } from 'react';

type Deps = {
  useAppState: UseAppState;
  getMainHotkeyOptionsUseCase: GetMainHotkeyOptionsUseCase;
  saveApplicationSettingsUseCase: SaveApplicationSettingsUseCase;
  updateApplicationSettingsUseCase: UpdateApplicationSettingsUseCase;
  closeApplicationSettingsUseCase: CloseApplicationSettingsUseCase;
  showOpenDirDialogUseCase: ShowOpenDirDialogUseCase;
  setLaunchAtStartupUseCase: (enabled: boolean) => Promise<void>;
}

export function createApplicationSettingsViewModelHook({
  useAppState,
  getMainHotkeyOptionsUseCase,
  saveApplicationSettingsUseCase,
  updateApplicationSettingsUseCase,
  closeApplicationSettingsUseCase,
  showOpenDirDialogUseCase,
  setLaunchAtStartupUseCase,
}: Deps) {
  const hotkeyOptions = getMainHotkeyOptionsUseCase();
  const uiThemeOptions = [{ id: autoThemeId, name: 'Auto (match OS)' }, ...uiThemes];
  const inactiveAfterOptions = memSaverConfigAppInactiveAfterOptions;
  const activateOnProjectSwitchOptions = memSaverConfigAppActivateOnProjectSwitchOptions;

  function useViewModel() {
    const {
      appConfig,
    } = useAppState(state => ({
      appConfig: state.ui.modalScreens.data.applicationSettings.appConfig
    }))

    const updateSettings = useCallback((newAppConfig: AppConfig) => {
      updateApplicationSettingsUseCase(newAppConfig);
    }, [])

    const onOkClickHandler = useCallback(() => {
      if (appConfig) {
        setLaunchAtStartupUseCase(appConfig.launchAtStartup);
      }
      saveApplicationSettingsUseCase();
    }, [appConfig]);

    const onCancelClickHandler = useCallback(() => {
      closeApplicationSettingsUseCase();
    }, []);

    const browseDir = useCallback(async (): Promise<string | undefined> => {
      const { canceled, filePaths } = await showOpenDirDialogUseCase({ defaultPath: '', multiSelect: false });
      return (!canceled && filePaths[0]) ? filePaths[0] : undefined;
    }, []);

    return {
      appConfig,
      hotkeyOptions,
      updateSettings,
      browseDir,
      onOkClickHandler,
      onCancelClickHandler,
      uiThemeOptions,
      inactiveAfterOptions,
      activateOnProjectSwitchOptions
    }
  }

  return useViewModel;
}

export type ApplicationSettingsViewModelHook = ReturnType<typeof createApplicationSettingsViewModelHook>;
export type ApplicationSettingsViewModel = ReturnType<ApplicationSettingsViewModelHook>;
