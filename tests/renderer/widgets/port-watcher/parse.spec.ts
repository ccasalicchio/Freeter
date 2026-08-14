/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { parseNetstatListening, parsePortsList, parseSsListening } from '@/widgets/port-watcher/parse';

describe('parseNetstatListening', () => {
  it('parses LISTENING local ports from `netstat -ano -p TCP` output', () => {
    const out = [
      '',
      'Active Connections',
      '',
      '  Proto  Local Address          Foreign Address        State           PID',
      '  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       1234',
      '  TCP    127.0.0.1:5432         0.0.0.0:0              LISTENING       999',
      '  TCP    192.168.1.10:54012     52.10.20.30:443        ESTABLISHED     555',
      '  TCP    [::]:8080              [::]:0                 LISTENING       777',
      '  TCP    [::1]:3000             [::]:0                 LISTENING       1234',
      '  TCP    127.0.0.1:62310        127.0.0.1:62311        TIME_WAIT       0',
    ].join('\r\n');
    expect(parseNetstatListening(out)).toEqual(new Set([3000, 5432, 8080]));
  })

  it('returns an empty set for empty or unrelated output', () => {
    expect(parseNetstatListening('')).toEqual(new Set());
    expect(parseNetstatListening('  UDP    0.0.0.0:5353           *:*                                    111')).toEqual(new Set());
  })
})

describe('parseSsListening', () => {
  it('parses LISTEN local ports from `ss -ltn` output', () => {
    const out = [
      'State   Recv-Q  Send-Q   Local Address:Port     Peer Address:Port  Process',
      'LISTEN  0       128            0.0.0.0:22            0.0.0.0:*',
      'LISTEN  0       511                  *:8080                *:*',
      'LISTEN  0       128               [::]:22               [::]:*',
      'LISTEN  0       244          127.0.0.1:5432          0.0.0.0:*',
    ].join('\n');
    expect(parseSsListening(out)).toEqual(new Set([22, 8080, 5432]));
  })

  it('returns an empty set for empty output', () => {
    expect(parseSsListening('')).toEqual(new Set());
  })
})

describe('parsePortsList', () => {
  it('parses a comma-separated list with spaces', () => {
    expect(parsePortsList('3000, 5432, 8080')).toEqual([3000, 5432, 8080]);
  })

  it('skips invalid and duplicate entries', () => {
    expect(parsePortsList('3000, foo, , 0, 70000, 3000, 443')).toEqual([3000, 443]);
  })

  it('returns an empty list for an empty string', () => {
    expect(parsePortsList('')).toEqual([]);
  })
})
