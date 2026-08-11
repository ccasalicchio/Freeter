/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Controller } from '@/controllers/controller';
import { IpcGetProcessInfoArgs, ipcGetProcessInfoChannel, IpcGetProcessInfoRes, IpcGetSystemMetricsArgs, ipcGetSystemMetricsChannel, IpcGetSystemMetricsRes } from '@common/ipc/channels';
import { GetProcessInfoUseCase } from '@/application/useCases/process/getProcessInfo';
import { GetSystemMetricsUseCase } from '@/application/useCases/process/getSystemMetrics';

type Deps = {
  getProcessInfoUseCase: GetProcessInfoUseCase;
  getSystemMetricsUseCase: GetSystemMetricsUseCase;
}

export function createProcessControllers({
  getProcessInfoUseCase,
  getSystemMetricsUseCase,
}: Deps): [
    Controller<IpcGetProcessInfoArgs, IpcGetProcessInfoRes>,
    Controller<IpcGetSystemMetricsArgs, IpcGetSystemMetricsRes>,
  ] {
  return [{
    channel: ipcGetProcessInfoChannel,
    handle: async (_event) => getProcessInfoUseCase()
  }, {
    channel: ipcGetSystemMetricsChannel,
    handle: async () => getSystemMetricsUseCase()
  }]
}
