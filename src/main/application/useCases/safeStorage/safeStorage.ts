import { SafeStorageProvider } from '@/infra/safeStorageProvider/safeStorageProvider';

type Deps = {
  safeStorageProvider: SafeStorageProvider;
}

export function createSafeStorageEncryptUseCase({ safeStorageProvider }: Deps) {
  return function safeStorageEncryptUseCase(plainText: string) {
    return safeStorageProvider.encryptString(plainText);
  }
}

export type SafeStorageEncryptUseCase = ReturnType<typeof createSafeStorageEncryptUseCase>;

export function createSafeStorageDecryptUseCase({ safeStorageProvider }: Deps) {
  return function safeStorageDecryptUseCase(encryptedText: string) {
    return safeStorageProvider.decryptString(encryptedText);
  }
}

export type SafeStorageDecryptUseCase = ReturnType<typeof createSafeStorageDecryptUseCase>;
