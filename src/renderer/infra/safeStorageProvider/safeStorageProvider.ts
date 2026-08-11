import { IpcSafeStorageEncryptArgs, ipcSafeStorageEncryptChannel, IpcSafeStorageEncryptRes, IpcSafeStorageDecryptArgs, ipcSafeStorageDecryptChannel, IpcSafeStorageDecryptRes } from '@common/ipc/channels';
import { electronIpcRenderer } from '@/infra/mainApi/mainApi';

export interface SafeStorageRenderer {
  encryptString: (plainText: string) => Promise<string>;
  decryptString: (encryptedText: string) => Promise<string>;
}

export function createSafeStorageProvider(): SafeStorageRenderer {
  return {
    encryptString: async (plainText) => electronIpcRenderer.invoke<IpcSafeStorageEncryptArgs, IpcSafeStorageEncryptRes>(
      ipcSafeStorageEncryptChannel,
      plainText
    ),
    decryptString: async (encryptedText) => electronIpcRenderer.invoke<IpcSafeStorageDecryptArgs, IpcSafeStorageDecryptRes>(
      ipcSafeStorageDecryptChannel,
      encryptedText
    ),
  }
}
