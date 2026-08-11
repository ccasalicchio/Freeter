/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Controller } from '@/controllers/controller';
import {
  ipcFindInPageChannel, IpcFindInPageArgs, IpcFindInPageRes,
  ipcStopFindInPageChannel, IpcStopFindInPageArgs, IpcStopFindInPageRes
} from '@common/ipc/channels';
import { BrowserWindow } from 'electron';

type Deps = {
  getBrowserWindow: () => BrowserWindow | null;
}

export function createFindInPageControllers({ getBrowserWindow }: Deps): [
  Controller<IpcFindInPageArgs, IpcFindInPageRes>,
  Controller<IpcStopFindInPageArgs, IpcStopFindInPageRes>,
] {
  return [{
    channel: ipcFindInPageChannel,
    handle: async (_event, text, forward, findNext) => {
      const win = getBrowserWindow();
      if (win && text) {
        win.webContents.findInPage(text, { forward, findNext });
      }
    }
  }, {
    channel: ipcStopFindInPageChannel,
    handle: async () => {
      getBrowserWindow()?.webContents.stopFindInPage('clearSelection');
    }
  }]
}
