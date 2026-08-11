/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './findBar.module.scss';
import { Button } from '@/ui/components/basic/button';
import { FindInPageProvider } from '@/infra/findInPageProvider/findInPageProvider';

type Deps = {
  findInPageProvider: FindInPageProvider;
}

export function createFindBarComponent({ findInPageProvider }: Deps) {
  function FindBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const close = useCallback(() => {
      setIsOpen(false);
      findInPageProvider.stop();
    }, []);

    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
          // let CodeMirror's own search panel handle Ctrl+F inside editors
          const target = e.target as HTMLElement | null;
          if (target?.closest('.cm-editor')) {
            return;
          }
          e.preventDefault();
          setIsOpen(true);
          setTimeout(() => inputRef.current?.select(), 0);
        } else if (e.key === 'Escape' && isOpen) {
          close();
        }
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, close]);

    if (!isOpen) {
      return null;
    }

    return (
      <div className={styles['find-bar']} role='search'>
        <input
          ref={inputRef}
          type='text'
          value={text}
          placeholder='Find on page'
          aria-label='Find on page'
          onChange={e => {
            setText(e.target.value);
            if (e.target.value) {
              findInPageProvider.find(e.target.value, true, false);
            } else {
              findInPageProvider.stop();
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && text) {
              findInPageProvider.find(text, !e.shiftKey, true);
            }
          }}
        />
        <Button caption='↑' title='Previous Match' size='S' onClick={() => text && findInPageProvider.find(text, false, true)} />
        <Button caption='↓' title='Next Match' size='S' onClick={() => text && findInPageProvider.find(text, true, true)} />
        <Button caption='✕' title='Close (Esc)' size='S' onClick={close} />
      </div>
    );
  }
  return FindBar;
}
