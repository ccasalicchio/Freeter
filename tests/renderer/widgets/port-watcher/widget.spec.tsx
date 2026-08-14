/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Settings } from '@/widgets/port-watcher/settings';
import { widgetComp } from '@/widgets/port-watcher/widget'
import { screen, waitFor } from '@testing-library/react';
import { fixtureProcessInfoWin } from '@testscommon/base/fixtures/process';
import { SetupWidgetSutOptional, setupWidgetSut } from '@tests/widgets/setupSut'

function fixtureSettings(settings: Partial<Settings>): Settings {
  return {
    ports: '3000, 5432',
    host: '127.0.0.1',
    refreshSecs: 30,
    notifyOnChange: false,
    ...settings
  }
}

const ssOutWith3000 = [
  'State   Recv-Q  Send-Q   Local Address:Port     Peer Address:Port  Process',
  'LISTEN  0       511            0.0.0.0:3000          0.0.0.0:*',
  'LISTEN  0       128               [::]:22               [::]:*',
].join('\n');

const ssOutWithout3000 = [
  'State   Recv-Q  Send-Q   Local Address:Port     Peer Address:Port  Process',
  'LISTEN  0       128               [::]:22               [::]:*',
].join('\n');

const netstatOutWith3000 = [
  'Active Connections',
  '',
  '  Proto  Local Address          Foreign Address        State           PID',
  '  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       1234',
  '  TCP    127.0.0.1:62310        127.0.0.1:62311        TIME_WAIT       0',
].join('\r\n');

function execFileOk(stdout: string) {
  return { code: 0, stdout, stderr: '' };
}

function setupSut(settings: Settings, optional?: SetupWidgetSutOptional) {
  return setupWidgetSut(widgetComp, settings, optional);
}

describe('Port Watcher Widget', () => {
  it('should ask for ports when none are configured', () => {
    setupSut(fixtureSettings({ ports: '' }));

    expect(screen.getByText(/ports not specified/i)).toBeInTheDocument();
  })

  it('should render a row per port with listening/closed states from ss output (non-Windows)', async () => {
    const execFile = jest.fn(async () => execFileOk(ssOutWith3000));
    setupSut(fixtureSettings({}), {
      mockWidgetApi: { process: { execFile } }
    });

    expect(await screen.findByText('3000 listening')).toBeInTheDocument();
    expect(screen.getByText('5432 closed')).toBeInTheDocument();
    expect(execFile).toBeCalledWith('ss', ['-ltn']);
  })

  it('should use netstat on Windows and parse LISTENING lines', async () => {
    const execFile = jest.fn(async () => execFileOk(netstatOutWith3000));
    setupSut(fixtureSettings({}), {
      mockWidgetApi: { process: { execFile, getProcessInfo: jest.fn(() => fixtureProcessInfoWin()) } }
    });

    expect(await screen.findByText('3000 listening')).toBeInTheDocument();
    expect(screen.getByText('5432 closed')).toBeInTheDocument();
    expect(execFile).toBeCalledWith('netstat', ['-ano', '-p', 'TCP']);
  })

  it('should show the configured host label', async () => {
    setupSut(fixtureSettings({ host: 'dev-box' }), {
      mockWidgetApi: { process: { execFile: jest.fn(async () => execFileOk(ssOutWith3000)) } }
    });

    expect(await screen.findByText('dev-box')).toBeInTheDocument();
  })

  it('should notify when a port state flips between checks and notifyOnChange is on', async () => {
    const show = jest.fn();
    const execFile = jest.fn()
      .mockResolvedValueOnce(execFileOk(ssOutWith3000))
      .mockResolvedValue(execFileOk(ssOutWithout3000));
    const { userEvent } = setupSut(fixtureSettings({ notifyOnChange: true }), {
      mockWidgetApi: { process: { execFile }, notification: { show } }
    });

    expect(await screen.findByText('3000 listening')).toBeInTheDocument();
    expect(show).not.toBeCalled();

    await userEvent.click(screen.getByTitle(/refresh now/i));

    expect(await screen.findByText('3000 closed')).toBeInTheDocument();
    await waitFor(() => expect(show).toBeCalledWith('Port 3000', 'no longer listening'));
    expect(show).toBeCalledTimes(1);
  })

  it('should not notify on state flips when notifyOnChange is off', async () => {
    const show = jest.fn();
    const execFile = jest.fn()
      .mockResolvedValueOnce(execFileOk(ssOutWith3000))
      .mockResolvedValue(execFileOk(ssOutWithout3000));
    const { userEvent } = setupSut(fixtureSettings({ notifyOnChange: false }), {
      mockWidgetApi: { process: { execFile }, notification: { show } }
    });

    expect(await screen.findByText('3000 listening')).toBeInTheDocument();
    await userEvent.click(screen.getByTitle(/refresh now/i));

    expect(await screen.findByText('3000 closed')).toBeInTheDocument();
    expect(show).not.toBeCalled();
  })

  it('should show an error when the command fails', async () => {
    const execFile = jest.fn(async () => ({ code: 1, stdout: '', stderr: 'command not found' }));
    setupSut(fixtureSettings({}), {
      mockWidgetApi: { process: { execFile } }
    });

    expect(await screen.findByText('command not found')).toBeInTheDocument();
  })
})
