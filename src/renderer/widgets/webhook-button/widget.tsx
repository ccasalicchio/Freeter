/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Button, ReactComponent, WidgetReactComponentProps, glyphsById } from '@/widgets/appModules';
import { Settings } from './settings';
import styles from './widget.module.scss';
import { useRef, useState } from 'react';

type SendState = 'idle' | 'sending' | 'ok' | 'error';

const stateColors: Partial<Record<SendState, string>> = {
  ok: '#46A758',
  error: '#E5484D',
};

function WidgetComp({settings, widgetApi}: WidgetReactComponentProps<Settings>) {
  const { http } = widgetApi;
  const [sendState, setSendState] = useState<SendState>('idle');
  const [lastResult, setLastResult] = useState('');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!settings.url) {
    return <div className={styles['not-configured']}>{'Webhook URL not specified'}</div>;
  }

  const fire = async () => {
    if (sendState === 'sending') {
      return;
    }
    setSendState('sending');
    const res = await http.request({
      url: settings.url,
      method: settings.method,
      headers: settings.body && settings.method !== 'GET' ? { 'Content-Type': 'application/json' } : undefined,
      body: settings.method !== 'GET' && settings.body ? settings.body : undefined,
    });
    setSendState(res.ok ? 'ok' : 'error');
    setLastResult(res.ok ? `${res.status} ${res.statusText}` : (res.error || `${res.status} ${res.statusText}`));
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }
    resetTimer.current = setTimeout(() => setSendState('idle'), 2500);
  };

  const glyphSvg = glyphsById[settings.glyph]?.svg;
  const color = stateColors[sendState] ?? (settings.glyphColor || undefined);

  return (
    <Button
      onClick={fire}
      iconSvg={glyphSvg}
      title={sendState === 'idle' ? 'Fire Webhook' : `Webhook: ${sendState}${lastResult ? ` (${lastResult})` : ''}`}
      size='Fill'
      disabled={sendState === 'sending'}
      style={color ? { color } : undefined}
    />
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
