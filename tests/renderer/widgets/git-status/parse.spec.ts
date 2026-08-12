/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { parseGitStatus } from '@/widgets/git-status/parse';

describe('parseGitStatus', () => {
  it('parses branch, ahead/behind and change counts', () => {
    const out = [
      '# branch.oid abc123',
      '# branch.head feature/x',
      '# branch.upstream origin/feature/x',
      '# branch.ab +2 -1',
      '1 M. N... 100644 100644 100644 abc def file-staged.ts',
      '1 .M N... 100644 100644 100644 abc def file-unstaged.ts',
      '1 MM N... 100644 100644 100644 abc def file-both.ts',
      '2 R. N... 100644 100644 100644 abc def R100 new-name.ts',
      '? untracked.ts',
      '? another-untracked.ts',
    ].join('\n');
    expect(parseGitStatus(out)).toEqual({
      branch: 'feature/x',
      ahead: 2,
      behind: 1,
      staged: 3,
      unstaged: 2,
      untracked: 2
    });
  })

  it('handles a clean repo without upstream', () => {
    const out = '# branch.oid abc\n# branch.head main\n';
    expect(parseGitStatus(out)).toEqual({
      branch: 'main', ahead: 0, behind: 0, staged: 0, unstaged: 0, untracked: 0
    });
  })
})
