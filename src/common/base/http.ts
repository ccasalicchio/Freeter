/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

export interface HttpRequestConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  /**
   * When true, the response body is retrieved as binary and returned
   * base64-encoded in HttpResponse.bodyBase64 (body stays empty).
   * Needed for image/binary endpoints, which res.text() would mangle.
   */
  binary?: boolean;
}

export interface HttpResponse {
  ok: boolean;
  status: number;
  statusText: string;
  body: string;
  /** Base64-encoded body, set only when the request was made with binary: true. */
  bodyBase64?: string;
  error?: string;
}
