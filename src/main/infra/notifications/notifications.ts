/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Notification } from 'electron';

/**
 * Shows an OS desktop notification (toast). Safe to call from any
 * main-process code (IPC controllers, the webhook ingest endpoint):
 * silently no-ops when the OS does not support notifications.
 */
export function showDesktopNotification(title: string, body: string): void {
  try {
    if (!Notification.isSupported()) {
      return;
    }
    new Notification({ title, body }).show();
  } catch {
    // notifications unavailable (e.g. missing OS integration): ignore
  }
}
