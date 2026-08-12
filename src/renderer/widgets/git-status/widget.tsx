/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { Settings } from './settings';
import { GitStatus, parseGitStatus } from './parse';
import { widgetSvg } from './icons';
import { SvgIcon } from '@/ui/components/basic/svgIcon';
import styles from './widget.module.scss';
import { useCallback, useEffect, useState } from 'react';

function WidgetComp({settings, widgetApi}: WidgetReactComponentProps<Settings>) {
  const { process } = widgetApi;
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!settings.repoPath) {
      return;
    }
    const res = await process.execFile('git', ['status', '--porcelain=v2', '--branch'], settings.repoPath);
    if (res.error || res.code !== 0) {
      setStatus(null);
      setError(res.stderr.trim() || res.error || 'git failed — is this a git repository?');
      return;
    }
    setError('');
    setStatus(parseGitStatus(res.stdout));
  }, [settings.repoPath, process]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, Math.max(15, settings.refreshSecs) * 1000);
    return () => clearInterval(interval);
  }, [refresh, settings.refreshSecs]);

  if (!settings.repoPath) {
    return <div className={styles['not-configured']}>{'Repository folder not specified'}</div>;
  }
  if (error) {
    return <div className={styles['error']} onClick={refresh} title='Click to retry'>{error}</div>;
  }
  if (!status) {
    return <div className={styles['not-configured']}>{'Loading…'}</div>;
  }

  const dirty = status.staged + status.unstaged + status.untracked;

  return (
    <div className={styles['git-status']} onClick={refresh} title='Click to refresh'>
      <div className={styles['branch-line']}>
        <SvgIcon svg={widgetSvg} />
        <span>{status.branch}</span>
      </div>
      <div className={styles['stat-row']}>
        {(status.ahead > 0 || status.behind > 0) && (
          <span className={styles['stat']}>{`↑${status.ahead} ↓${status.behind}`}</span>
        )}
        {dirty === 0
          ? <span className={styles['stat-clean']}>clean</span>
          : <>
            {status.staged > 0 && <span className={styles['stat-dirty']}>{`${status.staged} staged`}</span>}
            {status.unstaged > 0 && <span className={styles['stat-dirty']}>{`${status.unstaged} changed`}</span>}
            {status.untracked > 0 && <span className={styles['stat-dirty']}>{`${status.untracked} untracked`}</span>}
          </>
        }
      </div>
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
