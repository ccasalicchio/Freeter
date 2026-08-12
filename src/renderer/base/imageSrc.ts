/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { localFileUrl } from '@common/infra/network';

const reRemote = /^(https?:|data:|blob:|freeter-file:)/i;
const reAbsoluteLocal = /^([a-zA-Z]:[\\/]|\\\\|\/)/;

/**
 * Resolves a user-entered image reference to a renderer-loadable URL.
 * http(s)/data pass through; local paths (absolute, or relative resolved
 * against baseFolder) are served via the app's freeter-file protocol —
 * pages on a custom scheme cannot reference file:// directly.
 */
export function resolveImageSrc(src: string, baseFolder?: string): string {
  if (!src) {
    return '';
  }
  if (reRemote.test(src)) {
    return src;
  }
  if (reAbsoluteLocal.test(src)) {
    return localFileUrl(src);
  }
  if (baseFolder) {
    const sep = /[\\/]$/.test(baseFolder) ? '' : '/';
    return localFileUrl(`${baseFolder}${sep}${src}`);
  }
  return src;
}
