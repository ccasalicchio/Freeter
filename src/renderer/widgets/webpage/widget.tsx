import { Button, ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import * as styles from './widget.module.scss';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createActionBarItems } from '@/widgets/webpage/actionBar';
import { sanitizeUrl } from '@common/helpers/sanitizeUrl';
import { createContextMenuFactory } from '@/widgets/webpage/contextMenu';
import { ContextMenuEvent as ElectronContextMenuEvent } from 'electron';
import { createPartition } from '@/widgets/webpage/partition';
import { reload } from '@/widgets/webpage/actions';
import { WebpageExposedApi } from '@/widgets/interfaces';

interface WebviewProps extends WidgetReactComponentProps<Settings> {
  onRequireRestart: () => void;
}

function Webview({settings, widgetApi, onRequireRestart, env, id}: WebviewProps) {
  const {url, sessionScope, sessionPersist, autoReload, injectedCSS, injectedJS, userAgent} = settings;

  const partition = useMemo(() => createPartition(sessionPersist, sessionScope, env, id), [
    env, id, sessionScope, sessionPersist
  ])

  const initPartition = useRef(partition)
  const reqRestartIfChanged = useMemo(() => ([injectedJS, userAgent]), [injectedJS, userAgent])
  const initReqRestartIfChanged = useRef(reqRestartIfChanged)

  useEffect(() => {
    if(partition !== initPartition.current || reqRestartIfChanged !== initReqRestartIfChanged.current) {
      onRequireRestart();
    }
  }, [onRequireRestart, partition, reqRestartIfChanged])

  const {updateActionBar, setContextMenuFactory, exposeApi} = widgetApi;
  const webviewRef = useRef<Electron.WebviewTag>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [webviewIsReady, setWebviewIsReady] = useState(false);
  const [autoReloadStopped, setAutoReloadStopped] = useState(false);
  const [cssInDom, setCssInDom] = useState<[string, string]|null>(null);
  const [addressBarUrl, setAddressBarUrl] = useState(url);
  const [showFindBar, setShowFindBar] = useState(false);
  const [findText, setFindText] = useState('');
  const [zoomFactor, setZoomFactor] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [findMatches, setFindMatches] = useState(0);
  const [findActiveMatch, setFindActiveMatch] = useState(0);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);

  const sanitUrl = useMemo(() => sanitizeUrl(url), [url]);
  const sanitUA = useMemo(() => userAgent.trim(), [userAgent]);

  useEffect(() => {
    exposeApi<WebpageExposedApi>({
      openUrl: (url: string) => webviewRef.current?.loadURL(url),
      getUrl: () => url,
    })
  }, [exposeApi, url])

  useEffect(() => {
    setAddressBarUrl(url);
  }, [url]);

  const handleAddressBarSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const inputUrl = addressBarUrl.trim();
    if (inputUrl && webviewRef.current) {
      const sanitized = sanitizeUrl(inputUrl);
      if (sanitized) {
        webviewRef.current.loadURL(sanitized);
      }
    }
  }, [addressBarUrl]);

  const refreshActions = useCallback(
    () => updateActionBar(
      createActionBarItems(
        webviewIsReady ? webviewRef.current : null,
        widgetApi,
        url,
        autoReload,
        autoReloadStopped,
        setAutoReloadStopped,
        zoomFactor,
        isMuted,
        setZoomFactor,
        setIsMuted,
        () => { setShowFindBar(prev => !prev); if (!showFindBar) { setTimeout(() => findInputRef.current?.focus(), 100); } }
      )
    ),
    [autoReload, autoReloadStopped, updateActionBar, url, webviewIsReady, widgetApi, zoomFactor, isMuted, showFindBar]
  );

  useEffect(() => {
    refreshActions();
  }, [zoomFactor, isMuted, showFindBar, refreshActions]);

  const handleFind = useCallback((text: string) => {
    setFindText(text);
    const wv = webviewRef.current;
    if (!wv) {
      return;
    }
    if (text) {
      wv.findInPage(text, { findNext: true });
    } else {
      wv.stopFindInPage('clearSelection');
      setFindMatches(0);
      setFindActiveMatch(0);
    }
  }, []);

  const handleFindNext = useCallback(() => {
    if (findText && webviewRef.current) {
      webviewRef.current.findInPage(findText, { findNext: true });
    }
  }, [findText]);

  const handleFindPrev = useCallback(() => {
    if (findText && webviewRef.current) {
      webviewRef.current.findInPage(findText, { findNext: false, forward: false });
    }
  }, [findText]);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoomFactor + 0.25, 5);
    setZoomFactor(newZoom);
    webviewRef.current?.setZoomFactor(newZoom);
  }, [zoomFactor]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoomFactor - 0.25, 0.25);
    setZoomFactor(newZoom);
    webviewRef.current?.setZoomFactor(newZoom);
  }, [zoomFactor]);

  const handleToggleMute = useCallback(() => {
    const wv = webviewRef.current;
    if (wv) {
      const newMuted = !wv.isAudioMuted();
      wv.setAudioMuted(newMuted);
      setIsMuted(newMuted);
    }
  }, []);

  const injectCSSInDOM = useCallback(
    async (css: string, force: boolean) => {
      if(webviewIsReady) {
        if (!force && cssInDom && cssInDom[1] === css) {
          return;
        }
        const webviewEl = webviewRef.current;
        if (!webviewEl) {
          return;
        }
        const removeCss = cssInDom && cssInDom[0];
        if(css.trim()!=='') {
          const k = await webviewEl.insertCSS(css);
          setCssInDom([k, css]);
        } else {
          setCssInDom(null);
        }
        if(removeCss) {
          webviewEl.removeInsertedCSS(removeCss);
        }
      }
    },
    [cssInDom, webviewIsReady]
  )

  useEffect(() => {
    setContextMenuFactory(
      createContextMenuFactory(
        webviewIsReady ? webviewRef.current : null,
        widgetApi,
        url,
        autoReload,
        autoReloadStopped,
        setAutoReloadStopped
      )
    )
    return undefined;
  }, [setContextMenuFactory, webviewIsReady, widgetApi, url, autoReload, autoReloadStopped])

  useEffect(() => {
    const webviewEl = webviewRef.current;

    if (!webviewEl) {
      return undefined;
    }

    const handleDidStartLoading = () => {
      setIsLoading(true);
    }
    const handleDidStopLoading = () => {
      setIsLoading(false);
    }
    const handleContextMenu = (e: ElectronContextMenuEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const evt = new MouseEvent('contextmenu', {bubbles: true}) as ContextMenuEvent;
      evt.contextData = e.params;
      webviewEl.dispatchEvent(evt);
    }
    const handleFoundInPage = (e: Electron.FoundInPageEvent & { result: Electron.FoundInPageResult }) => {
      setFindMatches(e.result.matches);
      setFindActiveMatch(e.result.activeMatchOrdinal);
    };

    webviewEl.addEventListener('did-start-loading', handleDidStartLoading);
    webviewEl.addEventListener('did-stop-loading', handleDidStopLoading);
    webviewEl.addEventListener('context-menu', handleContextMenu);
    webviewEl.addEventListener('found-in-page', handleFoundInPage as EventListener);

    return () => {
      webviewEl.removeEventListener('did-start-loading', handleDidStartLoading);
      webviewEl.removeEventListener('did-stop-loading', handleDidStopLoading);
      webviewEl.removeEventListener('context-menu', handleContextMenu);
      webviewEl.removeEventListener('found-in-page', handleFoundInPage as EventListener);
    };
  }, []);

  useEffect(() => {
    injectCSSInDOM(injectedCSS, false);
  }, [injectedCSS, injectCSSInDOM]);

  useEffect(() => {
    refreshActions();

    const webviewEl = webviewRef.current;

    if (!webviewEl) {
      return undefined;
    }

    const handleDomReady = () => {
      setWebviewIsReady(true);
      refreshActions();
      injectCSSInDOM(injectedCSS, true);
      if (injectedJS) {
        webviewEl.executeJavaScript(injectedJS);
      }
    }
    const handleDidFinishLoad = () => {
      refreshActions();
    }
    const handleDidNavigate = () => {
      setAddressBarUrl(webviewEl.getURL());
      refreshActions();
    }
    const handleDidFrameNavigate = () => {
      refreshActions();
    }
    const handleDidNavigateInPage = () => {
      refreshActions();
    }

    webviewEl.addEventListener('dom-ready', handleDomReady);
    webviewEl.addEventListener('did-navigate', handleDidNavigate);
    webviewEl.addEventListener('did-frame-navigate', handleDidFrameNavigate);
    webviewEl.addEventListener('did-navigate-in-page', handleDidNavigateInPage);
    webviewEl.addEventListener('did-finish-load', handleDidFinishLoad);

    return () => {
      webviewEl.removeEventListener('dom-ready', handleDomReady);
      webviewEl.removeEventListener('did-navigate', handleDidNavigate);
      webviewEl.removeEventListener('did-frame-navigate', handleDidFrameNavigate);
      webviewEl.removeEventListener('did-navigate-in-page', handleDidNavigateInPage);
      webviewEl.removeEventListener('did-finish-load', handleDidFinishLoad);
    };
  }, [injectCSSInDOM, injectedCSS, injectedJS, refreshActions]);

  useEffect(() => {
    if (autoReload>0 && !autoReloadStopped) {
      const interval = setInterval(() => webviewRef.current && reload(webviewRef.current), autoReload*1000)
      return () => clearInterval(interval)
    }
    return undefined;
  }, [autoReload, autoReloadStopped])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setShowFindBar(true);
      setTimeout(() => findInputRef.current?.focus(), 100);
    }
    if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (webviewRef.current) {
        reload(webviewRef.current);
      }
    }
    if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      addressInputRef.current?.focus();
      addressInputRef.current?.select();
    }
  }, []);

  return (
    <div className={styles['webview-container']} onKeyDown={handleKeyDown} tabIndex={-1}>
      <form className={styles['address-bar']} onSubmit={handleAddressBarSubmit}>
        <input
          ref={addressInputRef}
          className={styles['address-input']}
          type="text"
          value={addressBarUrl}
          onChange={e => setAddressBarUrl(e.target.value)}
          placeholder="Enter URL..."
        />
      </form>
      {showFindBar && (
        <div className={styles['find-bar']}>
          <input
            ref={findInputRef}
            className={styles['find-input']}
            type="text"
            value={findText}
            onChange={e => handleFind(e.target.value)}
            placeholder="Find in page..."
          />
          <span className={styles['find-matches']}>{findActiveMatch}/{findMatches}</span>
          <Button onClick={handleFindPrev} caption="▲" size="S" />
          <Button onClick={handleFindNext} caption="▼" size="S" />
          <Button onClick={() => { setShowFindBar(false); setFindText(''); webviewRef.current?.stopFindInPage('clearSelection'); }} caption="×" size="S" />
        </div>
      )}
      <div className={styles['zoom-bar']}>
        <Button onClick={handleZoomOut} caption="−" size="S" />
        <span className={styles['zoom-level']}>{Math.round(zoomFactor * 100)}%</span>
        <Button onClick={handleZoomIn} caption="+" size="S" />
        <Button onClick={handleToggleMute} iconSvg={isMuted ? unmuteSvg : muteSvg} size="S" title={isMuted ? 'Unmute' : 'Mute'} />
      </div>
      <webview
        ref={webviewRef}
        // eslint-disable-next-line react/no-unknown-property
        allowpopups={'' as unknown as boolean}
        // eslint-disable-next-line react/no-unknown-property
        partition={initPartition.current}
        className={styles['webview']}
        tabIndex={0}
        src={sanitUrl !== '' ? sanitUrl : undefined}
        // eslint-disable-next-line react/no-unknown-property
        useragent={sanitUA !== '' ? sanitUA : undefined}
      ></webview>
      {isLoading && <div className={styles['loading']}>Loading...</div>}
    </div>
  )
}

export function WidgetComp(props: WidgetReactComponentProps<Settings>) {
  const {url} = props.settings;
  const [requireRestart, setRequireRestart] = useState(1);
  const doRestart = useCallback(() => setRequireRestart(requireRestart+1), [requireRestart])

  useEffect(()=> {
    if(!url) {
      const {updateActionBar, setContextMenuFactory} = props.widgetApi;
      setContextMenuFactory(createContextMenuFactory(null, props.widgetApi, url, 0, false, () => undefined));
      updateActionBar(createActionBarItems(null, props.widgetApi, url, 0, false, () => undefined, 1, false, () => {}, () => {}, () => {}));
    }
  }, [props.widgetApi, url]);

  return url ? (
    <Webview key={requireRestart} onRequireRestart={doRestart} {...props}></Webview>
  ) : (
    <div className={styles['not-configured']}>
      Webpage URL not specified.
    </div>
  )
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
