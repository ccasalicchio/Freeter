/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Button, ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { Settings } from './settings';
import { openLinkSvg } from '@/widgets/link-opener/icons';
import styles from './widget.module.scss';
import { useMemo, useState } from 'react';

function faviconUrl(url: string): string {
  try {
    return new URL('/favicon.ico', url).toString();
  } catch {
    return '';
  }
}

function WidgetComp({settings, widgetApi}: WidgetReactComponentProps<Settings>) {
  const { shell } = widgetApi;
  const [iconFailed, setIconFailed] = useState(false);

  const urls = settings.urls.filter(url=>url!=='');

  const iconUrl = useMemo(() => {
    if (iconFailed) {
      return '';
    }
    if (settings.iconMode === 'custom' && settings.customIcon) {
      return settings.customIcon;
    }
    if (settings.iconMode === 'favicon' && urls[0]) {
      return faviconUrl(urls[0]);
    }
    return '';
  }, [settings.iconMode, settings.customIcon, urls, iconFailed]);

  return urls.length>0
    ? <Button
        onClick={_ => urls.forEach(url => shell.openExternalUrl(url))}
        iconSvg={openLinkSvg}
        iconUrl={iconUrl || undefined}
        onIconError={() => setIconFailed(true)}
        title={`Open Link${urls.length>1 ? 's' : ''}`}
        size='Fill'
      />
    : <div className={styles['not-configured']}>
      {'URLs not specified'}
    </div>
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
