/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

export const schemeFreeterFile = 'freeter-file';

export const hostFreeterApp = 'freeter-app';

/** host serving local image files to the renderer (see registerAppFileProtocol) */
export const hostLocalFile = 'local-file';

/** host serving offline-cached site favicons to the renderer (see registerAppFileProtocol) */
export const hostFavicon = 'favicon';

/** builds a renderer-loadable URL for a local image path */
export function localFileUrl(path: string): string {
  return `${schemeFreeterFile}://${hostLocalFile}/${encodeURIComponent(path)}`;
}

/** builds a renderer-loadable URL serving the (offline-cached) favicon of a page URL */
export function faviconUrl(pageUrl: string): string {
  return `${schemeFreeterFile}://${hostFavicon}/${encodeURIComponent(pageUrl)}`;
}
