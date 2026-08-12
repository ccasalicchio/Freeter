/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Controller } from '@/controllers/controller';
import { ipcSetMcpConfigChannel, IpcSetMcpConfigArgs, IpcSetMcpConfigRes } from '@common/ipc/channels';

type Deps = {
  applyMcpConfig: (config: { enabled: boolean; port: number; token: string }) => void;
}

export function createMcpConfigControllers({ applyMcpConfig }: Deps): [
  Controller<IpcSetMcpConfigArgs, IpcSetMcpConfigRes>,
] {
  return [{
    channel: ipcSetMcpConfigChannel,
    handle: async (_event, config) => {
      applyMcpConfig(config);
    }
  }]
}
