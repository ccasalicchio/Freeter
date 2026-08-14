/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

/**
 * Formats the time between now and an ISO timestamp as a compact relative
 * duration: "in 2h" for future times, "5m ago" for past times, "now" when
 * less than a second away. Returns '' for unparsable input.
 */
export function formatUntilTime(isoTime: string, nowMs: number = Date.now()): string {
  const t = Date.parse(isoTime);
  if (Number.isNaN(t)) {
    return '';
  }
  const diffSecs = Math.floor((t - nowMs) / 1000);
  const secs = Math.abs(diffSecs);
  if (secs < 1) {
    return 'now';
  }
  let dur: string;
  if (secs < 60) {
    dur = `${secs}s`;
  } else if (secs < 3600) {
    dur = `${Math.floor(secs / 60)}m`;
  } else if (secs < 86400) {
    dur = `${Math.floor(secs / 3600)}h`;
  } else {
    dur = `${Math.floor(secs / 86400)}d`;
  }
  return diffSecs > 0 ? `in ${dur}` : `${dur} ago`;
}
