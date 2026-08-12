/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { join } from 'path';
import { pathToFileURL } from 'url';
import { net } from 'electron';
import { registerProtocol } from '@/infra/protocolHandler/protocolHandler';
import { hostFreeterApp, hostLocalFile, schemeFreeterFile } from '@common/infra/network';

export function registerAppFileProtocol(devMode: boolean) {
  let fetchAppFile: (pathname: string) => Promise<Response>;
  if (devMode) {
    fetchAppFile = pathname => net.fetch('http://localhost:4000' + pathname)
  } else {
    fetchAppFile = pathname => net.fetch(pathToFileURL(join(__dirname, '..', 'renderer', pathname)).toString())
  }
  const reImageFile = /\.(png|jpe?g|gif|webp|svg|ico|bmp|avif)$/i;
  registerProtocol(
    schemeFreeterFile,
    req => {
      const urlObj = new URL(req.url);
      if (urlObj.host === hostLocalFile) {
        // serves user-selected local images (project logos, custom icons);
        // restricted to image files
        const localPath = decodeURIComponent(urlObj.pathname.replace(/^\//, ''));
        if (!reImageFile.test(localPath)) {
          return new Response(null, { status: 403 });
        }
        return net.fetch(pathToFileURL(localPath).toString());
      }
      if (urlObj.host !== hostFreeterApp) {
        return new Response(null, { status: 404 });
      }
      return fetchAppFile(urlObj.pathname)
    }
  )
}
