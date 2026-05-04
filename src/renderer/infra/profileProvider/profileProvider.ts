import { IpcExportProfileArgs, ipcExportProfileChannel, IpcExportProfileRes, IpcImportProfileArgs, ipcImportProfileChannel, IpcImportProfileRes } from '@common/ipc/channels';
import { electronIpcRenderer } from '@/infra/mainApi/mainApi';

export interface ProfileProvider {
  exportProfile: () => Promise<boolean>;
  importProfile: () => Promise<string | undefined>;
}

export function createProfileProvider(): ProfileProvider {
  return {
    exportProfile: async () => electronIpcRenderer.invoke<IpcExportProfileArgs, IpcExportProfileRes>(
      ipcExportProfileChannel
    ),
    importProfile: async () => electronIpcRenderer.invoke<IpcImportProfileArgs, IpcImportProfileRes>(
      ipcImportProfileChannel
    ),
  }
}
