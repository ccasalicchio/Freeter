/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { vi } from 'vitest';
import { ipcFsListDirChannel } from '@common/ipc/channels';
import { createFsListDirControllers } from '@/controllers/fsListDir';
import { fixtureIpcMainEvent } from '@tests/infra/mocks/ipcMain';
import { readdir, stat } from 'node:fs/promises';

vi.mock('node:fs/promises', () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
}));

const mockReaddir = vi.mocked(readdir);
const mockStat = vi.mocked(stat);

function fixtureDirent(name: string, isDir: boolean) {
  return { name, isDirectory: () => isDir };
}

function fixtureStats(size: number, mtimeMs: number) {
  return { size, mtimeMs };
}

function setup() {
  vi.clearAllMocks();
  const [fsListDirController] = createFsListDirControllers();
  return {
    fsListDirController
  }
}

describe('FsListDirControllers', () => {
  describe('fsListDir', () => {
    it('should have a right channel name', () => {
      const { channel } = setup().fsListDirController;

      expect(channel).toBe(ipcFsListDirChannel)
    })

    it('should call readdir with the dir path and withFileTypes', async () => {
      const { fsListDirController } = setup();
      mockReaddir.mockResolvedValue([] as never);

      await fsListDirController.handle(fixtureIpcMainEvent(), 'some/dir');

      expect(mockReaddir).toBeCalledTimes(1);
      expect(mockReaddir).toBeCalledWith('some/dir', { withFileTypes: true });
    })

    it('should return ok=true with entries sorted dirs-first, each sorted by name', async () => {
      const { fsListDirController } = setup();
      mockReaddir.mockResolvedValue([
        fixtureDirent('b-file.txt', false),
        fixtureDirent('z-dir', true),
        fixtureDirent('a-file.txt', false),
        fixtureDirent('a-dir', true),
      ] as never);
      mockStat.mockResolvedValue(fixtureStats(100, 200) as never);

      const res = await fsListDirController.handle(fixtureIpcMainEvent(), 'some/dir');

      expect(res).toEqual({
        ok: true,
        entries: [
          { name: 'a-dir', isDir: true, size: 100, mtimeMs: 200 },
          { name: 'z-dir', isDir: true, size: 100, mtimeMs: 200 },
          { name: 'a-file.txt', isDir: false, size: 100, mtimeMs: 200 },
          { name: 'b-file.txt', isDir: false, size: 100, mtimeMs: 200 },
        ]
      });
    })

    it('should tolerate per-entry stat errors, keeping the entry with zeroed size/mtime', async () => {
      const { fsListDirController } = setup();
      mockReaddir.mockResolvedValue([
        fixtureDirent('good.txt', false),
        fixtureDirent('broken-link', false),
      ] as never);
      mockStat.mockImplementation(async (path) => {
        if (String(path).endsWith('broken-link')) {
          throw new Error('ENOENT');
        }
        return fixtureStats(42, 84) as never;
      });

      const res = await fsListDirController.handle(fixtureIpcMainEvent(), 'some/dir');

      expect(res).toEqual({
        ok: true,
        entries: [
          { name: 'broken-link', isDir: false, size: 0, mtimeMs: 0 },
          { name: 'good.txt', isDir: false, size: 42, mtimeMs: 84 },
        ]
      });
    })

    it('should return ok=false with an error message, when readdir fails', async () => {
      const { fsListDirController } = setup();
      mockReaddir.mockRejectedValue(new Error('EACCES: permission denied'));

      const res = await fsListDirController.handle(fixtureIpcMainEvent(), 'some/dir');

      expect(res).toEqual({
        ok: false,
        error: 'EACCES: permission denied'
      });
    })

    it('should never throw, returning ok=false for non-Error throwables', async () => {
      const { fsListDirController } = setup();
      mockReaddir.mockRejectedValue('string failure');

      const res = await fsListDirController.handle(fixtureIpcMainEvent(), 'some/dir');

      expect(res).toEqual({
        ok: false,
        error: 'string failure'
      });
    })
  })
})
