/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { githubApiRequest } from '@/widgets/helpers';
import { Settings } from './settings';
import styles from './widget.module.scss';
import { useCallback, useEffect, useState } from 'react';

interface Pr {
  number: number;
  title: string;
  html_url: string;
  draft: boolean;
  user: { login: string };
}

function WidgetComp({settings, widgetApi}: WidgetReactComponentProps<Settings>) {
  const { http, shell } = widgetApi;
  const [prs, setPrs] = useState<Pr[] | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!settings.repo) {
      return;
    }
    const res = await githubApiRequest(http, `/repos/${settings.repo}/pulls?state=open&per_page=10`, settings.token);
    if (!res.ok) {
      setError(res.error);
      setPrs(null);
      return;
    }
    setError('');
    setPrs(res.data as Pr[]);
  }, [settings.repo, settings.token, http]);

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
  if (!prs) {
    return <div className={styles['not-configured']}>{'Loading…'}</div>;
  }
  if (prs.length === 0) {
    return <div className={styles['not-configured']}>{'No open pull requests'}</div>;
  }

  return (
    <div className={styles['list']} title='Click a pull request to open it on GitHub'>
      {prs.map(pr => (
        <div key={pr.number} className={styles['row']} onClick={() => shell.openExternalUrl(pr.html_url)}>
          <span className={styles['status']}>{pr.draft ? '◌' : '⬤'}</span>
          <span className={styles['title']}>{pr.title}</span>
          <span className={styles['meta']}>{`#${pr.number} · ${pr.user.login}`}</span>
        </div>
      ))}
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
