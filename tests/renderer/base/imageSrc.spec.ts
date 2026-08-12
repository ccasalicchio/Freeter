/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { resolveImageSrc } from '@/base/imageSrc';

describe('resolveImageSrc', () => {
  it('passes remote and data urls through', () => {
    expect(resolveImageSrc('https://x.example/a.png')).toBe('https://x.example/a.png');
    expect(resolveImageSrc('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA');
  })

  it('serves absolute local paths via the app protocol', () => {
    expect(resolveImageSrc('C:\\Users\\me\\logo.png'))
      .toBe(`freeter-file://local-file/${encodeURIComponent('C:\\Users\\me\\logo.png')}`);
    expect(resolveImageSrc('/home/me/logo.png'))
      .toBe(`freeter-file://local-file/${encodeURIComponent('/home/me/logo.png')}`);
  })

  it('resolves relative paths against the base folder', () => {
    expect(resolveImageSrc('logo.png', 'C:\\Projects\\alpha'))
      .toBe(`freeter-file://local-file/${encodeURIComponent('C:\\Projects\\alpha/logo.png')}`);
  })

  it('returns empty/unresolvable inputs unchanged', () => {
    expect(resolveImageSrc('')).toBe('');
    expect(resolveImageSrc('logo.png')).toBe('logo.png');
  })
})
