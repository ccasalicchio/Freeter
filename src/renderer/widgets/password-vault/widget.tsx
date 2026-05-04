import { Button, ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import * as styles from './widget.module.scss';
import { Settings } from './settings';
import { useCallback, useEffect, useState } from 'react';
import { VaultEntry } from '@/widgets/password-vault/state';

const dataKey = 'vault';

function WidgetComp(props: WidgetReactComponentProps<Settings>) {
  const {widgetApi} = props;
  const {dataStorage, safeStorage, clipboard} = widgetApi;
  const [isLoaded, setIsLoaded] = useState(false);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [nextEntryId, setNextEntryId] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', url: '', notes: '' });
  const [revealedPasswords, setRevealedPasswords] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const persist = useCallback(async (ents: VaultEntry[], nextId: number) => {
    setEntries(ents);
    setNextEntryId(nextId);
    await dataStorage.setJson(dataKey, { entries: ents, nextEntryId: nextId });
  }, [dataStorage]);

  useEffect(() => {
    (async () => {
      const loaded = await dataStorage.getJson(dataKey) as { entries: VaultEntry[]; nextEntryId: number } | undefined;
      if (loaded && Array.isArray(loaded.entries)) {
        setEntries(loaded.entries);
        setNextEntryId(loaded.nextEntryId);
      }
      setIsLoaded(true);
    })();
  }, [dataStorage]);

  const selectedEntry = selectedId !== null ? entries.find(e => e.id === selectedId) : null;

  const handleSelect = useCallback((id: number) => {
    setSelectedId(id);
    setShowForm(false);
  }, []);

  const handleNew = useCallback(() => {
    setSelectedId(null);
    setShowForm(true);
    setFormData({ name: '', username: '', password: '', url: '', notes: '' });
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.name || !formData.password) {
      return;
    }
    const encryptedPassword = await safeStorage.encryptString(formData.password);
    const newEntry: VaultEntry = {
      id: nextEntryId,
      name: formData.name,
      username: formData.username,
      encryptedPassword,
      url: formData.url,
      notes: formData.notes,
    };
    persist([...entries, newEntry], nextEntryId + 1);
    setShowForm(false);
    setSelectedId(newEntry.id);
  }, [formData, entries, nextEntryId, persist, safeStorage]);

  const handleDelete = useCallback(async (id: number) => {
    persist(entries.filter(e => e.id !== id), nextEntryId);
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [entries, nextEntryId, selectedId, persist]);

  const handleCopyPassword = useCallback(async (entry: VaultEntry) => {
    try {
      const plain = await safeStorage.decryptString(entry.encryptedPassword);
      await clipboard.writeText(plain);
      setTimeout(() => clipboard.writeText(''), 30000);
    } catch {
      // Password could not be decrypted
    }
  }, [safeStorage, clipboard]);

  const handleCopyUsername = useCallback(async (username: string) => {
    await clipboard.writeText(username);
  }, [clipboard]);

  const toggleReveal = useCallback((id: number) => {
    setRevealedPasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const [revealedPlain, setRevealedPlain] = useState<Record<number, string>>({});

  const handleRevealPassword = useCallback(async (entry: VaultEntry) => {
    if (revealedPasswords.has(entry.id)) {
      toggleReveal(entry.id);
      return;
    }
    try {
      const plain = await safeStorage.decryptString(entry.encryptedPassword);
      setRevealedPlain(prev => ({ ...prev, [entry.id]: plain }));
      toggleReveal(entry.id);
      setTimeout(() => {
        setRevealedPlain(prev => {
          const next = { ...prev };
          delete next[entry.id];
          return next;
        });
        toggleReveal(entry.id);
      }, 10000);
    } catch {
      // Could not decrypt
    }
  }, [safeStorage, revealedPasswords, toggleReveal]);

  const filteredEntries = searchQuery
    ? entries.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.url.toLowerCase().includes(searchQuery.toLowerCase()))
    : entries;

  if (!isLoaded) {
    return <div className={styles['empty-state']}>Loading Vault...</div>;
  }

  return (
    <div className={styles['viewport']}>
      <div className={styles['search-bar']}>
        <input type="text" placeholder="Search entries..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        <Button onClick={handleNew} caption="+ New" size="S" />
      </div>
      {filteredEntries.length === 0 && !showForm && (
        <div className={styles['empty-state']}>No entries. Click &ldquo;+ New&rdquo; to add one.</div>
      )}
      {filteredEntries.length > 0 && (
        <ul className={styles['entry-list']}>
          {filteredEntries.map(e => (
            <li key={e.id} className={styles['entry']} onClick={() => handleSelect(e.id)} data-widget-context={e.id}>
              <div className={styles['entry-info']}>
                <div className={styles['entry-name']}>{e.name}</div>
                <div className={styles['entry-username']}>{e.username}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {showForm && (
        <div className={styles['form-panel']}>
          <div className={styles['form-field']}>
            <div className={styles['form-label']}>Site Name *</div>
            <input className={styles['form-input']} placeholder="e.g. GitHub" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className={styles['form-field']}>
            <div className={styles['form-label']}>Username</div>
            <input className={styles['form-input']} placeholder="user@example.com" value={formData.username} onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))} />
          </div>
          <div className={styles['form-field']}>
            <div className={styles['form-label']}>Password *</div>
            <input className={styles['form-input']} type="password" placeholder="Enter password" value={formData.password} onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))} />
          </div>
          <div className={styles['form-field']}>
            <div className={styles['form-label']}>URL</div>
            <input className={styles['form-input']} placeholder="https://" value={formData.url} onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))} />
          </div>
          <div className={styles['form-field']}>
            <div className={styles['form-label']}>Notes</div>
            <input className={styles['form-input']} placeholder="Optional notes" value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} />
          </div>
          <div className={styles['form-actions']}>
            <Button onClick={handleSave} caption="Save" size="S" />
            <Button onClick={() => setShowForm(false)} caption="Cancel" size="S" />
          </div>
        </div>
      )}
      {selectedEntry && !showForm && (
        <div className={styles['detail-panel']}>
          <div className={styles['detail-field']}>
            <div className={styles['detail-label']}>Site Name</div>
            <div className={styles['detail-value']}>{selectedEntry.name}</div>
          </div>
          <div className={styles['detail-field']}>
            <div className={styles['detail-label']}>Username</div>
            <div className={styles['detail-value']}>{selectedEntry.username}</div>
          </div>
          <div className={styles['detail-field']}>
            <div className={styles['detail-label']}>Password</div>
            <div className={styles['detail-value']}>
              {revealedPasswords.has(selectedEntry.id) && revealedPlain[selectedEntry.id]
                ? revealedPlain[selectedEntry.id]
                : '••••••••'}
            </div>
          </div>
          {selectedEntry.url && (
            <div className={styles['detail-field']}>
              <div className={styles['detail-label']}>URL</div>
              <div className={styles['detail-value']}>{selectedEntry.url}</div>
            </div>
          )}
          {selectedEntry.notes && (
            <div className={styles['detail-field']}>
              <div className={styles['detail-label']}>Notes</div>
              <div className={styles['detail-value']}>{selectedEntry.notes}</div>
            </div>
          )}
          <div className={styles['detail-actions']}>
            <Button onClick={() => handleCopyUsername(selectedEntry.username)} caption="Copy Username" size="S" />
            <Button onClick={() => handleCopyPassword(selectedEntry)} caption="Copy Password" size="S" />
            <Button onClick={() => handleRevealPassword(selectedEntry)} caption={revealedPasswords.has(selectedEntry.id) ? 'Hide' : 'Reveal'} size="S" />
            <Button onClick={() => handleDelete(selectedEntry.id)} caption="Delete" size="S" />
          </div>
        </div>
      )}
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
