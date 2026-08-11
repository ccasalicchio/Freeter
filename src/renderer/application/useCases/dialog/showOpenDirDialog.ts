/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { DialogProvider } from '@/application/interfaces/dialogProvider';
import { OpenDirDialogConfig } from '@common/base/dialog';

type Deps = {
  dialog: DialogProvider;
}

export function createShowOpenDirDialogUseCase({
  dialog
}: Deps) {
  const showOpenDirDialog = (cfg: OpenDirDialogConfig) => dialog.showOpenDirDialog(cfg);

  return showOpenDirDialog;
}

export type ShowOpenDirDialogUseCase = ReturnType<typeof createShowOpenDirDialogUseCase>;
