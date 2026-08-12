/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { githubApiRequest } from '@/widgets/helpers';
import { Settings } from './settings';
import styles from './widget.module.scss';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';

interface Run {
  id: number;
  name: string;
  head_branch: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  run_number: number;
}

function statusInfo(run: Run): { char: string; cls: string } {
  if (run.status !== 'completed') {
    return { char: '●', cls: 'status-running' };
  }
  if (run.conclusion === 'success') {
    return { char: '✓', cls: 'status-success' };
  }
  if (run.conclusion === 'failure') {
    return { char: '✕', cls: 'status-failure' };
  }
  return { char: '○', cls: 'status-neutral' };
}

function WidgetComp({settings, widgetApi}: WidgetReactComponentProps<Settings>) {
  const { http, shell } = widgetApi;
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!settings.repo) {
      return;
    }
    const branch = settings.branch ? `&branch=${encodeURIComponent(settings.branch)}` : '';
    const res = await githubApiRequest(http, `/repos/${settings.repo}/actions/runs?per_page=8${branch}`, settings.token);
    if (!res.ok) {
      setError(res.error);
      setRuns(null);
      return;
    }
    setError('');
    setRuns(((res.data as { workflow_runs?: Run[] }).workflow_runs ?? []).slice(0, 8));
  }, [settings.repo, settings.branch, settings.token, http]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, Math.max(60, settings.refreshSecs) * 1000);
    return () => clearInterval(interval);
  }, [refresh, settings.refreshSecs]);

  if (!settings.repo) {
    return <div className={styles['not-configured']}>{'Repository not specified'}</div>;
  }
  if (error) {
    return <div className={styles['error']} onClick={refresh} title='Click to retry'>{error}</div>;
  }
  if (!runs) {
    return <div className={styles['not-configured']}>{'Loading…'}</div>;
  }
  if (runs.length === 0) {
    return <div className={styles['not-configured']}>{'No workflow runs'}</div>;
  }

  return (
    <div className={styles['list']} title='Click a run to open it on GitHub'>
      {runs.map(run => {
        const st = statusInfo(run);
        return (
          <div key={run.id} className={styles['row']} onClick={() => shell.openExternalUrl(run.html_url)}>
            <span className={clsx(styles['status'], styles[st.cls])}>{st.char}</span>
            <span className={styles['title']}>{run.name}</span>
            <span className={styles['meta']}>{`#${run.run_number} · ${run.head_branch}`}</span>
          </div>
        );
      })}
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
