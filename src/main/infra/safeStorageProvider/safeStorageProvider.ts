import Electron from 'electron';

export interface SafeStorageProvider {
  encryptString: (plainText: string) => string;
  decryptString: (encryptedText: string) => string;
}

export function createSafeStorageProvider(): SafeStorageProvider {
  return {
    encryptString: (plainText) => Electron.safeStorage.encryptString(plainText).toString('base64'),
    decryptString: (encryptedText) => Electron.safeStorage.decryptString(Buffer.from(encryptedText, 'base64')),
  }
}
