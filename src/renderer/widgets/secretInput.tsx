/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { isEncryptedSecret } from '@common/base/secretSetting';

export interface SecretInputProps {
  id: string;
  /** the stored setting value: '' (not set), legacy plaintext, or `enc:v1:` ciphertext */
  value: string;
  placeholder?: string;
  /** called with the new value to store (plaintext; it is encrypted when the settings are saved) */
  onChange: (newValue: string) => void;
}

/**
 * Password input for a secret widget setting (see WidgetType.secretSettings).
 * A stored ciphertext is never shown as if it were the secret: the input is
 * empty with a "saved (encrypted)" hint, and the stored value is kept unless
 * the user types a new one or clears it.
 */
export function SecretInput({ id, value, placeholder, onChange }: SecretInputProps) {
  const saved = isEncryptedSecret(value);
  return (
    <>
      <input id={id} type='password' value={saved ? '' : value}
        placeholder={saved ? 'saved (encrypted) — type to replace' : placeholder}
        onChange={e => onChange(e.target.value)} />
      {saved && (
        <div style={{ fontSize: '0.85em', opacity: 0.75, marginTop: 4 }}>
          {'Saved (encrypted with the OS keychain). '}
          <button type='button' onClick={() => onChange('')}>{'Clear'}</button>
        </div>
      )}
    </>
  );
}
