/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: number;
  unstaged: number;
  untracked: number;
}

/** parses `git status --porcelain=v2 --branch` output */
export function parseGitStatus(output: string): GitStatus {
  const res: GitStatus = { branch: '', ahead: 0, behind: 0, staged: 0, unstaged: 0, untracked: 0 };
  for (const line of output.split('\n')) {
    if (line.startsWith('# branch.head ')) {
      res.branch = line.slice('# branch.head '.length).trim();
    } else if (line.startsWith('# branch.ab ')) {
      const m = line.match(/\+(\d+) -(\d+)/);
      if (m) {
        res.ahead = Number(m[1]);
        res.behind = Number(m[2]);
      }
    } else if (line.startsWith('1 ') || line.startsWith('2 ')) {
      const xy = line.split(' ')[1] ?? '..';
      if (xy[0] !== '.') {
        res.staged++;
      }
      if (xy[1] !== '.') {
        res.unstaged++;
      }
    } else if (line.startsWith('? ')) {
      res.untracked++;
    }
  }
  return res;
}
