/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

/**
 * Pure helpers for the webhook ingest endpoint (POST /ingest/{token} on the
 * MCP HTTP listener): payload mapping, alert storage, per-token rate limiting
 * and timing-safe ingest-token lookup. Kept HTTP/Electron-free so they are
 * unit-testable.
 */

import { timingSafeEqual } from 'node:crypto';
import { AppStateDoc } from '@/infra/mcpServer/mcpState';

/** widget type id of the widget subscribing to ingest tokens */
export const alertInboxWidgetType = 'alert-inbox';

/** max stored entries per widget (ring buffer, newest first) */
export const maxAlertEntries = 100;

/** max chars of a generic (non-alerts) payload kept as the entry body */
export const maxGenericBodyChars = 500;

/** max desktop notifications shown per ingest request */
export const maxNotificationsPerRequest = 3;

export interface AlertEntry {
  title: string;
  body: string;
  severity: string;
  status: string;
  at: string;
}

export interface AlertInboxData {
  entries: AlertEntry[];
  unread: number;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Maps an ingest payload to alert entries. Payloads with an `alerts` array
 * (Grafana contact-point / Alertmanager webhook format) yield one entry per
 * alert; any other JSON yields a single generic entry with the payload
 * captured (truncated) as the body.
 */
export function mapIngestPayload(payload: unknown, at: string): AlertEntry[] {
  const alerts = asRecord(payload).alerts;
  if (Array.isArray(alerts)) {
    return alerts.map(alert => {
      const a = asRecord(alert);
      const labels = asRecord(a.labels);
      const annotations = asRecord(a.annotations);
      // Grafana/Alertmanager webhooks use a string status ('firing'/'resolved');
      // Alertmanager v2 API objects use {state}: accept both.
      const status = typeof a.status === 'string' ? a.status : asString(asRecord(a.status).state);
      return {
        title: asString(labels.alertname) || 'alert',
        body: asString(annotations.summary) || asString(annotations.description) || '',
        severity: asString(labels.severity),
        status,
        at
      };
    });
  }
  return [{
    title: 'webhook',
    body: JSON.stringify(payload).slice(0, maxGenericBodyChars),
    severity: '',
    status: '',
    at
  }];
}

export function parseAlertInboxData(json: string | undefined): AlertInboxData {
  if (json) {
    try {
      const parsed = JSON.parse(json) as Partial<AlertInboxData>;
      if (parsed !== null && typeof parsed === 'object' && Array.isArray(parsed.entries)) {
        return {
          entries: parsed.entries,
          unread: typeof parsed.unread === 'number' && parsed.unread >= 0 ? parsed.unread : 0
        };
      }
    } catch {
      // unreadable data: start a fresh inbox
    }
  }
  return { entries: [], unread: 0 };
}

/**
 * Prepends new entries to the stored inbox (newest first), capping the ring
 * buffer at `cap` entries and bumping the unread counter.
 */
export function appendAlertEntries(prevJson: string | undefined, newEntries: AlertEntry[], cap: number = maxAlertEntries): AlertInboxData {
  const prev = parseAlertInboxData(prevJson);
  return {
    entries: [...newEntries, ...prev.entries].slice(0, cap),
    unread: prev.unread + newEntries.length
  };
}

/**
 * Picks the entries worth a desktop notification: firing alerts
 * (status active/firing) and generic non-alerts payloads (empty status),
 * capped at `max` per request.
 */
export function entriesToNotify(entries: AlertEntry[], max: number = maxNotificationsPerRequest): AlertEntry[] {
  return entries
    .filter(e => e.status === 'firing' || e.status === 'active' || e.status === '')
    .slice(0, max);
}

/** Constant-time string comparison (padded buffers; length leaks only via padding cap). */
export function timingSafeTokenEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length, 1);
  const bufA = Buffer.alloc(len);
  const bufB = Buffer.alloc(len);
  bufA.write(a);
  bufB.write(b);
  return timingSafeEqual(bufA, bufB) && a.length === b.length;
}

export interface IngestTargetWidget {
  id: string;
  settings: Record<string, unknown>;
}

/**
 * Finds the alert-inbox widget whose `ingestToken` setting matches the
 * request token (timing-safe compare). Returns null when nothing matches;
 * widgets with an empty/unset token never match.
 */
export function findWidgetByIngestToken(state: AppStateDoc, token: string): IngestTargetWidget | null {
  if (token === '') {
    return null;
  }
  let found: IngestTargetWidget | null = null;
  for (const widget of Object.values(state.obj.entities.widgets)) {
    if (widget.type !== alertInboxWidgetType) {
      continue;
    }
    const ingestToken = widget.settings.ingestToken;
    if (typeof ingestToken !== 'string' || ingestToken === '') {
      continue;
    }
    // no early exit: compare every candidate to keep timing independent of match position
    if (timingSafeTokenEqual(token, ingestToken) && found === null) {
      found = { id: widget.id, settings: widget.settings };
    }
  }
  return found;
}

export interface IngestRateLimiter {
  /** true when the request is within the limit (and records the hit) */
  allow: (token: string, nowMs?: number) => boolean;
}

/**
 * Simple in-memory sliding-window rate limiter, keyed by token.
 * Default: 10 requests per 60s window.
 */
export function createIngestRateLimiter(limit = 10, windowMs = 60_000): IngestRateLimiter {
  const hits = new Map<string, number[]>();
  return {
    allow(token: string, nowMs: number = Date.now()): boolean {
      const recent = (hits.get(token) ?? []).filter(t => nowMs - t < windowMs);
      if (recent.length >= limit) {
        hits.set(token, recent);
        return false;
      }
      recent.push(nowMs);
      hits.set(token, recent);
      if (hits.size > 1000) {
        // bound memory against random-token floods
        for (const [key, times] of hits) {
          if (times.every(t => nowMs - t >= windowMs)) {
            hits.delete(key);
          }
        }
      }
      return true;
    }
  };
}
