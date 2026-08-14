/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Settings } from '@/widgets/alert-inbox/settings';
import { widgetComp } from '@/widgets/alert-inbox/widget'
import { screen } from '@testing-library/react';
import { SetupWidgetSutOptional, setupWidgetSut } from '@tests/widgets/setupSut'

function fixtureSettings(settings: Partial<Settings>): Settings {
  return {
    ingestToken: 'test-token',
    notifyDesktop: true,
    maxShown: 20,
    ...settings
  }
}

function fixtureEntry(entry: Partial<{ title: string; body: string; severity: string; status: string; at: string }>) {
  return {
    title: 'SomeAlert',
    body: '',
    severity: '',
    status: 'firing',
    at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    ...entry
  }
}

const fixtureData = {
  entries: [
    fixtureEntry({ title: 'HighCPU', body: 'CPU usage above 90%', severity: 'critical' }),
    fixtureEntry({ title: 'DiskAlmostFull', body: 'Disk usage above 80%', severity: 'warning' }),
    fixtureEntry({ title: 'PingLost', severity: '' })
  ],
  unread: 2
};

function setupSut(settings: Settings, optional?: SetupWidgetSutOptional) {
  return setupWidgetSut(widgetComp, settings, optional);
}

describe('Alert Inbox Widget', () => {
  it('should ask to generate a token when ingestToken is empty', () => {
    setupSut(fixtureSettings({ ingestToken: '' }));

    expect(screen.getByText(/generate an ingest token/i)).toBeInTheDocument();
  })

  it('should render the stored entries with title and body', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        dataStorage: { getText: jest.fn(async () => JSON.stringify(fixtureData)) }
      }
    });

    expect(await screen.findByText('HighCPU')).toBeInTheDocument();
    expect(screen.getByText('CPU usage above 90%')).toBeInTheDocument();
    expect(screen.getByText('DiskAlmostFull')).toBeInTheDocument();
    expect(screen.getByText('PingLost')).toBeInTheDocument();
  })

  it('should read the "alerts" data storage key', async () => {
    const getText = jest.fn(async () => JSON.stringify(fixtureData));
    setupSut(fixtureSettings({}), {
      mockWidgetApi: { dataStorage: { getText } }
    });

    await screen.findByText('HighCPU');

    expect(getText).toBeCalledWith('alerts');
  })

  it('should render an unread badge with the unread count', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        dataStorage: { getText: jest.fn(async () => JSON.stringify(fixtureData)) }
      }
    });

    const badge = await screen.findByText('2 new');
    expect(badge).toHaveClass('badge-unread');
  })

  it('should render a green "0 new" badge and an empty note when nothing is stored', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        dataStorage: { getText: jest.fn(async () => undefined) }
      }
    });

    const badge = await screen.findByText('0 new');
    expect(badge).toHaveClass('badge-ok');
    expect(screen.getByText(/no alerts received yet/i)).toBeInTheDocument();
  })

  it('should limit the list to maxShown entries', async () => {
    setupSut(fixtureSettings({ maxShown: 2 }), {
      mockWidgetApi: {
        dataStorage: { getText: jest.fn(async () => JSON.stringify(fixtureData)) }
      }
    });

    expect(await screen.findByText('HighCPU')).toBeInTheDocument();
    expect(screen.getByText('DiskAlmostFull')).toBeInTheDocument();
    expect(screen.queryByText('PingLost')).not.toBeInTheDocument();
  })

  it('should render severity dots colored by severity', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        dataStorage: { getText: jest.fn(async () => JSON.stringify(fixtureData)) }
      }
    });

    const critRow = (await screen.findByText('HighCPU')).parentElement!;
    const warnRow = screen.getByText('DiskAlmostFull').parentElement!;
    const otherRow = screen.getByText('PingLost').parentElement!;
    expect(critRow.querySelector('.dot-crit')).not.toBeNull();
    expect(warnRow.querySelector('.dot-warn')).not.toBeNull();
    expect(otherRow.querySelector('.dot-other')).not.toBeNull();
  })

  it('should write unread 0 (keeping entries) on Mark read', async () => {
    const setText = jest.fn();
    const { userEvent } = setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        dataStorage: { getText: jest.fn(async () => JSON.stringify(fixtureData)), setText }
      }
    });

    await screen.findByText('HighCPU');
    await userEvent.click(screen.getByTitle(/mark read/i));

    expect(setText).toBeCalledWith('alerts', JSON.stringify({ entries: fixtureData.entries, unread: 0 }));
    expect(screen.getByText('0 new')).toBeInTheDocument();
    expect(screen.getByText('HighCPU')).toBeInTheDocument();
  })

  it('should write an empty inbox on Clear', async () => {
    const setText = jest.fn();
    const { userEvent } = setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        dataStorage: { getText: jest.fn(async () => JSON.stringify(fixtureData)), setText }
      }
    });

    await screen.findByText('HighCPU');
    await userEvent.click(screen.getByTitle(/clear/i));

    expect(setText).toBeCalledWith('alerts', JSON.stringify({ entries: [], unread: 0 }));
    expect(screen.queryByText('HighCPU')).not.toBeInTheDocument();
    expect(screen.getByText(/no alerts received yet/i)).toBeInTheDocument();
  })

  it('should copy the ingest token to the clipboard', async () => {
    const writeText = jest.fn();
    const { userEvent } = setupSut(fixtureSettings({ ingestToken: 'my-secret-token' }), {
      mockWidgetApi: {
        dataStorage: { getText: jest.fn(async () => undefined) },
        clipboard: { writeText }
      }
    });

    await screen.findByText('0 new');
    await userEvent.click(screen.getByTitle(/copy ingest token/i));

    expect(writeText).toBeCalledWith('my-secret-token');
  })

  it('should show an empty inbox on malformed stored data', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        dataStorage: { getText: jest.fn(async () => 'not json') }
      }
    });

    expect(await screen.findByText(/no alerts received yet/i)).toBeInTheDocument();
  })
})
