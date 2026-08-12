/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { FsListDirResult } from '@common/base/fsEntries';
import { ipcFsListDirChannel, IpcFsListDirArgs, IpcFsListDirRes } from '@common/ipc/channels';
import { electronIpcRenderer } from '@/infra/mainApi/mainApi';

export interface FsProvider {
  listDir: (dirPath: string) => Promise<FsListDirResult>;
}

export function createFsProvider(): FsProvider {
  return {
    listDir: async (dirPath) => electronIpcRenderer.invoke<IpcFsListDirArgs, IpcFsListDirRes>(ipcFsListDirChannel, dirPath),
  }
}
