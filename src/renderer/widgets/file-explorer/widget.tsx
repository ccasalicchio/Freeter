/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { FsDirEntry } from '@common/base/fsEntries';
import { Settings } from './settings';
import styles from './widget.module.scss';
import { useCallback, useEffect, useState } from 'react';

function getSep(path: string): string {
  return path.includes('\\') ? '\\' : '/';
}

function joinPath(base: string, name: string): string {
  const sep = getSep(base);
  return base.endsWith(sep) ? base + name : base + sep + name;
}

function getBaseName(path: string): string {
  const sep = getSep(path);
  const parts = path.split(sep).filter(part => part !== '');
  return parts[parts.length - 1] || path;
}

export function humanSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB'];
  let val = size / 1024;
  let i = 0;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val >= 10 ? Math.round(val) : Math.round(val * 10) / 10} ${units[i]}`;
}

const dirIcon = (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <path d='M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2' />
  </svg>
)

const fileIcon = (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <path d='M14 3v4a1 1 0 0 0 1 1h4' />
    <path d='M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z' />
  </svg>
)

const upIcon = (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <path d='M12 5l0 14' />
    <path d='M18 11l-6 -6' />
    <path d='M6 11l6 -6' />
  </svg>
)

function WidgetComp({ settings, widgetApi }: WidgetReactComponentProps<Settings>) {
  const { fs, shell } = widgetApi;
  const [subDirs, setSubDirs] = useState<string[]>([]);
  const [entries, setEntries] = useState<FsDirEntry[] | null>(null);
  const [error, setError] = useState('');

  const currentPath = subDirs.reduce(joinPath, settings.folderPath);

  useEffect(() => {
    setSubDirs([]);
  }, [settings.folderPath]);

  const refresh = useCallback(async () => {
    if (!currentPath) {
      return;
    }
    const res = await fs.listDir(currentPath);
    if (!res.ok || !res.entries) {
      setEntries(null);
      setError(res.error || 'Unable to read the folder');
      return;
    }
    setError('');
    setEntries(res.entries);
  }, [currentPath, fs]);

  useEffect(() => {
    refresh();
    if (settings.refreshSecs > 0) {
      const interval = setInterval(refresh, Math.max(5, settings.refreshSecs) * 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [refresh, settings.refreshSecs]);

  if (!settings.folderPath) {
    return <div className={styles['not-configured']}>{'Folder not specified'}</div>;
  }

  const visibleEntries = (entries || [])
    .filter(entry => settings.showHidden || !entry.name.startsWith('.'));
  if (settings.sortBy === 'modified') {
    visibleEntries.sort((a, b) => (a.isDir === b.isDir) ? b.mtimeMs - a.mtimeMs : (a.isDir ? -1 : 1));
  }

  return (
    <div className={styles['file-explorer']}>
      <div className={styles['header']}>
        <span className={styles['folder-name']} title={currentPath}>{getBaseName(currentPath)}</span>
        <button
          type='button'
          className={styles['header-btn']}
          title='Refresh'
          onClick={refresh}
        >⟳</button>
        <button
          type='button'
          className={styles['header-btn']}
          title='Open Folder'
          onClick={() => shell.openPath(currentPath)}
        >⧉</button>
      </div>
      {error
        ? <div className={styles['error']} onClick={refresh} title='Click to retry'>{error}</div>
        : entries === null
          ? <div className={styles['not-configured']}>{'Loading…'}</div>
          : <ul className={styles['entry-list']}>
            {subDirs.length > 0 && (
              <li
                className={styles['entry']}
                title='Up'
                onClick={() => setSubDirs(subDirs.slice(0, -1))}
              >
                <span className={styles['entry-icon']}>{upIcon}</span>
                <span className={styles['entry-name']}>..</span>
              </li>
            )}
            {visibleEntries.map(entry => (
              <li
                key={entry.name}
                className={styles['entry']}
                title={entry.name}
                onClick={() => {
                  if (entry.isDir) {
                    setSubDirs([...subDirs, entry.name]);
                  } else {
                    shell.openPath(joinPath(currentPath, entry.name));
                  }
                }}
              >
                <span className={styles['entry-icon']}>{entry.isDir ? dirIcon : fileIcon}</span>
                <span className={styles['entry-name']}>{entry.name}</span>
                {!entry.isDir && <span className={styles['entry-size']}>{humanSize(entry.size)}</span>}
              </li>
            ))}
            {visibleEntries.length === 0 && (
              <li className={styles['entry-empty']}>{'Empty folder'}</li>
            )}
          </ul>
      }
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
