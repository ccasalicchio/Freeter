import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as styles from './commandPalette.module.scss';

export interface PaletteItem {
  id: string;
  label: string;
  description: string;
  type: 'project' | 'workflow' | 'action';
  action: () => void;
}

export interface CommandPaletteProps {
  items: PaletteItem[];
  onClose: () => void;
}

export function CommandPalette({ items, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(item =>
      item.label.toLowerCase().includes(lower) ||
      item.description.toLowerCase().includes(lower)
    );
  }, [items, search]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIdx]) {
      e.preventDefault();
      filtered[selectedIdx].action();
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [filtered, selectedIdx, onClose]);

  return (
    <div className={styles['overlay']} onClick={onClose}>
      <div className={styles['palette']} onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          className={styles['search-input']}
          type="text"
          placeholder="Search projects, workflows, actions..."
          value={search}
          onChange={e => { setSearch(e.target.value); setSelectedIdx(0); }}
          onKeyDown={handleKeyDown}
        />
        <div className={styles['results']}>
          {filtered.map((item, i) => (
            <div
              key={item.id}
              className={clsx(styles['result-item'], i === selectedIdx && styles['selected'])}
              onClick={() => { item.action(); onClose(); }}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              <div className={styles['result-label']}>{item.label}</div>
              <div className={styles['result-desc']}>{item.description}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className={styles['no-results']}>No matching items</div>
          )}
        </div>
      </div>
    </div>
  );
}
