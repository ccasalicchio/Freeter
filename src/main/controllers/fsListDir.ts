/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Controller } from '@/controllers/controller';
import { ipcFsListDirChannel, IpcFsListDirArgs, IpcFsListDirRes } from '@common/ipc/channels';
import { FsDirEntry } from '@common/base/fsEntries';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

export function createFsListDirControllers(): [
  Controller<IpcFsListDirArgs, IpcFsListDirRes>,
] {
  return [{
    channel: ipcFsListDirChannel,
    handle: async (_event, dirPath) => {
      try {
        const dirents = await readdir(dirPath, { withFileTypes: true });
        const entries: FsDirEntry[] = await Promise.all(dirents.map(async dirent => {
          const isDir = dirent.isDirectory();
          let size = 0;
          let mtimeMs = 0;
          try {
            const stats = await stat(join(dirPath, dirent.name));
            size = stats.size;
            mtimeMs = stats.mtimeMs;
          } catch {
            // tolerate per-entry stat errors (broken symlinks, no access, ...)
          }
          return { name: dirent.name, isDir, size, mtimeMs };
        }));
        entries.sort((a, b) => (a.isDir === b.isDir) ? a.name.localeCompare(b.name) : (a.isDir ? -1 : 1));
        return { ok: true, entries };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err)
        };
      }
    }
  }]
}
