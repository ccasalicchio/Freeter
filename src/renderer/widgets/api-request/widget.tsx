import { Button, ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import styles from './widget.module.scss';
import { Settings } from './settings';
import { useCallback, useEffect, useState } from 'react';
import { HttpMethod, ActiveRequest, SavedRequest } from '@/widgets/api-request/state';
import clsx from 'clsx';

const dataKey = 'api-requests';

const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

function WidgetComp(props: WidgetReactComponentProps<Settings>) {
  const {widgetApi} = props;
  const {dataStorage, http} = widgetApi;
  const [isLoaded, setIsLoaded] = useState(false);
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<ActiveRequest>({
    method: 'GET',
    url: '',
    headers: [],
    body: '',
  });
  const [response, setResponse] = useState<{ status: number; statusText: string; headers: string; body: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [selectedSavedId, setSelectedSavedId] = useState<number | null>(null);

  const persistRequests = useCallback(async (requests: SavedRequest[]) => {
    setSavedRequests(requests);
    await dataStorage.setJson(dataKey, { savedRequests: requests });
  }, [dataStorage]);

  useEffect(() => {
    (async () => {
      const loaded = await dataStorage.getJson(dataKey) as { savedRequests: SavedRequest[] } | undefined;
      if (loaded && Array.isArray(loaded.savedRequests)) {
        setSavedRequests(loaded.savedRequests);
      }
      setIsLoaded(true);
    })();
  }, [dataStorage]);

  const handleSend = useCallback(async () => {
    setIsSending(true);
    setResponse(null);
    try {
      const headers: Record<string, string> = {};
      for (const h of activeRequest.headers) {
        if (h.key.trim()) {
          headers[h.key.trim()] = h.value;
        }
      }
      // requests go through the main process: no renderer CSP/CORS limits
      const res = await http.request({
        url: activeRequest.url,
        method: activeRequest.method,
        headers,
        body: (activeRequest.method !== 'GET' && activeRequest.method !== 'DELETE') ? activeRequest.body : undefined,
      });
      if (res.error) {
        throw new Error(res.error);
      }
      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: '',
        body: res.body,
      });
    } catch (err) {
      setResponse({
        status: 0,
        statusText: 'Network Error',
        headers: '',
        body: String(err),
      });
    } finally {
      setIsSending(false);
    }
  }, [activeRequest, http]);

  const handleSaveCurrent = useCallback(() => {
    const name = prompt('Name this request:');
    if (!name) {
      return;
    }
    const newReq: SavedRequest = {
      id: Date.now(),
      name,
      method: activeRequest.method,
      url: activeRequest.url,
      headers: activeRequest.headers,
      body: activeRequest.body,
    };
    persistRequests([...savedRequests, newReq]);
    setSelectedSavedId(newReq.id);
  }, [activeRequest, savedRequests, persistRequests]);

  const handleLoad = useCallback((id: number) => {
    const req = savedRequests.find(r => r.id === id);
    if (req) {
      setActiveRequest({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
      });
      setSelectedSavedId(id);
    }
  }, [savedRequests]);

  const handleDelete = useCallback((id: number) => {
    const updated = savedRequests.filter(r => r.id !== id);
    persistRequests(updated);
    if (selectedSavedId === id) {
      setSelectedSavedId(null);
    }
  }, [savedRequests, selectedSavedId, persistRequests]);

  const updateHeader = useCallback((idx: number, key: string, value: string) => {
    setActiveRequest(prev => {
      const headers = [...prev.headers];
      headers[idx] = { key, value };
      return { ...prev, headers };
    });
  }, []);

  const addHeader = useCallback(() => {
    setActiveRequest(prev => ({ ...prev, headers: [...prev.headers, { key: '', value: '' }] }));
  }, []);

  const removeHeader = useCallback((idx: number) => {
    setActiveRequest(prev => ({ ...prev, headers: prev.headers.filter((_, i) => i !== idx) }));
  }, []);

  if (!isLoaded) {
    return <div className={styles['empty-state']}>Loading...</div>;
  }

  return (
    <div className={styles['viewport']}>
      <div className={styles['toolbar']}>
        <select className={styles['method-select']} value={activeRequest.method} onChange={e => setActiveRequest(prev => ({ ...prev, method: e.target.value as HttpMethod }))}>
          {methods.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input className={styles['url-input']} type="text" placeholder="https://api.example.com/endpoint" value={activeRequest.url} onChange={e => setActiveRequest(prev => ({ ...prev, url: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { handleSend(); } }} />
        <Button onClick={handleSend} caption={isSending ? '...' : 'Send'} size="S" />
        <Button onClick={handleSaveCurrent} caption="Save" size="S" />
        {savedRequests.length > 0 && (
          <>
            <select className={styles['saved-select']} value={selectedSavedId ?? ''} onChange={e => { const v = e.target.value; if (v) { handleLoad(Number(v)); } }}>
              <option value="">Load...</option>
              {savedRequests.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {selectedSavedId !== null && <Button onClick={() => handleDelete(selectedSavedId)} caption="Del" size="S" />}
          </>
        )}
      </div>
      <div className={styles['headers-section']}>
        <div className={styles['headers-label']}>Headers <Button onClick={addHeader} caption="+" size="S" /></div>
        {activeRequest.headers.map((h, i) => (
          <div key={i} className={styles['header-row']}>
            <input className={styles['header-input']} placeholder="Key" value={h.key} onChange={e => updateHeader(i, e.target.value, h.value)} />
            <input className={styles['header-input']} placeholder="Value" value={h.value} onChange={e => updateHeader(i, h.key, e.target.value)} />
            <Button onClick={() => removeHeader(i)} caption="×" size="S" />
          </div>
        ))}
      </div>
      {(activeRequest.method === 'POST' || activeRequest.method === 'PUT' || activeRequest.method === 'PATCH') && (
        <div className={styles['body-section']}>
          <div className={styles['body-label']}>Request Body</div>
          <textarea className={styles['body-textarea']} rows={3} value={activeRequest.body} onChange={e => setActiveRequest(prev => ({ ...prev, body: e.target.value }))} placeholder='{"key": "value"}' />
        </div>
      )}
      <div className={styles['response-section']}>
        {isSending && <div className={styles['loading']}>Sending...</div>}
        {!isSending && response && (
          <>
            <div className={clsx(styles['response-status'], response.status >= 200 && response.status < 300 ? styles['success'] : styles['error'])}>
              {response.status} {response.statusText}
            </div>
            {response.headers && <div className={styles['response-headers']}>{response.headers}</div>}
            <div className={styles['response-body']}>{response.body}</div>
          </>
        )}
        {!isSending && !response && (
          <div className={styles['empty-state']}>Enter a URL and click Send</div>
        )}
      </div>
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
