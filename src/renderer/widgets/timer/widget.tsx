import { Button, ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { Settings } from './settings';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as styles from './widget.module.scss';
import { useAudioFile } from '@/widgets/timer/useAudioFile';
import { timerEndSoundFilesById } from '@/widgets/timer/audio/timer-end';

function padTime(time: number) {
  return ('0' + time).slice(-2);
}

function msecsToMMSS(msecs: number) {
  const secs = Math.floor(msecs / 1000);
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs - m * 60);
  return `${padTime(m)}:${padTime(s)}`;
}

function WidgetComp({settings}: WidgetReactComponentProps<Settings>) {
  const [endMsecs, setEndMsecs] = useState(0);
  const [startMsecs, setStartMsecs] = useState(0);
  const [mmss, setMmss] = useState('00:00');
  const notifiedRef = useRef(false);

  const isStopwatch = settings.mode === 'stopwatch';
  const totalMsecs = isStopwatch ? 0 : (settings.mins * 60000 + settings.customSecs * 1000);

  const endSound = useAudioFile(timerEndSoundFilesById[settings.endSound]?.path || '', settings.endSoundVol);

  const tick = useCallback(() => {
    if (isStopwatch) {
      const elapsed = Date.now() - startMsecs;
      setMmss(msecsToMMSS(elapsed));
      setMmss(msecsToMMSS(elapsed));
    } else {
      const msecsLeft = endMsecs - Date.now();
      if (msecsLeft <= 0) {
        setEndMsecs(0);
        if (!notifiedRef.current) {
          notifiedRef.current = true;
          endSound.play();
          if (settings.endDesktop && 'Notification' in window) {
            new Notification('Timer Complete', { body: 'Your timer has finished.' });
          }
        }
      } else {
        setMmss(msecsToMMSS(msecsLeft));
      }
    }
  }, [endMsecs, endSound, isStopwatch, startMsecs, settings.endDesktop]);

  useEffect(() => {
    if (isStopwatch) {
      if (startMsecs > 0) {
        const interval = setInterval(tick, 100);
        return () => clearInterval(interval);
      }
    } else {
      if (endMsecs > 0) {
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
      }
    }
    return undefined;
  }, [endMsecs, startMsecs, tick, isStopwatch]);

  const totalMmss = useMemo(() => msecsToMMSS(totalMsecs), [totalMsecs]);

  const start = useCallback(() => {
    if (isStopwatch) {
      setStartMsecs(Date.now());
      setMmss('00:00');
    } else {
      notifiedRef.current = false;
      setEndMsecs(Date.now() + totalMsecs + 500);
      setMmss(msecsToMMSS(totalMsecs));
    }
  }, [isStopwatch, totalMsecs]);

  const reset = useCallback(() => {
    setEndMsecs(0);
    setStartMsecs(0);
    setMmss(isStopwatch ? '00:00' : msecsToMMSS(totalMsecs));
    notifiedRef.current = false;
  }, [isStopwatch, totalMsecs]);

  const progressPercent = useMemo(() => {
    if (isStopwatch) {
      return 0;
    }
    if (endMsecs === 0) {
      return 0;
    }
    const remaining = Math.max(0, endMsecs - Date.now());
    return ((totalMsecs - remaining) / totalMsecs) * 100;
  }, [endMsecs, totalMsecs, isStopwatch]);

  const isRunning = isStopwatch ? startMsecs > 0 : endMsecs > 0;

  return (
    <div className={styles['timer-screen']}>
      <svg className={styles['progress-ring']} viewBox="0 0 100 100">
        <circle className={styles['progress-ring-bg']} cx="50" cy="50" r="45" />
        {!isStopwatch && (
          <circle
            className={styles['progress-ring-fill']}
            cx="50" cy="50" r="45"
            style={{
              strokeDasharray: `${2 * Math.PI * 45}`,
              strokeDashoffset: `${2 * Math.PI * 45 * (1 - progressPercent / 100)}`,
            }}
          />
        )}
      </svg>
      <div className={styles['timer-mmss']}>{mmss}</div>
      {!isRunning && (
        <Button onClick={start} caption={isStopwatch ? 'Start' : totalMmss} title='Start' size='Fill' className={styles['timer-button']} />
      )}
      {isRunning && (
        <Button caption='Reset' onClick={reset} size='M' />
      )}
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
