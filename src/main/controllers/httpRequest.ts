/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Controller } from '@/controllers/controller';
import { ipcHttpRequestChannel, IpcHttpRequestArgs, IpcHttpRequestRes } from '@common/ipc/channels';

export function createHttpRequestControllers(): [
  Controller<IpcHttpRequestArgs, IpcHttpRequestRes>,
] {
  return [{
    channel: ipcHttpRequestChannel,
    handle: async (_event, config) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 30000);
        const res = await fetch(config.url, {
          method: config.method ?? 'GET',
          headers: config.headers,
          body: config.body,
          signal: controller.signal
        });
        clearTimeout(timer);
        if (config.binary === true) {
          const buf = await res.arrayBuffer();
          return {
            ok: res.ok, status: res.status, statusText: res.statusText,
            body: '', bodyBase64: Buffer.from(buf).toString('base64')
          };
        }
        const body = await res.text();
        return { ok: res.ok, status: res.status, statusText: res.statusText, body };
      } catch (err) {
        return {
          ok: false, status: 0, statusText: '', body: '',
          error: err instanceof Error ? err.message : String(err)
        };
      }
    }
  }]
}
