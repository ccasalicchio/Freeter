/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Controller } from '@/controllers/controller';
import { ipcSetLoginItemSettingsChannel, IpcSetLoginItemSettingsArgs, IpcSetLoginItemSettingsRes } from '@common/ipc/channels';
import { app } from 'electron';

export function createLoginItemControllers(): [
  Controller<IpcSetLoginItemSettingsArgs, IpcSetLoginItemSettingsRes>,
] {
  return [{
    channel: ipcSetLoginItemSettingsChannel,
    handle: async (_event, openAtLogin) => {
      app.setLoginItemSettings({ openAtLogin });
    }
  }]
}
