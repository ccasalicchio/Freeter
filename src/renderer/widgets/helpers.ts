/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { createElement, useEffect, useState, type ReactElement } from 'react';
import { fromEncryptedSecret, isEncryptedSecret } from '@common/base/secretSetting';

export { debounce } from '@common/helpers/debounce'
export type { DebouncedFunc } from '@common/helpers/debounce';

/**
 * Runs the callback immediately and then on an interval.
 * - No-ops when intervalSecs <= 0.
 * - The interval is clamped to a minimum of 5 seconds and jittered ±10% per
 *   tick to avoid a thundering herd against a single server.
 * - Cleans up on unmount and whenever callback/interval change.
 */
export function usePolling(callback: () => void, intervalSecs: number): void {
  useEffect(() => {
    if (intervalSecs <= 0) {
      return undefined;
    }
    const baseMs = Math.max(5, intervalSecs) * 1000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const schedule = () => {
      const jitter = 1 + (Math.random() * 0.2 - 0.1); // ±10%
      timer = setTimeout(() => {
        if (!stopped) {
          callback();
          schedule();
        }
      }, Math.round(baseMs * jitter));
    };
    callback();
    schedule();
    return () => {
      stopped = true;
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [callback, intervalSecs]);
}

export interface SparklineProps {
  points: number[];
  width?: number;
  height?: number;
  stroke?: string;
}

/** Inline-SVG polyline sparkline of numeric points, auto-scaled to its box. */
export function Sparkline({ points, width = 120, height = 28, stroke = 'currentColor' }: SparklineProps): ReactElement | null {
  const finite = points.filter(Number.isFinite);
  if (finite.length < 2) {
    return null;
  }
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const span = max - min || 1;
  const pad = 2;
  const svgPoints = finite
    .map((p, i) => {
      const x = pad + (i / (finite.length - 1)) * (width - pad * 2);
      const y = pad + (1 - (p - min) / span) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return createElement(
    'svg',
    { width, height, viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: 'none', style: { display: 'block', maxWidth: '100%' }, 'aria-hidden': true },
    createElement('polyline', { points: svgPoints, fill: 'none', stroke, strokeWidth: 1.5, strokeLinejoin: 'round', strokeLinecap: 'round' })
  );
}

export type ThresholdLevel = 'ok' | 'warn' | 'crit';

export interface Thresholds {
  warn?: number;
  crit?: number;
  /** when true, lower is worse (value <= threshold trips it) */
  invert?: boolean;
}

/** Maps a value against warn/crit thresholds to a severity level. */
export function thresholdColor(value: number, thresholds: Thresholds): ThresholdLevel {
  const { warn, crit, invert } = thresholds;
  if (!Number.isFinite(value)) {
    return 'ok';
  }
  if (invert) {
    if (crit !== undefined && value <= crit) {
      return 'crit';
    }
    if (warn !== undefined && value <= warn) {
      return 'warn';
    }
  } else {
    if (crit !== undefined && value >= crit) {
      return 'crit';
    }
    if (warn !== undefined && value >= warn) {
      return 'warn';
    }
  }
  return 'ok';
}

/**
 * Safe dot/bracket path evaluator (no eval): `data.stats[0].cpu`.
 * Returns undefined when any segment is missing.
 */
export function getJsonPath(obj: unknown, path: string): unknown {
  const trimmed = path.trim();
  if (trimmed === '') {
    return obj;
  }
  const segments: (string | number)[] = [];
  for (const part of trimmed.split('.')) {
    if (part === '') {
      continue;
    }
    const m = /^([^[\]]*)((?:\[\d+\])*)$/.exec(part);
    if (m === null) {
      return undefined;
    }
    if (m[1] !== '') {
      segments.push(m[1]);
    }
    if (m[2] !== '') {
      const idxs = m[2].match(/\d+/g) ?? [];
      for (const idx of idxs) {
        segments.push(Number(idx));
      }
    }
  }
  let cur: unknown = obj;
  for (const seg of segments) {
    if (cur === null || typeof cur !== 'object') {
      return undefined;
    }
    cur = (cur as Record<string | number, unknown>)[seg];
    if (cur === undefined) {
      return undefined;
    }
  }
  return cur;
}

export type MonitorAuthType = 'none' | 'basic' | 'bearer';

export interface MonitorAuthSettings {
  authType: MonitorAuthType;
  username: string;
  password: string;
  token: string;
}

/**
 * Builds the Authorization header for basic/bearer monitor auth settings.
 * The credentials passed in must already be decrypted (see useSecretSetting):
 * the stored settings hold them as OS-keychain ciphertext (`enc:v1:…`).
 */
export function monitorAuthHeaders(auth: MonitorAuthSettings): Record<string, string> {
  if (auth.authType === 'basic' && (auth.username !== '' || auth.password !== '')) {
    return { Authorization: `Basic ${btoa(`${auth.username}:${auth.password}`)}` };
  }
  if (auth.authType === 'bearer' && auth.token !== '') {
    return { Authorization: `Bearer ${auth.token}` };
  }
  return {};
}

export function sanitizeMonitorAuth(settings: Record<string, unknown>): MonitorAuthSettings {
  return {
    authType: settings.authType === 'basic' ? 'basic' : settings.authType === 'bearer' ? 'bearer' : 'none',
    username: typeof settings.username === 'string' ? settings.username : '',
    password: typeof settings.password === 'string' ? settings.password : '',
    token: typeof settings.token === 'string' ? settings.token : '',
  };
}

/**
 * Formats the time elapsed since an ISO timestamp as a compact relative
 * duration: "30s", "5m", "3h", "2d". Returns '' for unparsable input.
 */
export function formatSinceTime(isoTime: string, nowMs: number = Date.now()): string {
  const t = Date.parse(isoTime);
  if (Number.isNaN(t)) {
    return '';
  }
  const secs = Math.max(0, Math.floor((nowMs - t) / 1000));
  if (secs < 60) {
    return `${secs}s`;
  }
  const mins = Math.floor(secs / 60);
  if (mins < 60) {
    return `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  return `${Math.floor(hours / 24)}d`;
}

/** Formats a stat value: <10 → 2 decimals, <100 → 1 decimal, else 0. */
export function formatStatValue(value: number): string {
  if (!Number.isFinite(value)) {
    return 'N/A';
  }
  const abs = Math.abs(value);
  return value.toFixed(abs < 10 ? 2 : abs < 100 ? 1 : 0);
}

/** performs a GitHub REST API request via the widget http module */
export async function githubApiRequest(
  http: {
    request: (cfg: { url: string; method?: string; headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; body: string; error?: string }>
  },
  path: string,
  token: string
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const res = await http.request({
    url: `https://api.github.com${path}`,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Freeter3',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (res.error) {
    return { ok: false, error: res.error };
  }
  if (!res.ok) {
    return { ok: false, error: `GitHub API ${res.status}${res.status === 401 ? ' — check the access token' : res.status === 404 ? ' — repository not found (private repos need a token)' : ''}` };
  }
  try {
    return { ok: true, data: JSON.parse(res.body) };
  } catch {
    return { ok: false, error: 'Unexpected GitHub API response' };
  }
}

export { isEncryptedSecret } from '@common/base/secretSetting';

/** shown by widgets when a stored secret can't be decrypted (e.g. a profile from another machine) */
export const secretDecryptErrorText = 'Saved token can\'t be decrypted on this machine — re-enter it in settings';

export type SecretSettingState =
  | { readonly status: 'ready'; readonly value: string }
  | { readonly status: 'pending' }
  | { readonly status: 'error' };

/**
 * Resolves a secret widget setting to its plaintext for use in requests.
 * - empty / legacy plaintext values resolve synchronously ('ready');
 * - `enc:v1:` ciphertext is decrypted through the safeStorage widget API:
 *   'pending' until the IPC round trip resolves, then 'ready' or 'error'.
 * Callers must not send any request until the status is 'ready', so the
 * ciphertext is never used as a credential.
 */
export function useSecretSetting(
  stored: string,
  safeStorage: { decryptString: (encryptedText: string) => Promise<string> } | undefined
): SecretSettingState {
  const encrypted = isEncryptedSecret(stored);
  const [decrypted, setDecrypted] = useState<{ stored: string; result: SecretSettingState } | null>(null);

  useEffect(() => {
    if (!encrypted) {
      return undefined;
    }
    let cancelled = false;
    (async () => {
      let result: SecretSettingState;
      try {
        if (!safeStorage) {
          throw new Error('safeStorage widget API not available');
        }
        const value = await safeStorage.decryptString(fromEncryptedSecret(stored));
        result = typeof value === 'string' ? { status: 'ready', value } : { status: 'error' };
      } catch {
        result = { status: 'error' };
      }
      if (!cancelled) {
        setDecrypted({ stored, result });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stored, encrypted, safeStorage]);

  if (!encrypted) {
    return { status: 'ready', value: stored };
  }
  if (decrypted !== null && decrypted.stored === stored) {
    return decrypted.result;
  }
  return { status: 'pending' };
}

export type MonitorAuthState =
  | { readonly status: 'ready'; readonly auth: MonitorAuthSettings }
  | { readonly status: 'pending' }
  | { readonly status: 'error' };

/**
 * Decrypts the secret monitor auth settings (password, token) on use. Only
 * the secret the selected authType actually sends is considered, so an
 * undecryptable leftover of another auth type doesn't block requests.
 */
export function useMonitorAuth(
  auth: MonitorAuthSettings,
  safeStorage: { decryptString: (encryptedText: string) => Promise<string> } | undefined
): MonitorAuthState {
  const password = useSecretSetting(auth.authType === 'basic' ? auth.password : '', safeStorage);
  const token = useSecretSetting(auth.authType === 'bearer' ? auth.token : '', safeStorage);
  if (password.status === 'error' || token.status === 'error') {
    return { status: 'error' };
  }
  if (password.status === 'pending' || token.status === 'pending') {
    return { status: 'pending' };
  }
  return { status: 'ready', auth: { authType: auth.authType, username: auth.username, password: password.value, token: token.value } };
}
