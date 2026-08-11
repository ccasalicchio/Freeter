import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import styles from './widget.module.scss';
import { Settings } from './settings';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

const dataKey = 'code';

const langMap: Record<string, string> = {
  typescript: 'typescript',
  javascript: 'javascript',
  python: 'python',
  rust: 'rust',
  go: 'go',
  sql: 'sql',
  bash: 'bash',
  json: 'json',
  yaml: 'yaml',
  html: 'html',
  css: 'css',
  csharp: 'csharp',
  java: 'java',
};

function WidgetComp(props: WidgetReactComponentProps<Settings>) {
  const {dataStorage, clipboard} = props.widgetApi;
  const {settings, widgetApi} = props;
  const [isLoaded, setIsLoaded] = useState(false);
  const [code, setCode] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (async () => {
      const loaded = await dataStorage.getText(dataKey);
      if (loaded !== undefined) {
        setCode(loaded);
      }
      setIsLoaded(true);
    })();
  }, [dataStorage]);

  const saveCode = useCallback(async (val: string) => {
    setCode(val);
    await dataStorage.setText(dataKey, val);
  }, [dataStorage]);

  const handleCopy = useCallback(async () => {
    await clipboard.writeText(code);
  }, [clipboard, code]);

  useEffect(() => {
    if (isLoaded) {
      widgetApi.updateActionBar([
        {
          id: 'EDIT',
          title: isEditing ? 'View Highlighted' : 'Edit',
          enabled: true,
          icon: '',
          doAction: async () => setIsEditing(prev => !prev),
        },
        {
          id: 'COPY',
          title: 'Copy to Clipboard',
          enabled: !!code,
          icon: '',
          doAction: async () => handleCopy(),
        },
      ]);
    }
  }, [isLoaded, code, handleCopy, widgetApi, isEditing]);

  const highlightedHtml = useMemo(() => {
    if (!code) {
      return '';
    }
    const lang = langMap[settings.language] || 'plaintext';
    try {
      const result = hljs.highlight(code, { language: lang });
      return result.value;
    } catch {
      return code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }, [code, settings.language]);

  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  if (!isLoaded) {
    return <div className={styles['empty-state']}>Loading Code Snippet...</div>;
  }

  return (
    <div className={styles['viewport']}>
      <div className={styles['editor-area']}>
        {settings.showLineNumbers && (
          <div className={styles['line-numbers']}>
            {lineNumbers.map(n => <div key={n} className={styles['line-num']}>{n}</div>)}
          </div>
        )}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className={clsx(styles['code-input'], settings.wrapLines && styles['wrap'])}
            value={code}
            onChange={e => saveCode(e.target.value)}
            placeholder="// Type or paste your code here..."
            spellCheck={false}
          />
        ) : (
          <div
            className={clsx(styles['highlighted-code'], settings.wrapLines && styles['wrap'])}
            onClick={() => setIsEditing(true)}
          >
            <pre><code dangerouslySetInnerHTML={{ __html: highlightedHtml }} /></pre>
          </div>
        )}
      </div>
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
