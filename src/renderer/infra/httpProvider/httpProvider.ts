/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { HttpRequestConfig, HttpResponse } from '@common/base/http';
import { ipcHttpRequestChannel, IpcHttpRequestArgs, IpcHttpRequestRes } from '@common/ipc/channels';
import { electronIpcRenderer } from '@/infra/mainApi/mainApi';

export interface HttpProvider {
  request: (config: HttpRequestConfig) => Promise<HttpResponse>;
}

export function createHttpProvider(): HttpProvider {
  return {
    request: async (config) => electronIpcRenderer.invoke<IpcHttpRequestArgs, IpcHttpRequestRes>(
      ipcHttpRequestChannel, config
    ),
  }
}
