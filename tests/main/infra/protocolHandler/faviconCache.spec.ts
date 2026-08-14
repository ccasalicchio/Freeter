/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { vi } from 'vitest';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { cachePathForOrigin, faviconRemoteUrl, serveFavicon } from '@/infra/protocolHandler/faviconCache';

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

const mockMkdir = vi.mocked(mkdir);
const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);

const cacheDir = join('some', 'cache-dir');
const sha1 = (val: string) => createHash('sha1').update(val).digest('hex');

beforeEach(() => {
  vi.clearAllMocks();
})

describe('faviconRemoteUrl', () => {
  it('should return <origin>/favicon.ico for a http(s) page URL', () => {
    expect(faviconRemoteUrl('https://example.com/some/page?q=1')).toBe('https://example.com/favicon.ico');
    expect(faviconRemoteUrl('http://example.com:8080/page')).toBe('http://example.com:8080/favicon.ico');
  })

  it('should return an empty string for invalid URLs', () => {
    expect(faviconRemoteUrl('not a url')).toBe('');
    expect(faviconRemoteUrl('')).toBe('');
  })

  it('should return an empty string for non-http(s) URLs', () => {
    expect(faviconRemoteUrl('file:///some/path')).toBe('');
    expect(faviconRemoteUrl('ftp://example.com/file')).toBe('');
  })
})

describe('cachePathForOrigin', () => {
  it('should build a .ico path under cacheDir named by the sha1 of the URL origin', () => {
    expect(cachePathForOrigin(cacheDir, 'https://example.com/some/page'))
      .toBe(join(cacheDir, sha1('https://example.com') + '.ico'));
  })

  it('should return the same path for different pages of the same origin', () => {
    expect(cachePathForOrigin(cacheDir, 'https://example.com/page-a'))
      .toBe(cachePathForOrigin(cacheDir, 'https://example.com/page-b?x=1'));
  })

  it('should return different paths for different origins', () => {
    expect(cachePathForOrigin(cacheDir, 'https://example.com/page'))
      .not.toBe(cachePathForOrigin(cacheDir, 'https://example.org/page'));
  })

  it('should return an empty string for invalid or non-http(s) URLs', () => {
    expect(cachePathForOrigin(cacheDir, 'not a url')).toBe('');
    expect(cachePathForOrigin(cacheDir, 'file:///some/path')).toBe('');
  })
})

describe('serveFavicon', () => {
  const pageUrl = 'https://example.com/some/page';
  const cachePath = join(cacheDir, sha1('https://example.com') + '.ico');
  const iconBytes = Buffer.from([1, 2, 3, 4]);

  function fixtureFetchOk(bytes: Buffer) {
    return vi.fn(async () => new Response(new Uint8Array(bytes), { status: 200 }));
  }

  it('should respond 404 without fetching, when the page URL is unusable', async () => {
    const fetchFn = fixtureFetchOk(iconBytes);

    const res = await serveFavicon(cacheDir, 'not a url', fetchFn);

    expect(res.status).toBe(404);
    expect(fetchFn).not.toBeCalled();
    expect(mockReadFile).not.toBeCalled();
  })

  it('should serve the cached file without fetching, when it exists', async () => {
    mockReadFile.mockResolvedValue(iconBytes);
    const fetchFn = fixtureFetchOk(Buffer.from([9]));

    const res = await serveFavicon(cacheDir, pageUrl, fetchFn);

    expect(mockReadFile).toBeCalledWith(cachePath);
    expect(fetchFn).not.toBeCalled();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/x-icon');
    expect(Buffer.from(await res.arrayBuffer())).toEqual(iconBytes);
  })

  it('should fetch the remote favicon, write it to the cache and serve it, when not cached', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    const fetchFn = fixtureFetchOk(iconBytes);

    const res = await serveFavicon(cacheDir, pageUrl, fetchFn);

    expect(fetchFn).toBeCalledTimes(1);
    expect(fetchFn).toBeCalledWith('https://example.com/favicon.ico');
    expect(mockMkdir).toBeCalledWith(cacheDir, { recursive: true });
    expect(mockWriteFile).toBeCalledWith(cachePath, iconBytes);
    expect(res.status).toBe(200);
    expect(Buffer.from(await res.arrayBuffer())).toEqual(iconBytes);
  })

  it('should still serve the fetched favicon, when writing the cache fails', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    mockWriteFile.mockRejectedValue(new Error('EACCES'));
    const fetchFn = fixtureFetchOk(iconBytes);

    const res = await serveFavicon(cacheDir, pageUrl, fetchFn);

    expect(res.status).toBe(200);
    expect(Buffer.from(await res.arrayBuffer())).toEqual(iconBytes);
  })

  it('should respond 404, when not cached and the remote responds non-ok', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    const fetchFn = vi.fn(async () => new Response(null, { status: 404 }));

    const res = await serveFavicon(cacheDir, pageUrl, fetchFn);

    expect(res.status).toBe(404);
    expect(mockWriteFile).not.toBeCalled();
  })

  it('should respond 404, when not cached and the network fetch fails', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    const fetchFn = vi.fn(async () => { throw new Error('offline') });

    const res = await serveFavicon(cacheDir, pageUrl, fetchFn);

    expect(res.status).toBe(404);
    expect(mockWriteFile).not.toBeCalled();
  })
})
