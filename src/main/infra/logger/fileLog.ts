/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { dirname } from 'node:path';

const maxLogSize = 2 * 1024 * 1024; // rotate to .old beyond this

let logFilePath: string | null = null;

/**
 * Initializes the plain-text app log. Safe to call before app is ready.
 * Logging must never break the app: all failures are swallowed.
 */
export function initFileLog(path: string): void {
  try {
    mkdirSync(dirname(path), { recursive: true });
    if (existsSync(path) && statSync(path).size > maxLogSize) {
      renameSync(path, path + '.old');
    }
    logFilePath = path;
    logToFile('info', `==== log started (pid ${process.pid}) ====`);
  } catch {
    logFilePath = null;
  }
}

export function getLogFilePath(): string | null {
  return logFilePath;
}

export function logToFile(level: 'info' | 'warn' | 'error', message: string): void {
  if (!logFilePath) {
    return;
  }
  try {
    appendFileSync(logFilePath, `${new Date().toISOString()} [${level}] ${message}\n`);
  } catch {
    // never throw from logging
  }
}
