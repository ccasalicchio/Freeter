/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import {
  mapIngestPayload, appendAlertEntries, parseAlertInboxData, entriesToNotify,
  timingSafeTokenEqual, findWidgetByIngestToken, createIngestRateLimiter, AlertEntry
} from '@/infra/mcpServer/ingest';
import { AppStateDoc } from '@/infra/mcpServer/mcpState';

const at = '2026-08-13T12:00:00.000Z';

function fixtureEntry(entry: Partial<AlertEntry>): AlertEntry {
  return { title: 'alert', body: '', severity: '', status: 'firing', at, ...entry };
}

function fixtureState(widgets: AppStateDoc['obj']['entities']['widgets']): AppStateDoc {
  return {
    ver: 2,
    obj: {
      entities: {
        projects: {},
        workflows: {},
        widgets
      },
      ui: {}
    }
  };
}

describe('mapIngestPayload', () => {
  it('maps a Grafana/Alertmanager webhook alerts array', () => {
    const payload = {
      status: 'firing',
      alerts: [
        {
          status: 'firing',
          labels: { alertname: 'HighCPU', severity: 'critical' },
          annotations: { summary: 'CPU above 90%' }
        },
        {
          status: 'resolved',
          labels: { alertname: 'DiskFull', severity: 'warning' },
          annotations: { description: 'Disk above 80%' }
        }
      ]
    };

    expect(mapIngestPayload(payload, at)).toEqual([
      { title: 'HighCPU', body: 'CPU above 90%', severity: 'critical', status: 'firing', at },
      { title: 'DiskFull', body: 'Disk above 80%', severity: 'warning', status: 'resolved', at }
    ]);
  })

  it('prefers summary over description and falls back to empty strings', () => {
    const [entry] = mapIngestPayload({
      alerts: [{
        labels: { alertname: 'A' },
        annotations: { summary: 'the summary', description: 'the description' }
      }]
    }, at);
    expect(entry.body).toBe('the summary');

    const [bare] = mapIngestPayload({ alerts: [{}] }, at);
    expect(bare).toEqual({ title: 'alert', body: '', severity: '', status: '', at });
  })

  it('accepts Alertmanager v2 object status ({state})', () => {
    const [entry] = mapIngestPayload({
      alerts: [{ labels: { alertname: 'A' }, status: { state: 'active' } }]
    }, at);
    expect(entry.status).toBe('active');
  })

  it('stores non-alerts payloads as one generic entry with a capped body', () => {
    const big = { note: 'x'.repeat(1000) };
    const entries = mapIngestPayload(big, at);
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe('webhook');
    expect(entries[0].body).toBe(JSON.stringify(big).slice(0, 500));
    expect(entries[0].status).toBe('');
  })
})

describe('appendAlertEntries', () => {
  it('prepends new entries (newest first) and bumps unread', () => {
    const prev = JSON.stringify({ entries: [fixtureEntry({ title: 'old' })], unread: 2 });
    const res = appendAlertEntries(prev, [fixtureEntry({ title: 'new' })]);
    expect(res.entries.map(e => e.title)).toEqual(['new', 'old']);
    expect(res.unread).toBe(3);
  })

  it('starts fresh on missing or malformed stored data', () => {
    expect(appendAlertEntries(undefined, [fixtureEntry({})])).toEqual({ entries: [fixtureEntry({})], unread: 1 });
    expect(appendAlertEntries('not json', [fixtureEntry({})]).unread).toBe(1);
    expect(appendAlertEntries('{"entries":"nope"}', []).entries).toEqual([]);
  })

  it('caps the ring buffer at 100 entries, dropping the oldest', () => {
    const prevEntries = Array.from({ length: 99 }, (_, i) => fixtureEntry({ title: `old${i}` }));
    const prev = JSON.stringify({ entries: prevEntries, unread: 0 });
    const res = appendAlertEntries(prev, [fixtureEntry({ title: 'newA' }), fixtureEntry({ title: 'newB' })]);
    expect(res.entries).toHaveLength(100);
    expect(res.entries[0].title).toBe('newA');
    expect(res.entries[1].title).toBe('newB');
    expect(res.entries[99].title).toBe('old97');
    expect(res.unread).toBe(2);
  })
})

describe('parseAlertInboxData', () => {
  it('sanitizes the unread counter', () => {
    expect(parseAlertInboxData(JSON.stringify({ entries: [], unread: -5 })).unread).toBe(0);
    expect(parseAlertInboxData(JSON.stringify({ entries: [] })).unread).toBe(0);
  })
})

describe('entriesToNotify', () => {
  it('notifies firing/active alerts and generic entries, not resolved ones', () => {
    const entries = [
      fixtureEntry({ title: 'f', status: 'firing' }),
      fixtureEntry({ title: 'r', status: 'resolved' }),
      fixtureEntry({ title: 'a', status: 'active' }),
      fixtureEntry({ title: 'g', status: '' })
    ];
    expect(entriesToNotify(entries).map(e => e.title)).toEqual(['f', 'a', 'g']);
  })

  it('caps notifications at 3 per request', () => {
    const entries = Array.from({ length: 5 }, (_, i) => fixtureEntry({ title: `f${i}` }));
    expect(entriesToNotify(entries)).toHaveLength(3);
  })
})

describe('timingSafeTokenEqual', () => {
  it('matches equal strings only', () => {
    expect(timingSafeTokenEqual('abc-123', 'abc-123')).toBe(true);
    expect(timingSafeTokenEqual('abc-123', 'abc-124')).toBe(false);
    expect(timingSafeTokenEqual('abc', 'abc-123')).toBe(false);
    expect(timingSafeTokenEqual('abc-123', 'abc')).toBe(false);
    expect(timingSafeTokenEqual('', '')).toBe(true);
    expect(timingSafeTokenEqual('', 'a')).toBe(false);
  })
})

describe('findWidgetByIngestToken', () => {
  const state = fixtureState({
    'W1': { id: 'W1', type: 'alert-inbox', coreSettings: { name: 'Inbox A' }, settings: { ingestToken: 'token-a', notifyDesktop: true } },
    'W2': { id: 'W2', type: 'alert-inbox', coreSettings: { name: 'Inbox B' }, settings: { ingestToken: 'token-b' } },
    'W3': { id: 'W3', type: 'note', coreSettings: { name: 'Note' }, settings: { ingestToken: 'token-c' } },
    'W4': { id: 'W4', type: 'alert-inbox', coreSettings: { name: 'No token' }, settings: { ingestToken: '' } }
  });

  it('finds the alert-inbox widget with the matching token', () => {
    expect(findWidgetByIngestToken(state, 'token-a')?.id).toBe('W1');
    expect(findWidgetByIngestToken(state, 'token-b')?.id).toBe('W2');
  })

  it('returns null for unknown tokens', () => {
    expect(findWidgetByIngestToken(state, 'nope')).toBeNull();
  })

  it('ignores non-alert-inbox widgets even when their settings hold the token', () => {
    expect(findWidgetByIngestToken(state, 'token-c')).toBeNull();
  })

  it('never matches widgets without a token, even for an empty request token', () => {
    expect(findWidgetByIngestToken(state, '')).toBeNull();
  })
})

describe('createIngestRateLimiter', () => {
  it('allows 10 requests per minute per token, then rejects', () => {
    const limiter = createIngestRateLimiter();
    const now = 1_000_000;
    for (let i = 0; i < 10; i++) {
      expect(limiter.allow('t1', now + i)).toBe(true);
    }
    expect(limiter.allow('t1', now + 100)).toBe(false);
  })

  it('tracks tokens independently', () => {
    const limiter = createIngestRateLimiter();
    const now = 1_000_000;
    for (let i = 0; i < 10; i++) {
      limiter.allow('t1', now);
    }
    expect(limiter.allow('t1', now)).toBe(false);
    expect(limiter.allow('t2', now)).toBe(true);
  })

  it('slides the window: hits expire after 60s', () => {
    const limiter = createIngestRateLimiter();
    const now = 1_000_000;
    for (let i = 0; i < 10; i++) {
      limiter.allow('t1', now);
    }
    expect(limiter.allow('t1', now + 59_999)).toBe(false);
    // 60s later the original 10 hits have left the window
    expect(limiter.allow('t1', now + 60_000)).toBe(true);
  })

  it('honors custom limits', () => {
    const limiter = createIngestRateLimiter(2, 1000);
    expect(limiter.allow('t', 0)).toBe(true);
    expect(limiter.allow('t', 1)).toBe(true);
    expect(limiter.allow('t', 2)).toBe(false);
    expect(limiter.allow('t', 1001)).toBe(true);
  })
})
