import { Controller } from '@/controllers/controller';
import { ipcSafeStorageEncryptChannel, IpcSafeStorageEncryptArgs, IpcSafeStorageEncryptRes, ipcSafeStorageDecryptChannel, IpcSafeStorageDecryptArgs, IpcSafeStorageDecryptRes } from '@common/ipc/channels';
import { SafeStorageEncryptUseCase, SafeStorageDecryptUseCase } from '@/application/useCases/safeStorage/safeStorage';

type Deps = {
  safeStorageEncryptUseCase: SafeStorageEncryptUseCase;
  safeStorageDecryptUseCase: SafeStorageDecryptUseCase;
}

export function createSafeStorageControllers({
  safeStorageEncryptUseCase,
  safeStorageDecryptUseCase,
}: Deps): [
    Controller<IpcSafeStorageEncryptArgs, IpcSafeStorageEncryptRes>,
    Controller<IpcSafeStorageDecryptArgs, IpcSafeStorageDecryptRes>,
  ] {
  return [{
    channel: ipcSafeStorageEncryptChannel,
    handle: async (_event, plainText) => safeStorageEncryptUseCase(plainText)
  }, {
    channel: ipcSafeStorageDecryptChannel,
    handle: async (_event, encryptedText) => safeStorageDecryptUseCase(encryptedText)
  }]
}
