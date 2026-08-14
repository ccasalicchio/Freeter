/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ipcShowNotificationChannel, IpcShowNotificationArgs, IpcShowNotificationRes } from '@common/ipc/channels';
import { electronIpcRenderer } from '@/infra/mainApi/mainApi';

export interface NotificationProvider {
  show: (title: string, body: string) => Promise<void>;
}

export function createNotificationProvider(): NotificationProvider {
  return {
    show: async (title, body) => electronIpcRenderer.invoke<IpcShowNotificationArgs, IpcShowNotificationRes>(ipcShowNotificationChannel, title, body),
  }
}
