/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

/**
 * Stored form of secret widget settings (API tokens, passwords).
 *
 * A secret setting is persisted as `enc:v1:<ciphertext>`, where ciphertext is
 * the base64 output of the OS keychain encryption (Electron safeStorage).
 * A non-empty value without the prefix is legacy plaintext; it is encrypted
 * the next time the widget settings are saved. An empty string means "not set".
 */
export const encryptedSecretPrefix = 'enc:v1:';

/** true if the value is a stored ciphertext (has the `enc:v1:` prefix) */
export function isEncryptedSecret(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(encryptedSecretPrefix);
}

/** wraps a safeStorage ciphertext into the stored form */
export function toEncryptedSecret(cipherText: string): string {
  return `${encryptedSecretPrefix}${cipherText}`;
}

/** strips the prefix off a stored ciphertext, returning what safeStorage decrypt expects */
export function fromEncryptedSecret(value: string): string {
  return isEncryptedSecret(value) ? value.slice(encryptedSecretPrefix.length) : value;
}

/** true if the value is a non-empty secret that still needs encrypting */
export function needsSecretEncryption(value: unknown): value is string {
  return typeof value === 'string' && value !== '' && !isEncryptedSecret(value);
}

/**
 * Returns a copy of `settings` with every listed secret key that holds
 * non-empty plaintext replaced by its encrypted stored form. Empty strings,
 * non-string values and already-encrypted values are left untouched. Returns
 * the same object when nothing needed encrypting.
 */
export async function encryptSecretSettings<T extends Record<string, unknown>>(
  settings: T,
  secretKeys: readonly string[],
  encrypt: (plainText: string) => Promise<string> | string
): Promise<T> {
  let result: T = settings;
  for (const key of secretKeys) {
    const value = settings[key];
    if (needsSecretEncryption(value)) {
      const cipherText = await encrypt(value);
      if (result === settings) {
        result = { ...settings };
      }
      (result as Record<string, unknown>)[key] = toEncryptedSecret(cipherText);
    }
  }
  return result;
}
