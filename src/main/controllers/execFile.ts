/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Controller } from '@/controllers/controller';
import { ipcExecFileChannel, IpcExecFileArgs, IpcExecFileRes } from '@common/ipc/channels';
import { execFile } from 'node:child_process';

const maxOutput = 512 * 1024;

export function createExecFileControllers(): [
  Controller<IpcExecFileArgs, IpcExecFileRes>,
] {
  return [{
    channel: ipcExecFileChannel,
    handle: (_event, cmd, args, cwd) => new Promise(resolve => {
      execFile(cmd, args, { cwd, timeout: 15000, maxBuffer: maxOutput, windowsHide: true }, (err, stdout, stderr) => {
        resolve({
          code: err ? ((err as NodeJS.ErrnoException & { code?: number | string }).code as number | null ?? 1) : 0,
          stdout: String(stdout ?? ''),
          stderr: String(stderr ?? ''),
          ...(err && typeof (err as NodeJS.ErrnoException).code === 'string' ? { error: (err as Error).message } : {})
        });
      });
    })
  }]
}
