/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { IpcExecFileArgs, ipcExecFileChannel, IpcExecFileRes, IpcGetProcessInfoArgs, ipcGetProcessInfoChannel, IpcGetProcessInfoRes, IpcGetSystemMetricsArgs, ipcGetSystemMetricsChannel, IpcGetSystemMetricsRes } from '@common/ipc/channels';
import { deepFreeze } from '@common/helpers/deepFreeze';
import { electronIpcRenderer } from '@/infra/mainApi/mainApi';
import { ProcessProvider } from '@/application/interfaces/processProvider';

export async function createProcessProvider(): Promise<ProcessProvider> {
  const processInfo = deepFreeze(await electronIpcRenderer.invoke<IpcGetProcessInfoArgs, IpcGetProcessInfoRes>(
    ipcGetProcessInfoChannel
  ))
  return {
    getProcessInfo: () => processInfo,
    getSystemMetrics: async () => electronIpcRenderer.invoke<IpcGetSystemMetricsArgs, IpcGetSystemMetricsRes>(
      ipcGetSystemMetricsChannel
    ),
    execFile: async (cmd, args, cwd) => electronIpcRenderer.invoke<IpcExecFileArgs, IpcExecFileRes>(
      ipcExecFileChannel, cmd, args, cwd
    )
  }
}
