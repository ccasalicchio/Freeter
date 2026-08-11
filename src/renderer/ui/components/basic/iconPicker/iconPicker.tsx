/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import styles from './iconPicker.module.scss';
import clsx from 'clsx';
import { glyphs } from '@/ui/assets/images/glyphs';
import { SvgIcon } from '@/ui/components/basic/svgIcon';

/** preset icon colors (Freeter 1 heritage palette + theme default) */
export const iconColors: { id: string; name: string; value: string }[] = [
  { id: '', name: 'Theme default', value: '' },
  { id: 'red', name: 'Red', value: '#E5484D' },
  { id: 'orange', name: 'Orange', value: '#F76B15' },
  { id: 'yellow', name: 'Yellow', value: '#FFC53D' },
  { id: 'green', name: 'Green', value: '#46A758' },
  { id: 'cyan', name: 'Cyan', value: '#00A2C7' },
  { id: 'blue', name: 'Blue', value: '#0090FF' },
  { id: 'purple', name: 'Purple', value: '#8E4EC6' },
  { id: 'pink', name: 'Pink', value: '#D6409F' },
];

export interface IconPickerProps {
  glyphId: string;
  color: string;
  onSelectGlyph: (glyphId: string) => void;
  onSelectColor: (color: string) => void;
}

export function IconPicker({ glyphId, color, onSelectGlyph, onSelectColor }: IconPickerProps) {
  return (
    <div>
      <div className={styles['icon-grid']} role='listbox' aria-label='Icon'>
        {glyphs.map(g => (
          <button
            key={g.id}
            type='button'
            role='option'
            aria-selected={glyphId === g.id}
            title={g.name}
            className={clsx(styles['icon-cell'], glyphId === g.id && styles['is-selected'])}
            style={color ? { color } : undefined}
            onClick={() => onSelectGlyph(g.id)}
          >
            <SvgIcon svg={g.svg} />
          </button>
        ))}
      </div>
      <div className={styles['color-row']} role='listbox' aria-label='Icon Color'>
        {iconColors.map(c => (
          <button
            key={c.id}
            type='button'
            role='option'
            aria-selected={color === c.value}
            title={c.name}
            className={clsx(styles['color-cell'], color === c.value && styles['is-selected'])}
            style={{ background: c.value || 'var(--freeter-componentColor)' }}
            onClick={() => onSelectColor(c.value)}
          />
        ))}
        <input
          type='color'
          title='Custom color'
          value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#888888'}
          onChange={e => onSelectColor(e.target.value)}
        />
      </div>
    </div>
  );
}
