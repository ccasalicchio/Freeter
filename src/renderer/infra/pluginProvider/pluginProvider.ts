import { IpcGetPluginsArgs, ipcGetPluginsChannel, IpcGetPluginsRes, IpcLoadPluginArgs, ipcLoadPluginChannel, IpcLoadPluginRes } from '@common/ipc/channels';
import { electronIpcRenderer } from '@/infra/mainApi/mainApi';
import { PluginManifest } from '@common/base/plugin';

export interface PluginManager {
  getPlugins: () => Promise<PluginManifest[]>;
  loadPluginCode: (pluginPath: string) => Promise<string | undefined>;
}

export function createPluginManager(): PluginManager {
  return {
    getPlugins: async () => electronIpcRenderer.invoke<IpcGetPluginsArgs, IpcGetPluginsRes>(
      ipcGetPluginsChannel
    ),
    loadPluginCode: async (pluginPath) => electronIpcRenderer.invoke<IpcLoadPluginArgs, IpcLoadPluginRes>(
      ipcLoadPluginChannel,
      pluginPath
    ),
  }
}
