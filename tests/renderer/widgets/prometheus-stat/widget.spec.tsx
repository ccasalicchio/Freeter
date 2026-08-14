/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Settings } from '@/widgets/prometheus-stat/settings';
import { widgetComp } from '@/widgets/prometheus-stat/widget'
import { screen } from '@testing-library/react';
import { SetupWidgetSutOptional, setupWidgetSut } from '@tests/widgets/setupSut'

function fixtureSettings(settings: Partial<Settings>): Settings {
  return {
    baseUrl: 'http://localhost:9090',
    query: 'up',
    mode: 'instant',
    rangeMinutes: 60,
    refreshSecs: 30,
    unit: '',
    warn: null,
    crit: null,
    invert: false,
    authType: 'none',
    username: '',
    password: '',
    token: '',
    ...settings
  }
}

function fixtureVectorBody(series: { metric: Record<string, string>; value: number }[]): string {
  return JSON.stringify({
    status: 'success',
    data: {
      resultType: 'vector',
      result: series.map(s => ({ metric: s.metric, value: [1723500000, String(s.value)] }))
    }
  });
}

function fixtureHttpResponse(overrides?: Partial<{ ok: boolean; status: number; body: string; error?: string }>) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    body: fixtureVectorBody([{ metric: { instance: 'node-1' }, value: 42.5 }]),
    ...overrides
  }
}

function setupSut(settings: Settings, optional?: SetupWidgetSutOptional) {
  return setupWidgetSut(widgetComp, settings, optional);
}

describe('Prometheus Stat Widget', () => {
  it('should render a "not specified" note, if baseUrl or query is empty', () => {
    setupSut(fixtureSettings({ baseUrl: '' }));

    expect(screen.getByText(/not specified/i)).toBeInTheDocument();
  })

  it('should query the instant endpoint and render the first series value with unit and labels', async () => {
    const request = jest.fn(async () => fixtureHttpResponse());
    setupSut(fixtureSettings({ unit: 'ms' }), {
      mockWidgetApi: { http: { request } }
    });

    expect(await screen.findByText('42.5')).toBeInTheDocument();
    expect(screen.getByText('ms')).toBeInTheDocument();
    expect(screen.getByText('{"instance":"node-1"}')).toBeInTheDocument();
    expect(request).toBeCalledWith(expect.objectContaining({
      url: 'http://localhost:9090/api/v1/query?query=up'
    }));
  })

  it('should render extra series as label:value rows', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        http: {
          request: jest.fn(async () => fixtureHttpResponse({
            body: fixtureVectorBody([
              { metric: { instance: 'node-1' }, value: 1 },
              { metric: { instance: 'node-2' }, value: 250 },
            ])
          }))
        }
      }
    });

    expect(await screen.findByText('1.00')).toBeInTheDocument();
    expect(screen.getByText('{"instance":"node-2"}')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
  })

  it('should color the big value by thresholds', async () => {
    setupSut(fixtureSettings({ warn: 10, crit: 100 }), {
      mockWidgetApi: { http: { request: jest.fn(async () => fixtureHttpResponse()) } }
    });

    const value = await screen.findByText('42.5');
    expect(value).toHaveClass('value-warn');
  })

  it('should render a sparkline for range mode from a matrix result', async () => {
    const request = jest.fn(async (_cfg: { url: string }) => fixtureHttpResponse({
      body: JSON.stringify({
        status: 'success',
        data: {
          resultType: 'matrix',
          result: [{ metric: {}, values: [[1, '10'], [2, '20'], [3, '15']] }]
        }
      })
    }));
    const { comp } = setupSut(fixtureSettings({ mode: 'range', rangeMinutes: 60 }), {
      mockWidgetApi: { http: { request } }
    });

    expect(await screen.findByText('15.0')).toBeInTheDocument();
    expect(comp.container.querySelector('svg polyline')).not.toBeNull();
    expect(request).toBeCalledWith(expect.objectContaining({
      url: expect.stringContaining('/api/v1/query_range?query=up&start=')
    }));
    expect(request.mock.calls[0][0].url).toContain('&step=60');
  })

  it('should render an error state when the API reports a failed query', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        http: {
          request: jest.fn(async () => fixtureHttpResponse({
            body: JSON.stringify({ status: 'error', error: 'parse error: bad query' })
          }))
        }
      }
    });

    expect(await screen.findByText('parse error: bad query')).toBeInTheDocument();
  })

  it('should render an error state on a non-ok HTTP status', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        http: { request: jest.fn(async () => fixtureHttpResponse({ ok: false, status: 401 })) }
      }
    });

    expect(await screen.findByText(/Prometheus API 401/)).toBeInTheDocument();
  })

  it('should send a basic auth header', async () => {
    const request = jest.fn(async () => fixtureHttpResponse());
    setupSut(fixtureSettings({ authType: 'basic', username: 'u', password: 'p' }), {
      mockWidgetApi: { http: { request } }
    });

    await screen.findByText('42.5');

    expect(request).toBeCalledWith(expect.objectContaining({
      headers: expect.objectContaining({ Authorization: `Basic ${btoa('u:p')}` })
    }));
  })

  it('should re-fetch on the Refresh button click', async () => {
    const request = jest.fn(async () => fixtureHttpResponse());
    const { userEvent } = setupSut(fixtureSettings({}), {
      mockWidgetApi: { http: { request } }
    });

    await screen.findByText('42.5');
    const callsAfterMount = request.mock.calls.length;

    await userEvent.click(screen.getByTitle(/refresh/i));

    expect(request.mock.calls.length).toBe(callsAfterMount + 1);
  })
})
