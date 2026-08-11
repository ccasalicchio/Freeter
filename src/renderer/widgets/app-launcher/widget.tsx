/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Button, ReactComponent, WidgetReactComponentProps, glyphsById } from '@/widgets/appModules';
import { Settings } from './settings';
import styles from './widget.module.scss';
import { useState } from 'react';

/** splits an args string honoring double-quoted segments */
export function parseArgs(args: string): string[] {
  const result: string[] = [];
  const re = /"([^"]*)"|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(args)) !== null) {
    result.push(m[1] ?? m[2]);
  }
  return result;
}

function WidgetComp({settings, widgetApi}: WidgetReactComponentProps<Settings>) {
  const { shell } = widgetApi;
  const [iconFailed, setIconFailed] = useState(false);

  if (!settings.appPath) {
    return <div className={styles['not-configured']}>{'Application not specified'}</div>;
  }

  const glyphSvg = glyphsById[settings.glyph]?.svg;
  const iconUrl = (!iconFailed && settings.customIcon) ? settings.customIcon : undefined;

  return (
    <Button
      onClick={_ => shell.openApp(settings.appPath, parseArgs(settings.args))}
      iconSvg={glyphSvg}
      iconUrl={iconUrl}
      onIconError={() => setIconFailed(true)}
      title={`Launch Application`}
      size='Fill'
      style={settings.glyphColor ? { color: settings.glyphColor } : undefined}
    />
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
