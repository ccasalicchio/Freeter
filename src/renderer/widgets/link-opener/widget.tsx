/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Button, ReactComponent, WidgetReactComponentProps, glyphsById } from '@/widgets/appModules';
import { Settings } from './settings';
import { openLinkSvg } from '@/widgets/link-opener/icons';
import styles from './widget.module.scss';
import { useMemo, useState } from 'react';
import { resolveImageSrc } from '@/base/imageSrc';
import { faviconUrl } from '@common/infra/network';

// max mini-favicons shown on a multi-URL tile (2x2 grid)
const maxGridFavicons = 4;

function WidgetComp({settings, widgetApi}: WidgetReactComponentProps<Settings>) {
  const { shell } = widgetApi;
  const [failedIcons, setFailedIcons] = useState<string[]>([]);
  const markIconFailed = (iconUrl: string) =>
    setFailedIcons(prev => prev.includes(iconUrl) ? prev : [...prev, iconUrl]);

  const urls = settings.urls.filter(url=>url!=='');

  // single icon for the tile: a custom image, or the favicon of a single URL
  const iconUrl = useMemo(() => {
    if (settings.iconMode === 'custom' && settings.customIcon) {
      return resolveImageSrc(settings.customIcon);
    }
    if (settings.iconMode === 'favicon' && urls.length === 1) {
      return faviconUrl(urls[0]);
    }
    return '';
  }, [settings.iconMode, settings.customIcon, urls]);
  const effectiveIconUrl = iconUrl !== '' && !failedIcons.includes(iconUrl) ? iconUrl : '';

  // multi-URL favicon tiles show each URL's own favicon (up to 4, in a 2x2 grid)
  const gridFaviconUrls = useMemo(
    () => settings.iconMode === 'favicon' && urls.length > 1
      ? urls.slice(0, maxGridFavicons).map(faviconUrl).filter(u => u !== '' && !failedIcons.includes(u))
      : [],
    [settings.iconMode, urls, failedIcons]
  );

  const glyphSvg = settings.iconMode === 'glyph' ? glyphsById[settings.glyph]?.svg : undefined;

  return urls.length>0
    ? <Button
        onClick={_ => urls.forEach(url => settings.browserPath
          ? shell.openApp(settings.browserPath, [url])
          : shell.openExternalUrl(url))}
        iconSvg={glyphSvg || openLinkSvg}
        iconUrl={effectiveIconUrl || undefined}
        iconNode={gridFaviconUrls.length > 0
          ? <span className={styles['favicon-grid']}>
              {gridFaviconUrls.map((u, i) => (
                <img key={i} src={u} alt='' onError={() => markIconFailed(u)} />
              ))}
            </span>
          : undefined}
        onIconError={() => iconUrl !== '' && markIconFailed(iconUrl)}
        title={`Open Link${urls.length>1 ? 's' : ''}`}
        size='Fill'
        style={settings.iconMode === 'glyph' && settings.glyphColor ? { color: settings.glyphColor } : undefined}
      />
    : <div className={styles['not-configured']}>
      {'URLs not specified'}
    </div>
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
