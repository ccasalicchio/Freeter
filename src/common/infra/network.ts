/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

export const schemeFreeterFile = 'freeter-file';

export const hostFreeterApp = 'freeter-app';

/** host serving local image files to the renderer (see registerAppFileProtocol) */
export const hostLocalFile = 'local-file';

/** builds a renderer-loadable URL for a local image path */
export function localFileUrl(path: string): string {
  return `${schemeFreeterFile}://${hostLocalFile}/${encodeURIComponent(path)}`;
}
