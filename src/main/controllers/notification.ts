/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Controller } from '@/controllers/controller';
import { ipcShowNotificationChannel, IpcShowNotificationArgs, IpcShowNotificationRes } from '@common/ipc/channels';
import { showDesktopNotification } from '@/infra/notifications/notifications';

export function createNotificationControllers(): [
  Controller<IpcShowNotificationArgs, IpcShowNotificationRes>,
] {
  return [{
    channel: ipcShowNotificationChannel,
    handle: async (_event, title, body) => showDesktopNotification(title, body)
  }]
}
