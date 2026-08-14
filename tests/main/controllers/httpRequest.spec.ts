/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ipcHttpRequestChannel } from '@common/ipc/channels';
import { createHttpRequestControllers } from '@/controllers/httpRequest';
import { fixtureIpcMainEvent } from '@tests/infra/mocks/ipcMain';

function setup() {
  const [httpRequestController] = createHttpRequestControllers();
  return { httpRequestController };
}

function fixtureFetchResponse(overrides?: Partial<{ ok: boolean; status: number; statusText: string }>, bodyBytes?: Uint8Array) {
  const bytes = bodyBytes ?? new TextEncoder().encode('the-body');
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    text: async () => new TextDecoder().decode(bytes),
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    ...overrides
  } as Response;
}

describe('HttpRequestControllers', () => {
  const origFetch = global.fetch;
  afterEach(() => {
    global.fetch = origFetch;
  })

  it('should have a right channel name', () => {
    const { channel } = setup().httpRequestController;

    expect(channel).toBe(ipcHttpRequestChannel)
  })

  it('should fetch the url with method/headers/body and return the text body', async () => {
    const fetchMock = jest.fn(async () => fixtureFetchResponse());
    global.fetch = fetchMock as typeof fetch;
    const { handle } = setup().httpRequestController;

    const res = await handle(fixtureIpcMainEvent(), {
      url: 'https://example.com/api',
      method: 'POST',
      headers: { Authorization: 'Bearer tok' },
      body: '{"a":1}'
    });

    expect(fetchMock).toBeCalledWith('https://example.com/api', expect.objectContaining({
      method: 'POST',
      headers: { Authorization: 'Bearer tok' },
      body: '{"a":1}'
    }));
    expect(res).toEqual({ ok: true, status: 200, statusText: 'OK', body: 'the-body' });
  })

  it('should return the body base64-encoded when binary is true', async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0x01]); // PNG-ish, incl. bytes text() would mangle
    global.fetch = jest.fn(async () => fixtureFetchResponse({}, bytes)) as typeof fetch;
    const { handle } = setup().httpRequestController;

    const res = await handle(fixtureIpcMainEvent(), { url: 'https://example.com/render.png', binary: true });

    expect(res).toEqual({
      ok: true, status: 200, statusText: 'OK',
      body: '',
      bodyBase64: Buffer.from(bytes).toString('base64')
    });
  })

  it('should not set bodyBase64 when binary is not requested', async () => {
    global.fetch = jest.fn(async () => fixtureFetchResponse()) as typeof fetch;
    const { handle } = setup().httpRequestController;

    const res = await handle(fixtureIpcMainEvent(), { url: 'https://example.com/api' });

    expect(res.bodyBase64).toBeUndefined();
    expect(res.body).toBe('the-body');
  })

  it('should pass through non-ok statuses', async () => {
    global.fetch = jest.fn(async () => fixtureFetchResponse({ ok: false, status: 404, statusText: 'Not Found' })) as typeof fetch;
    const { handle } = setup().httpRequestController;

    const res = await handle(fixtureIpcMainEvent(), { url: 'https://example.com/missing' });

    expect(res.ok).toBe(false);
    expect(res.status).toBe(404);
  })

  it('should return an error result when the fetch throws', async () => {
    global.fetch = jest.fn(async () => { throw new Error('ECONNREFUSED') }) as typeof fetch;
    const { handle } = setup().httpRequestController;

    const res = await handle(fixtureIpcMainEvent(), { url: 'https://example.com/api' });

    expect(res).toEqual({ ok: false, status: 0, statusText: '', body: '', error: 'ECONNREFUSED' });
  })
})
