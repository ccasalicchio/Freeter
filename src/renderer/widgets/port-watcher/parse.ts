/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

/** extracts the port number from a local address like `0.0.0.0:3000`, `127.0.0.1:5432` or `[::]:8080` */
function portOfLocalAddress(addr: string): number | undefined {
  const idx = addr.lastIndexOf(':');
  if (idx < 0) {
    return undefined;
  }
  const port = Number.parseInt(addr.slice(idx + 1), 10);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : undefined;
}

/** parses `netstat -ano -p TCP` (Windows) output into the set of ports in LISTENING state */
export function parseNetstatListening(output: string): Set<number> {
  const ports = new Set<number>();
  for (const line of output.split('\n')) {
    const cols = line.trim().split(/\s+/);
    // TCP <local address> <foreign address> LISTENING <pid>
    if (cols[0] !== 'TCP' || cols.length < 4 || cols[3] !== 'LISTENING') {
      continue;
    }
    const port = portOfLocalAddress(cols[1]);
    if (port !== undefined) {
      ports.add(port);
    }
  }
  return ports;
}

/** parses `ss -ltn` (Linux) output into the set of ports in LISTEN state */
export function parseSsListening(output: string): Set<number> {
  const ports = new Set<number>();
  for (const line of output.split('\n')) {
    const cols = line.trim().split(/\s+/);
    // LISTEN <recv-q> <send-q> <local address:port> <peer address:port>
    if (cols[0] !== 'LISTEN' || cols.length < 4) {
      continue;
    }
    const port = portOfLocalAddress(cols[3]);
    if (port !== undefined) {
      ports.add(port);
    }
  }
  return ports;
}

/** parses a comma-separated ports setting ("3000, 5432, 8080") into a deduplicated list of valid port numbers */
export function parsePortsList(ports: string): number[] {
  const res: number[] = [];
  for (const part of ports.split(',')) {
    const port = Number.parseInt(part.trim(), 10);
    if (Number.isInteger(port) && port > 0 && port < 65536 && !res.includes(port)) {
      res.push(port);
    }
  }
  return res;
}
