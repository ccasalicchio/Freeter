/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

/**
 * Remote location of a page's favicon: `<origin>/favicon.ico`.
 * Returns '' for invalid or non-http(s) URLs.
 */
export function faviconRemoteUrl(pageUrl: string): string {
  try {
    const { origin, protocol } = new URL(pageUrl);
    if (protocol !== 'http:' && protocol !== 'https:') {
      return '';
    }
    return origin + '/favicon.ico';
  } catch {
    return '';
  }
}

/**
 * Cache file path for a page URL's favicon, content-addressed by the sha1
 * of the URL origin (all pages of a site share one cache entry).
 * Returns '' for invalid or non-http(s) URLs.
 */
export function cachePathForOrigin(cacheDir: string, pageUrl: string): string {
  try {
    const { origin, protocol } = new URL(pageUrl);
    if (protocol !== 'http:' && protocol !== 'https:') {
      return '';
    }
    return join(cacheDir, createHash('sha1').update(origin).digest('hex') + '.ico');
  } catch {
    return '';
  }
}

function faviconResponse(data: Buffer): Response {
  return new Response(new Uint8Array(data), {
    status: 200,
    headers: { 'content-type': 'image/x-icon' }
  });
}

/**
 * Serves the favicon for a page URL: the cached file when present, otherwise
 * fetches `<origin>/favicon.ico` over the network, writes it to the cache and
 * serves it. Responds 404 when the URL is unusable or the network fetch fails
 * with nothing cached. Cache entries never expire (v1 caveat) — delete the
 * favicon-cache folder to refresh icons.
 */
export async function serveFavicon(
  cacheDir: string,
  pageUrl: string,
  fetchFn: (url: string) => Promise<Response>
): Promise<Response> {
  const cachePath = cachePathForOrigin(cacheDir, pageUrl);
  const remoteUrl = faviconRemoteUrl(pageUrl);
  if (cachePath === '' || remoteUrl === '') {
    return new Response(null, { status: 404 });
  }

  try {
    return faviconResponse(await readFile(cachePath));
  } catch {
    // not cached yet
  }

  try {
    const resp = await fetchFn(remoteUrl);
    if (!resp.ok) {
      return new Response(null, { status: 404 });
    }
    const data = Buffer.from(await resp.arrayBuffer());
    try {
      await mkdir(cacheDir, { recursive: true });
      await writeFile(cachePath, data);
    } catch {
      // a cache write failure is non-fatal: still serve the fetched icon
    }
    return faviconResponse(data);
  } catch {
    return new Response(null, { status: 404 });
  }
}
