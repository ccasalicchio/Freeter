# Monitoring & Reporting Integrations — Spec and Plan

Integrating Freeter with Grafana, Prometheus, and other monitoring/reporting
tools, so dashboards can show live health of externally connected apps.

Status: **specced, not started** · Author: v3 upgrade effort · Date: 2026-08-12

---

## 1. Why Freeter is a good fit (validated against the current architecture)

| Existing capability | Why it matters here |
|---|---|
| `http` widget API — requests run in the **main process** (`src/main/controllers/httpRequest.ts`) | No CORS/CSP limits. Prometheus/Grafana/Alertmanager APIs are directly callable — browsers can't do this without a proxy. Supports `timeoutMs`. |
| `safeStorage` widget API (OS keychain encryption; used by password-vault) | API tokens/service-account keys stored encrypted per widget, never in plaintext JSON. |
| **HTTP Monitor widget** (shipped 2026-08-12) | Established the poll-loop + status-dot + history-strip pattern all monitor widgets reuse. |
| Webpage widget (webview) | Fallback path for iframe-embedding full Grafana dashboards. |
| MCP server (own HTTP listener in main, bearer auth, stateless) | Reusable listener pattern for an inbound **webhook ingest** endpoint (alerts pushed *to* Freeter). |
| `dataStorage` per widget | Persist metric history/last-known state across restarts. |

**Gap to fill once, shared by all these widgets:** a tiny chart renderer.
Phase A ships an inline-SVG `Sparkline`/`BarStrip` helper (no dependency);
if richer charts are needed later, add **uPlot** (~45 KB, MIT) — not before.

---

## 2. Widget specs

### Phase A — foundations + Prometheus (highest value, zero server-side setup)

**A1. `prometheus-stat` — Prometheus Query widget** — ✅ shipped (2026-08-13)
- Settings: `baseUrl`, `query` (PromQL), `mode: 'instant' | 'range'`,
  `rangeMinutes` (default 60), `refreshSecs` (default 30, min 5), `unit`
  (suffix string), `thresholds: { warn?: number; crit?: number; invert?: bool }`,
  `authType: 'none' | 'basic' | 'bearer'` + credentials (safeStorage).
- Behavior: `GET {baseUrl}/api/v1/query?query=...` (instant) or
  `/api/v1/query_range?start=...&end=...&step=...` (range). Render: big value
  (first result series) colored by thresholds + sparkline of the range +
  series label. Multi-series: legend list, up to 5 series.
- API is stable Prometheus HTTP API v1 — also works as-is for **VictoriaMetrics,
  Thanos, Mimir, Cortex** (all Prometheus-compatible). One widget, five backends.

**A2. `json-stat` — Generic JSON Metric widget (the "other tools" catch-all)** — ✅ shipped (2026-08-13)
- Settings: `url`, `jsonPath` (dot/bracket path, e.g. `data.stats[0].cpu`),
  `label`, `unit`, `refreshSecs`, thresholds, auth (as A1), optional `headers`.
- Covers any reporting tool with a JSON endpoint (Datadog, New Relic, Zabbix,
  Netdata, custom app health endpoints) without one adapter per vendor.
- Implementation: reuse HTTP Monitor's poll loop; tiny path evaluator
  (no `eval`, no dependency).

**Shared work in Phase A:** ✅ shipped — `src/renderer/widgets/helpers.ts` gained
`usePolling(cb, secs)`, `Sparkline`, `thresholdColor()`, `getJsonPath()`,
`monitorAuthHeaders()`/`sanitizeMonitorAuth()` (auth fields are inlined per
widget for now; `BarStrip` deferred until a widget needs it). Credentials are
plain settings in this batch — safeStorage migration planned.

### Phase B — Grafana + Alertmanager

**B1. `grafana-alerts` — Grafana Alerts widget** — ✅ shipped (2026-08-13)
- Settings: `baseUrl`, service-account token (safeStorage), `stateFilter`
  (firing/pending/all), `labelFilter`, `refreshSecs`.
- API: `GET /api/alertmanager/grafana/api/v2/alerts` (unified alerting,
  Alertmanager-compatible schema). Render: count badge (red when firing > 0) +
  list rows (severity color, alert name, since-time); click → opens Grafana
  in browser (`shell.openExternalUrl`).
- The same widget with a different base path
  (`{baseUrl}/api/v2/alerts`) targets a **standalone Alertmanager** —
  expose as a `source: 'grafana' | 'alertmanager'` setting, one widget for both.

**B2. `grafana-panel` — Grafana Panel widget (visual embed)** — ✅ shipped (2026-08-13)
Two render modes (user picks; both documented in settings `moreInfo`):
1. **Server-rendered PNG** (default): `GET {baseUrl}/render/d-solo/{dashUid}/{slug}?panelId=N&width=&height=&from=&to=&tz=` with `Authorization: Bearer <sa token>`, fetched via the `http` API (binary → data URI). Requires the
   grafana-image-renderer plugin server-side; renderer enforces ≥1000×500 px
   minimums (we request that and downscale in CSS). Refresh on interval.
2. **Live iframe**: webview pointing at `{baseUrl}/d-solo/{uid}?orgId=1&panelId=N&kiosk`. Requires `allow_embedding = true` in grafana.ini and a
   logged-in session in the webview — zero extra plugins, fully interactive.
- Settings: `baseUrl`, `dashboardUid`, `panelId`, `mode`, `refreshSecs`,
  `timeRange` (e.g. `now-6h`), token (safeStorage).
- Shipped note: image mode required binary-safe HTTP — the `http` widget API
  gained `HttpRequestConfig.binary?: true` → `HttpResponse.bodyBase64`
  (base64 body from the main-process controller; backward compatible).
  Tokens are plain settings for now (safeStorage migration planned, as Phase A).

**B3. Dashboard deep links** — no new widget: document Link Opener tiles to
`{baseUrl}/d/{uid}` with the Grafana glyph (add a Grafana-style SVG to the
icon gallery — check trademark: use a generic "flame/graph" glyph, not the
Grafana logo).

### Phase C — push ingest (alerts come TO Freeter)

**C1. Webhook ingest endpoint on the existing MCP HTTP listener**
- `POST /ingest/{ingestToken}` on the same `127.0.0.1:39587` server (or its
  own port setting). Per-widget random token generated by the widget;
  `allowExternal` setting already governs external reachability.
- Payload: accept Grafana webhook contact-point format and Alertmanager
  webhook format (both are JSON with an `alerts[]` array); also accept
  arbitrary JSON (stored raw).
- **C2. `alert-inbox` widget**: subscribes to an ingest token, shows received
  alerts (ring buffer, persisted via dataStorage), unread badge, clear/ack.
- **Desktop notifications**: new `notification` widget API module →
  Electron `Notification` in main (new IPC channel `freeter:show-notification`).
  Firing alert → OS toast even when Freeter is in tray.
- This turns Freeter into an alert receiver: Grafana → contact point
  "webhook" → `http://<host>:39587/ingest/<token>` → toast on the desktop.
- Security: ingest tokens are per-widget, revocable (regenerate), constant-time
  compared; payloads size-capped (64 KB) and rate-limited (10/min/token);
  never rendered as HTML (text only).

### Phase D — long tail (pick by demand)

- **Loki logs tail** widget (LogQL `query_range`, tail-follow UI)
- **Uptime Kuma** (status page API) and **Healthchecks.io** (checks API) tiles
- **InfluxDB v2** (Flux query) stat widget
- **MCP tools**: `freeter_read_monitors` (statuses of all monitor-type widgets)
  so AI assistants can answer "is anything down?" from the dashboard state
- Vendor adapters only if the generic JSON widget proves insufficient
  (Datadog/New Relic/Zabbix all have JSON APIs usable via A2 today)

---

## 3. Cross-cutting rules

- **Secrets**: every token field uses safeStorage encrypt-on-save,
  decrypt-on-use (pattern: password-vault). Exported profiles must **exclude**
  decrypted secrets (they export the encrypted blob, non-portable — document).
- **Polling hygiene**: min interval 5 s; pause when workflow inactive
  (memory-saver already unmounts widgets — verified: intervals die with
  unmount); jitter ±10 % to avoid thundering herd on one server.
- **Failure UX**: every widget shows last-success timestamp and a compact
  error state; never an empty white box.
- **Tests**: mock `http` API responses per widget (fixtures from real
  Prometheus/Grafana payloads); controller tests for notification/ingest IPC.

## 4. Delivery plan

| Batch | Contents | Size |
|---|---|---|
| 1 | Shared helpers (`usePolling`, `Sparkline`, auth sub-component) + `prometheus-stat` + `json-stat` | ~1 session |
| 2 | `grafana-alerts` (incl. Alertmanager mode) + `grafana-panel` + gallery glyph | ~1 session |
| 3 | Ingest endpoint + `alert-inbox` + desktop notifications IPC | ~1 session |
| 4 | Phase D items on demand | as needed |

Each batch: feature branch → full pipeline (suite + MSI install) → PR → merge,
per the established workflow.

## 5. Open questions (defaults chosen; flag to change)

1. Ingest endpoint shares the MCP port (default: **yes**, one listener, one
   firewall rule) vs its own port.
2. Grafana panel default mode: **PNG render** (works headless with a token)
   vs iframe (needs server config + login). Default PNG.
3. Chart library: **none in phase A** (inline SVG); uPlot only if range
   charts need axes/zoom.
