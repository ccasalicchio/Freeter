import { debounce } from '@/widgets/helpers';
import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import styles from './widget.module.scss';
import { Settings } from './settings';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createContextMenuFactory, textAreaContextId } from '@/widgets/note/contextMenu';
import { createActionBarItems, NoteViewMode } from '@/widgets/note/actionBar';
import { CodeMirrorEditor } from '@/widgets/note/codeMirrorEditor';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import clsx from 'clsx';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

const keyNote = 'note';

function WidgetComp({widgetApi, settings}: WidgetReactComponentProps<Settings>) {
  const {updateActionBar, setContextMenuFactory, dataStorage} = widgetApi;
  const [isLoaded, setIsLoaded] = useState(false);
  const [note, setNote] = useState('');
  // runtime View/Edit toggle (action bar); null = follow settings.renderMode
  const [viewModeOverride, setViewModeOverride] = useState<NoteViewMode | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // text components open in rendered view by default; 'source' opts into the
  // editor. Split stays one toggle-click away rather than an entry state.
  const viewMode: NoteViewMode = viewModeOverride
    ?? (settings.renderMode === 'source' ? 'edit' : 'view');


  const previewClickHandler = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement | null)?.closest('a');
    const href = a?.getAttribute('href');
    if (href && /^(https?:|mailto:|file:)/i.test(href)) {
      e.preventDefault();
      widgetApi.shell.openExternalUrl(href);
    }
  }, [widgetApi]);

  const saveNote = useMemo(() => debounce((text: string) => dataStorage.setText(keyNote, text), 3000), [dataStorage]);

  const handleChange = useCallback((newNote: string) => {
    setNote(newNote);
    saveNote(newNote);
  }, [saveNote]);

  useEffect(() => {
    (async () => {
      const loaded = await dataStorage.getText(keyNote) || '';
      setNote(loaded);
      setIsLoaded(true);
    })();
  }, [dataStorage]);

  useEffect(() => {
    if (isLoaded) {
      updateActionBar(createActionBarItems(
        note,
        widgetApi,
        settings.markdown,
        viewMode,
        setViewModeOverride
      ));
      setContextMenuFactory(createContextMenuFactory(null, widgetApi));
    }
  }, [isLoaded, note, updateActionBar, setContextMenuFactory, widgetApi, settings.markdown, viewMode]);

  useEffect(() => {
    if (settings.markdown && viewMode !== 'edit' && previewRef.current) {
      const html = marked.parse(note) as string;
      previewRef.current.innerHTML = DOMPurify.sanitize(html);
      previewRef.current.querySelectorAll('pre code').forEach(el => {
        hljs.highlightElement(el as HTMLElement);
      });
    }
  }, [note, settings.markdown, viewMode]);

  if (!isLoaded) {
    return <div className={styles['loading']}>Loading Note...</div>;
  }

  if (settings.markdown && viewMode === 'view') {
    return (
      <div
        ref={previewRef}
        className={clsx(styles['preview'], styles[`style-${settings.contentStyle}`])}
        style={{ fontSize: settings.fontSize }}
        data-widget-context={textAreaContextId}
        onClick={previewClickHandler}
      />
    );
  }

  if (settings.markdown && viewMode === 'split') {
    return (
      <div className={styles['split-view']}>
        <div className={styles['split-editor']}>
          <CodeMirrorEditor
            value={note}
            onChange={handleChange}
          />
        </div>
        <div
          ref={previewRef}
          className={clsx(styles['split-preview'], styles[`style-${settings.contentStyle}`])}
          style={{ fontSize: settings.fontSize }}
          data-widget-context={textAreaContextId}
          onClick={previewClickHandler}
        />
      </div>
    );
  }

  return (
    <CodeMirrorEditor
      value={note}
      onChange={handleChange}
      className={styles['editor']}
    />
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
