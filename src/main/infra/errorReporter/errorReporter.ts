/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { spawn } from 'node:child_process';
import { app, dialog } from 'electron';
import { logToFile } from '@/infra/logger/fileLog';

const eventLogSource = 'Freeter 3';

/**
 * Writes an error to the Windows Event Viewer (Application log).
 * Creating the event source requires elevation, so registration is attempted
 * once and failures are silently ignored — writing works unelevated as long
 * as the source was registered before (e.g. by an elevated install/run).
 * No-op on non-Windows platforms.
 */
function writeWindowsEventLog(type: 'Error' | 'Warning' | 'Information', message: string): void {
  if (process.platform !== 'win32') {
    return;
  }
  // Single-quoted PS strings: escape by doubling the quotes
  const psMessage = message.replace(/'/g, "''").slice(0, 30000);
  const psCommand =
    `try { New-EventLog -LogName Application -Source '${eventLogSource}' -ErrorAction SilentlyContinue } catch {}; ` +
    `try { Write-EventLog -LogName Application -Source '${eventLogSource}' -EntryType ${type} -EventId 1000 -Message '${psMessage}' } catch {}`;
  try {
    spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psCommand], {
      windowsHide: true,
      detached: true,
      stdio: 'ignore'
    }).unref();
  } catch {
    // reporting must never throw
  }
}

/**
 * Reports a fatal main-process error: Windows Event Viewer entry + error
 * dialog, so a broken startup is never silent.
 */
export function reportFatalError(context: string, err: unknown): void {
  const detail = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err);
  const message = `Freeter ${app.getVersion()} fatal error (${context}):\n${detail}`;
  logToFile('error', message);
  writeWindowsEventLog('Error', message);
  try {
    dialog.showErrorBox(`Freeter failed to start (${context})`, detail);
  } catch {
    // dialog may be unavailable before app is ready
  }
}

/** Installs last-resort handlers so no main-process error goes unnoticed. */
export function installFatalErrorHandlers(): void {
  process.on('uncaughtException', err => reportFatalError('uncaughtException', err));
  process.on('unhandledRejection', reason => reportFatalError('unhandledRejection', reason));
}
