import { Controller } from '@/controllers/controller';
import { ipcGetPluginsChannel, IpcGetPluginsArgs, IpcGetPluginsRes, ipcLoadPluginChannel, IpcLoadPluginArgs, IpcLoadPluginRes } from '@common/ipc/channels';
import { PluginProvider } from '@/infra/pluginProvider/pluginProvider';

type Deps = {
  pluginProvider: PluginProvider;
}

export function createPluginControllers({
  pluginProvider,
}: Deps): [
    Controller<IpcGetPluginsArgs, IpcGetPluginsRes>,
    Controller<IpcLoadPluginArgs, IpcLoadPluginRes>,
  ] {
  return [{
    channel: ipcGetPluginsChannel,
    handle: async () => pluginProvider.getPlugins()
  }, {
    channel: ipcLoadPluginChannel,
    handle: async (_event, pluginPath) => pluginProvider.loadPluginCode(pluginPath)
  }]
}
