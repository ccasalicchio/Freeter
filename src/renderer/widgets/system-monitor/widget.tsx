import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import styles from './widget.module.scss';
import { Settings } from './settings';
import { useCallback, useEffect, useRef, useState } from 'react';

const maxSparklinePoints = 60;

interface DataPoint {
  cpu: number;
  mem: number;
}

function WidgetComp({widgetApi, settings}: WidgetReactComponentProps<Settings>) {
  const {process} = widgetApi;
  const [data, setData] = useState<DataPoint[]>([]);
  const [latest, setLatest] = useState<DataPoint>({cpu: 0, mem: 0});
  const mountedRef = useRef(true);

  const tick = useCallback(async () => {
    if (!mountedRef.current) {
      return;
    }
    try {
      const metrics = await process.getSystemMetrics();
      const point: DataPoint = {
        cpu: metrics.cpuUsage,
        mem: metrics.memUsagePercent,
      };
      setLatest(point);
      setData(prev => {
        const next = [...prev, point];
        if (next.length > maxSparklinePoints) {
          return next.slice(next.length - maxSparklinePoints);
        }
        return next;
      });
    } catch { /* ignore */ }
  }, [process]);

  useEffect(() => {
    mountedRef.current = true;
    tick();
    const interval = setInterval(tick, settings.updateIntervalSec * 1000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [tick, settings.updateIntervalSec]);

  const sparklinePath = (values: number[], maxVal: number, w: number, h: number): string => {
    if (values.length < 2) {
      return '';
    }
    const stepX = w / (values.length - 1);
    return values.map((v, i) => {
      const x = i * stepX;
      const y = h - (v / maxVal) * h;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  };

  const svgW = 200;
  const svgH = 40;

  return (
    <div className={styles['viewport']}>
      {settings.showCpu && (
        <div className={styles['metric']}>
          <div className={styles['metric-header']}>
            <span className={styles['metric-label']}>CPU</span>
            <span className={styles['metric-value']}>{latest.cpu}%</span>
          </div>
          <div className={styles['metric-bar-bg']}>
            <div className={`${styles['metric-bar-fill']} ${styles['cpu']}`} style={{width: `${latest.cpu}%`}} />
          </div>
          {data.length > 1 && (
            <div className={styles['sparkline-container']}>
              <svg className={styles['sparkline-svg']} viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none">
                <path d={sparklinePath(data.map(d => d.cpu), 100, svgW, svgH)} fill="none" stroke="#4e9af1" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          )}
        </div>
      )}
      {settings.showMem && (
        <div className={styles['metric']}>
          <div className={styles['metric-header']}>
            <span className={styles['metric-label']}>Memory</span>
            <span className={styles['metric-value']}>{latest.mem}%</span>
          </div>
          <div className={styles['metric-bar-bg']}>
            <div className={`${styles['metric-bar-fill']} ${styles['mem']}`} style={{width: `${latest.mem}%`}} />
          </div>
          {data.length > 1 && (
            <div className={styles['sparkline-container']}>
              <svg className={styles['sparkline-svg']} viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none">
                <path d={sparklinePath(data.map(d => d.mem), 100, svgW, svgH)} fill="none" stroke="#2ecc71" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          )}
        </div>
      )}
      {!settings.showCpu && !settings.showMem && (
        <div className={styles['empty-state']}>No metrics selected</div>
      )}
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
