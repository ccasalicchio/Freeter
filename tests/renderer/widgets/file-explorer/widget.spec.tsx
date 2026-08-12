/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Settings } from '@/widgets/file-explorer/settings';
import { widgetComp } from '@/widgets/file-explorer/widget'
import { screen, waitFor } from '@testing-library/react';
import { SetupWidgetSutOptional, setupWidgetSut } from '@tests/widgets/setupSut'
import { FsDirEntry } from '@common/base/fsEntries';

function fixtureSettings(settings: Partial<Settings>): Settings {
  return {
    folderPath: '/home/user/stuff',
    showHidden: false,
    sortBy: 'name',
    refreshSecs: 0,
    ...settings
  }
}

function fixtureEntry(entry: Partial<FsDirEntry>): FsDirEntry {
  return {
    name: 'file.txt',
    isDir: false,
    size: 0,
    mtimeMs: 0,
    ...entry
  }
}

function setupSut(settings: Settings, optional?: SetupWidgetSutOptional) {
  return setupWidgetSut(widgetComp, settings, optional);
}

describe('File Explorer Widget', () => {
  it('should render a "not specified" note, if folderPath is empty', () => {
    setupSut(fixtureSettings({ folderPath: '' }));

    expect(screen.getByText(/folder not specified/i)).toBeInTheDocument();
  })

  it('should list dir and file entries returned by fs.listDir, with a human-readable size for files', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        fs: {
          listDir: jest.fn(async () => ({
            ok: true,
            entries: [
              fixtureEntry({ name: 'a-dir', isDir: true }),
              fixtureEntry({ name: 'a-file.txt', size: 2048 }),
            ]
          }))
        }
      }
    });

    expect(await screen.findByText('a-dir')).toBeInTheDocument();
    expect(screen.getByText('a-file.txt')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();
  })

  it('should hide dot-entries by default and show them when showHidden=true', async () => {
    const listDir = jest.fn(async () => ({
      ok: true,
      entries: [
        fixtureEntry({ name: '.hidden' }),
        fixtureEntry({ name: 'visible.txt' }),
      ]
    }));
    const { setSettings, getSettings } = setupSut(fixtureSettings({}), {
      mockWidgetApi: { fs: { listDir } }
    });

    expect(await screen.findByText('visible.txt')).toBeInTheDocument();
    expect(screen.queryByText('.hidden')).not.toBeInTheDocument();

    setSettings({ ...getSettings(), showHidden: true });

    expect(await screen.findByText('.hidden')).toBeInTheDocument();
  })

  it('should call shell.openPath with the full path on a file click', async () => {
    const openPath = jest.fn();
    const { userEvent } = setupSut(fixtureSettings({ folderPath: '/home/user/stuff' }), {
      mockWidgetApi: {
        fs: {
          listDir: jest.fn(async () => ({
            ok: true,
            entries: [fixtureEntry({ name: 'a-file.txt' })]
          }))
        },
        shell: { openPath }
      }
    });

    await userEvent.click(await screen.findByText('a-file.txt'));

    expect(openPath).toBeCalledTimes(1);
    expect(openPath).toBeCalledWith('/home/user/stuff/a-file.txt');
  })

  it('should navigate into a dir on click, showing an Up row that navigates back', async () => {
    const listDir = jest.fn(async (path: string) => ({
      ok: true,
      entries: path === '/home/user/stuff'
        ? [fixtureEntry({ name: 'sub-dir', isDir: true })]
        : [fixtureEntry({ name: 'nested.txt' })]
    }));
    const { userEvent } = setupSut(fixtureSettings({ folderPath: '/home/user/stuff' }), {
      mockWidgetApi: { fs: { listDir } }
    });

    await userEvent.click(await screen.findByText('sub-dir'));

    expect(await screen.findByText('nested.txt')).toBeInTheDocument();
    await waitFor(() => expect(listDir).toBeCalledWith('/home/user/stuff/sub-dir'));

    await userEvent.click(screen.getByText('..'));

    expect(await screen.findByText('sub-dir')).toBeInTheDocument();
    expect(screen.queryByText('..')).not.toBeInTheDocument();
  })

  it('should call shell.openPath with the current folder on the Open Folder button click', async () => {
    const openPath = jest.fn();
    const { userEvent } = setupSut(fixtureSettings({ folderPath: '/home/user/stuff' }), {
      mockWidgetApi: { shell: { openPath } }
    });

    await userEvent.click(screen.getByTitle(/open folder/i));

    expect(openPath).toBeCalledWith('/home/user/stuff');
  })

  it('should re-fetch the listing on the Refresh button click', async () => {
    const listDir = jest.fn(async () => ({ ok: true, entries: [] }));
    const { userEvent } = setupSut(fixtureSettings({}), {
      mockWidgetApi: { fs: { listDir } }
    });

    expect(await screen.findByText(/empty folder/i)).toBeInTheDocument();
    const callsAfterMount = listDir.mock.calls.length;

    await userEvent.click(screen.getByTitle(/refresh/i));

    expect(listDir.mock.calls.length).toBe(callsAfterMount + 1);
  })

  it('should render an error note, when listDir fails', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        fs: {
          listDir: jest.fn(async () => ({ ok: false, error: 'EACCES: permission denied' }))
        }
      }
    });

    expect(await screen.findByText('EACCES: permission denied')).toBeInTheDocument();
  })
})
