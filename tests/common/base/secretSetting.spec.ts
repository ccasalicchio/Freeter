/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import {
  encryptSecretSettings, encryptedSecretPrefix, fromEncryptedSecret, isEncryptedSecret, needsSecretEncryption, toEncryptedSecret
} from '@common/base/secretSetting';

describe('secretSetting', () => {
  it('should use the enc:v1: prefix', () => {
    expect(encryptedSecretPrefix).toBe('enc:v1:');
  })

  describe('isEncryptedSecret()', () => {
    it.each<[unknown, boolean]>([
      ['enc:v1:abc', true],
      ['enc:v1:', true],
      ['plain-token', false],
      ['', false],
      ['ENC:V1:abc', false],
      [' enc:v1:abc', false],
      [undefined, false],
      [123, false],
    ])('should return for %j: %j', (value, expected) => {
      expect(isEncryptedSecret(value)).toBe(expected);
    })
  })

  it('should round-trip toEncryptedSecret / fromEncryptedSecret', () => {
    const stored = toEncryptedSecret('Y2lwaGVy');
    expect(stored).toBe('enc:v1:Y2lwaGVy');
    expect(fromEncryptedSecret(stored)).toBe('Y2lwaGVy');
  })

  it('fromEncryptedSecret() should leave unprefixed values as they are', () => {
    expect(fromEncryptedSecret('plain')).toBe('plain');
  })

  describe('needsSecretEncryption()', () => {
    it.each<[unknown, boolean]>([
      ['plain', true],
      ['', false],
      ['enc:v1:abc', false],
      [null, false],
      [5, false],
    ])('should return for %j: %j', (value, expected) => {
      expect(needsSecretEncryption(value)).toBe(expected);
    })
  })

  describe('encryptSecretSettings()', () => {
    const encrypt = jest.fn(async (text: string) => `CIPHER(${text})`);
    beforeEach(() => encrypt.mockClear());

    it('should encrypt the listed plaintext keys and leave others alone', async () => {
      const settings = { token: 'secret', password: 'pw', username: 'bob', url: 'http://x' };
      const res = await encryptSecretSettings(settings, ['token', 'password'], encrypt);
      expect(res).toEqual({ token: 'enc:v1:CIPHER(secret)', password: 'enc:v1:CIPHER(pw)', username: 'bob', url: 'http://x' });
      expect(settings.token).toBe('secret'); // input not mutated
    })

    it('should leave empty and already-encrypted values alone', async () => {
      const settings = { token: '', password: 'enc:v1:already' };
      const res = await encryptSecretSettings(settings, ['token', 'password'], encrypt);
      expect(res).toBe(settings);
      expect(encrypt).not.toHaveBeenCalled();
    })

    it('should ignore missing and non-string keys', async () => {
      const settings = { token: 42 } as Record<string, unknown>;
      const res = await encryptSecretSettings(settings, ['token', 'password'], encrypt);
      expect(res).toBe(settings);
    })

    it('should accept a synchronous encrypt function', async () => {
      const res = await encryptSecretSettings({ token: 't' }, ['token'], text => `S(${text})`);
      expect(res).toEqual({ token: 'enc:v1:S(t)' });
    })

    it('should propagate encryption errors', async () => {
      await expect(encryptSecretSettings({ token: 't' }, ['token'], () => { throw new Error('no keychain') }))
        .rejects.toThrow('no keychain');
    })
  })
})
