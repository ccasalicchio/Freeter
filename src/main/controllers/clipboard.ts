/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Controller } from '@/controllers/controller';
import { ipcWriteTextIntoClipboardChannel, IpcWriteTextIntoClipboardArgs, IpcWriteTextIntoClipboardRes, ipcWriteBookmarkIntoClipboardChannel, IpcWriteBookmarkIntoClipboardArgs, IpcWriteBookmarkIntoClipboardRes, ipcReadTextFromClipboardChannel, IpcReadTextFromClipboardArgs, IpcReadTextFromClipboardRes } from '@common/ipc/channels';
import { WriteTextIntoClipboardUseCase } from '@/application/useCases/clipboard/writeTextIntoClipboard';
import { WriteBookmarkIntoClipboardUseCase } from '@/application/useCases/clipboard/writeBookmarkIntoClipboard';
import { ReadTextFromClipboardUseCase } from '@/application/useCases/clipboard/readTextFromClipboard';

type Deps = {
  writeBookmarkIntoClipboardUseCase: WriteBookmarkIntoClipboardUseCase;
  writeTextIntoClipboardUseCase: WriteTextIntoClipboardUseCase;
  readTextFromClipboardUseCase: ReadTextFromClipboardUseCase;
}

export function createClipboardControllers({
  writeBookmarkIntoClipboardUseCase,
  writeTextIntoClipboardUseCase,
  readTextFromClipboardUseCase,
}: Deps): [
    Controller<IpcWriteBookmarkIntoClipboardArgs, IpcWriteBookmarkIntoClipboardRes>,
    Controller<IpcWriteTextIntoClipboardArgs, IpcWriteTextIntoClipboardRes>,
    Controller<IpcReadTextFromClipboardArgs, IpcReadTextFromClipboardRes>,
  ] {
  return [{
    channel: ipcWriteBookmarkIntoClipboardChannel,
    handle: async (_event, title, url) => writeBookmarkIntoClipboardUseCase(title, url)
  }, {
    channel: ipcWriteTextIntoClipboardChannel,
    handle: async (_event, text) => writeTextIntoClipboardUseCase(text)
  }, {
    channel: ipcReadTextFromClipboardChannel,
    handle: async () => readTextFromClipboardUseCase()
  }]
}
