/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

export { debounce } from '@common/helpers/debounce'
export type { DebouncedFunc } from '@common/helpers/debounce';

/** performs a GitHub REST API request via the widget http module */
export async function githubApiRequest(
  http: { request: (cfg: { url: string; method?: string; headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; body: string; error?: string }> },
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
