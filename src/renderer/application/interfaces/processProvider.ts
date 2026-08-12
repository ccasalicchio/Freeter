/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ProcessInfo, SystemMetrics } from '@common/base/process';
import { ExecFileResult } from '@common/base/exec';

export interface ProcessProvider {
  getProcessInfo: () => ProcessInfo;
  getSystemMetrics: () => Promise<SystemMetrics>;
  execFile: (cmd: string, args: string[], cwd?: string) => Promise<ExecFileResult>;
}
