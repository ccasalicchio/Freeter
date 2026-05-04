import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import * as styles from './widget.module.scss';
import { Settings } from './settings';
import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

const dataKey = 'code';

function WidgetComp(props: WidgetReactComponentProps<Settings>) {
  const {dataStorage, clipboard} = props.widgetApi;
  const {settings, widgetApi} = props;
  const [isLoaded, setIsLoaded] = useState(false);
  const [code, setCode] = useState('');
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
      widgetApi.updateActionBar([{
        id: 'COPY',
        title: 'Copy to Clipboard',
        enabled: !!code,
        icon: '',
        doAction: async () => handleCopy()
      }]);
    }
  }, [isLoaded, code, handleCopy, widgetApi]);

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
        <textarea
          ref={textareaRef}
          className={clsx(styles['code-input'], settings.wrapLines && styles['wrap'])}
          value={code}
          onChange={e => saveCode(e.target.value)}
          placeholder="// Type or paste your code here..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
