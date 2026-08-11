/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import {
  ipcFindInPageChannel, IpcFindInPageArgs, IpcFindInPageRes,
  ipcStopFindInPageChannel, IpcStopFindInPageArgs, IpcStopFindInPageRes
} from '@common/ipc/channels';
import { electronIpcRenderer } from '@/infra/mainApi/mainApi';

export interface FindInPageProvider {
  find: (text: string, forward: boolean, findNext: boolean) => Promise<void>;
  stop: () => Promise<void>;
}

export function createFindInPageProvider(): FindInPageProvider {
  return {
    find: async (text, forward, findNext) => electronIpcRenderer.invoke<IpcFindInPageArgs, IpcFindInPageRes>(
      ipcFindInPageChannel, text, forward, findNext
    ),
    stop: async () => electronIpcRenderer.invoke<IpcStopFindInPageArgs, IpcStopFindInPageRes>(
      ipcStopFindInPageChannel
    ),
  }
}
