/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ipcSetMcpConfigChannel, IpcSetMcpConfigArgs, IpcSetMcpConfigRes } from '@common/ipc/channels';
import { electronIpcRenderer } from '@/infra/mainApi/mainApi';
import { McpConfig } from '@/base/appConfig';

export interface McpConfigProvider {
  applyMcpConfig: (config: McpConfig) => Promise<void>;
}

export function createMcpConfigProvider(): McpConfigProvider {
  return {
    applyMcpConfig: async (config) => electronIpcRenderer.invoke<IpcSetMcpConfigArgs, IpcSetMcpConfigRes>(
      ipcSetMcpConfigChannel, config
    ),
  }
}
