/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ipcSetLoginItemSettingsChannel, IpcSetLoginItemSettingsArgs, IpcSetLoginItemSettingsRes } from '@common/ipc/channels';
import { electronIpcRenderer } from '@/infra/mainApi/mainApi';

export interface LoginItemProvider {
  setLaunchAtStartup: (enabled: boolean) => Promise<void>;
}

export function createLoginItemProvider(): LoginItemProvider {
  return {
    setLaunchAtStartup: async (enabled) => electronIpcRenderer.invoke<IpcSetLoginItemSettingsArgs, IpcSetLoginItemSettingsRes>(
      ipcSetLoginItemSettingsChannel, enabled
    ),
  }
}
