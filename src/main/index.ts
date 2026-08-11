/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { join } from 'node:path';
import { cpSync, existsSync } from 'node:fs';
import { installFatalErrorHandlers, reportFatalError } from '@/infra/errorReporter/errorReporter';
import { initFileLog, logToFile } from '@/infra/logger/fileLog';
import { hostFreeterApp, schemeFreeterFile } from '@common/infra/network';
import { channelPrefix } from '@common/ipc/ipc';
import { createIpcMain } from '@/infra/ipcMain/ipcMain';
import { app, BrowserWindow as ElectronBrowserWindow } from 'electron';
import { createRendererWindow } from '@/infra/browserWindow/browserWindow';
import { createIpcMainEventValidator } from '@/infra/ipcMain/ipcMainEventValidator';
import { registerAppFileProtocol } from '@/infra/protocolHandler/registerAppFileProtocol';
import { registerControllers } from '@/controllers/controller';
import { createAppDataStorageControllers } from '@/controllers/appDataStorage';
import { createGetTextFromAppDataStorageUseCase } from '@/application/useCases/appDataStorage/getTextFromAppDataStorage';
import { createSetTextInAppDataStorageUseCase } from '@/application/useCases/appDataStorage/setTextInAppDataStorage';
import { copyFileDataStorage, createFileDataStorage } from '@/infra/dataStorage/fileDataStorage';
import { createContextMenuControllers } from '@/controllers/contextMenu';
import { createPopupContextMenuUseCase } from '@/application/useCases/contextMenu/popupContextMenu';
import { createContextMenuProvider } from '@/infra/contextMenuProvider/contextMenuProvider';
import { createClipboardControllers } from '@/controllers/clipboard';
import { createShellControllers } from '@/controllers/shell';
import { createWriteTextIntoClipboardUseCase } from '@/application/useCases/clipboard/writeTextIntoClipboard';
import { createReadTextFromClipboardUseCase } from '@/application/useCases/clipboard/readTextFromClipboard';
import { createClipboardProvider } from '@/infra/clipboardProvider/clipboardProvider';
import { createOpenExternalUrlUseCase } from '@/application/useCases/shell/openExternalUrl';
import { createShellProvider } from '@/infra/shellProvider/shellProvider';
import { createProcessControllers } from '@/controllers/process';
import { createGetProcessInfoUseCase } from '@/application/useCases/process/getProcessInfo';
import { createGetSystemMetricsUseCase } from '@/application/useCases/process/getSystemMetrics';
import { createProcessProvider } from '@/infra/processProvider/processProvider';
import { createWriteBookmarkIntoClipboardUseCase } from '@/application/useCases/clipboard/writeBookmarkIntoClipboard';
import { createObjectManager } from '@common/base/objectManager';
import { createGetTextFromWidgetDataStorageUseCase } from '@/application/useCases/widgetDataStorage/getTextFromWidgetDataStorage';
import { createSetTextInWidgetDataStorageUseCase } from '@/application/useCases/widgetDataStorage/setTextInWidgetDataStorage';
import { createWidgetDataStorageControllers } from '@/controllers/widgetDataStorage';
import { createDeleteInWidgetDataStorageUseCase } from '@/application/useCases/widgetDataStorage/deleteInWidgetDataStorage';
import { createClearWidgetDataStorageUseCase } from '@/application/useCases/widgetDataStorage/clearWidgetDataStorage';
import { createGetKeysFromWidgetDataStorageUseCase } from '@/application/useCases/widgetDataStorage/getKeysFromWidgetDataStorage';
import { createDialogControllers } from '@/controllers/dialog';
import { createShowMessageBoxUseCase } from '@/application/useCases/dialog/showMessageBox';
import { createDialogProvider } from '@/infra/dialogProvider/dialogProvider';
import { createAppMenuControllers } from '@/controllers/appMenu';
import { createAppMenuProvider } from '@/infra/appMenuProvider/appMenuProvider';
import { createSetAppMenuUseCase } from '@/application/useCases/appMenu/setAppMenu';
import { createSetAppMenuAutoHideUseCase } from '@/application/useCases/appMenu/setAppMenuAutoHide';
import { createWindowStore } from '@/data/windowStore';
import { createWindowStateStorage } from '@/data/windowStateStorage';
import { setTextOnlyIfChanged } from '@common/infra/dataStorage/setTextOnlyIfChanged';
import { withJson } from '@common/infra/dataStorage/withJson';
import { createGetWindowStateUseCase } from '@/application/useCases/browserWindow/getWindowState';
import { createSetWindowStateUseCase } from '@/application/useCases/browserWindow/setWindowState';
import { BrowserWindow } from '@/application/interfaces/browserWindow';
import { createGlobalShortcutControllers } from '@/controllers/globalShortcut';
import { createSetMainShortcutUseCase } from '@/application/useCases/globalShortcut/setMainShortcut';
import { createGlobalShortcutProvider } from '@/infra/globalShortcut/globalShortcutProvider';
import { createTrayProvider } from '@/infra/trayProvider/trayProvider';
import { createInitTrayUseCase } from '@/application/useCases/tray/initTray';
import { createSetTrayMenuUseCase } from '@/application/useCases/tray/setTrayMenu';
import { createTrayMenuControllers } from '@/controllers/trayMenu';
import { createBrowserWindowControllers } from '@/controllers/browserWindow';
import { createShowBrowserWindowUseCase } from '@/application/useCases/browserWindow/showBrowserWindow';
import { createShowOpenFileDialogUseCase } from '@/application/useCases/dialog/showOpenFileDialog';
import { createShowSaveFileDialogUseCase } from '@/application/useCases/dialog/showSaveFileDialog';
import { createShowOpenDirDialogUseCase } from '@/application/useCases/dialog/showOpenDirDialog';
import { createTerminalControllers } from '@/controllers/terminal';
import { createExecCmdLinesInTerminalUseCase } from '@/application/useCases/terminal/execCmdLinesInTerminal';
import { createAppsProvider } from '@/infra/appsProvider/appsProvider';
import { createChildProcessProvider } from '@/infra/childProcessProvider/childProcessProvider';
import { createOpenPathUseCase } from '@/application/useCases/shell/openPath';
import { createCopyWidgetDataStorageUseCase } from '@/application/useCases/widgetDataStorage/copyWidgetDataStorage';
import { createOpenAppUseCase } from '@/application/useCases/shell/openApp';
import { createSafeStorageControllers } from '@/controllers/safeStorage';
import { createSafeStorageEncryptUseCase, createSafeStorageDecryptUseCase } from '@/application/useCases/safeStorage/safeStorage';
import { createSafeStorageProvider } from '@/infra/safeStorageProvider/safeStorageProvider';
import { createProfileControllers } from '@/controllers/profile';
import { createFindInPageControllers } from '@/controllers/findInPage';
import { createLoginItemControllers } from '@/controllers/loginItem';
import { createAutoBackup } from '@/infra/autoBackup/autoBackup';
import { createPluginControllers } from '@/controllers/plugin';
import { createPluginProvider } from '@/infra/pluginProvider/pluginProvider';

let appWindow: BrowserWindow | null = null; // ref to the app window

// Distinct app identity so Freeter 3 runs side-by-side with Freeter 1.x/2.x:
// its own userData dir (cache, single-instance lock) and its own data dir.
app.setName('Freeter 3');
app.setPath('userData', join(app.getPath('appData'), 'freeter3'));

const dataDirRoot = join(app.getPath('appData'), 'freeter3', 'freeter-data');
const v2DataDirRoot = join(app.getPath('appData'), 'freeter2', 'freeter-data');
// one-time migration: adopt existing v2/imported data on first run
if (!existsSync(dataDirRoot) && existsSync(v2DataDirRoot)) {
  try {
    cpSync(v2DataDirRoot, dataDirRoot, { recursive: true });
  } catch {
    // fall back to a fresh profile if the copy fails
  }
}

// plain-text app log: <appData>/freeter3/freeter-data/logs/freeter.log
initFileLog(join(dataDirRoot, 'logs', 'freeter.log'));
installFatalErrorHandlers();

if (!app.requestSingleInstanceLock()) {
  // there is another instance of the app running
  app.quit();
} {
  app.on('second-instance', (_event, _commandLine, _workingDirectory, _additionalData) => {
    if (appWindow) {
      if (!appWindow.isVisible()) {
        appWindow.show();
      }
      if (appWindow.isMinimized()) {
        appWindow.restore()
      }
      appWindow.focus()
    }
  })

  const globalShortcutProvider = createGlobalShortcutProvider();

  const processProvider = createProcessProvider();
  const processInfo = processProvider.getProcessInfo();
  const { isDevMode } = processInfo;

  registerAppFileProtocol(isDevMode);

  // Some keypoints for the user-agent spoofing.
  // 1. User agent cannot be modified on per website basis, as it will cause
  //    failed verifications on captcha-less web challenge services (which
  //    require the same UA for both the webpage and web worker services)
  //    This is the highest priority as there are many websites depending
  //    on the web challenge.
  // 2. If it will be needed in the future to add some flexibility in the
  //    UA control, then it might be done by changing UA on per-session basis,
  //    in that case both the webpage and the web worker will share the same UA.
  // 3. 'Electron' in the user agent causes "unsupported browser" error on some websites.
  // 4. 'Electron' removal causes issues on some websites (such as google's ones).
  //    For such websites we have to add exceptions and use the original UA.
  // 5. Currently the original UA for the excepted websites is set on per-website
  //    basis. This might break someday (see point 1), in that case consider
  //    implementing the UA change on per-session basis (see point 2).
  const uaOriginal = app.userAgentFallback;
  app.userAgentFallback = app.userAgentFallback.replace(/[Ee]lectron.*?\s/g, '');

  app.on('will-quit', () => {
    // Unregister global shortcuts
    globalShortcutProvider.destroy();
  })

  app.whenReady().then(async () => {
    const ipcMainEventValidator = createIpcMainEventValidator(channelPrefix, hostFreeterApp);
    const ipcMain = createIpcMain(ipcMainEventValidator);

    const appDataStorage = await createFileDataStorage('string', dataDirRoot);
    const getTextFromAppDataStorageUseCase = createGetTextFromAppDataStorageUseCase({ appDataStorage });
    const setTextInAppDataStorageUseCase = createSetTextInAppDataStorageUseCase({ appDataStorage });

    const getWidgetDataStoragePath = (id: string) => join(dataDirRoot, 'widgets', id);
    const widgetDataStorageManager = createObjectManager(
      (id) => createFileDataStorage('string', getWidgetDataStoragePath(id)),
      (fromId, toId) => copyFileDataStorage(getWidgetDataStoragePath(fromId), getWidgetDataStoragePath(toId))
    );

    // apply the persisted launch-at-startup preference
    try {
      const appJson = await appDataStorage.getText('app');
      if (appJson) {
        const launch = JSON.parse(appJson)?.obj?.ui?.appConfig?.launchAtStartup;
        if (typeof launch === 'boolean') {
          app.setLoginItemSettings({ openAtLogin: launch });
        }
      }
    } catch {
      // ignore malformed state
    }

    // daily/on-close profile backups (configured in Application Settings)
    const autoBackup = createAutoBackup(appDataStorage, widgetDataStorageManager);
    autoBackup.start();
    let onCloseBackupDone = false;
    app.on('before-quit', evt => {
      if (!onCloseBackupDone) {
        evt.preventDefault();
        autoBackup.runOnCloseIfEnabled().finally(() => {
          onCloseBackupDone = true;
          app.quit();
        });
      }
    });
    const getTextFromWidgetDataStorageUseCase = createGetTextFromWidgetDataStorageUseCase({ widgetDataStorageManager });
    const setTextInWidgetDataStorageUseCase = createSetTextInWidgetDataStorageUseCase({ widgetDataStorageManager });
    const deleteInWidgetDataStorageUseCase = createDeleteInWidgetDataStorageUseCase({ widgetDataStorageManager });
    const clearWidgetDataStorageUseCase = createClearWidgetDataStorageUseCase({ widgetDataStorageManager });
    const getKeysFromWidgetDataStorageUseCase = createGetKeysFromWidgetDataStorageUseCase({ widgetDataStorageManager });
    const copyWidgetDataStorageUseCase = createCopyWidgetDataStorageUseCase({ widgetDataStorageManager });

    const contextMenuProvider = createContextMenuProvider();
    const popupContextMenuUseCase = createPopupContextMenuUseCase({ contextMenuProvider });

    const clipboardProvider = createClipboardProvider();
    const writeBookmarkIntoClipboardUseCase = createWriteBookmarkIntoClipboardUseCase({ clipboardProvider });
    const writeTextIntoClipboardUseCase = createWriteTextIntoClipboardUseCase({ clipboardProvider });
    const readTextFromClipboardUseCase = createReadTextFromClipboardUseCase({ clipboardProvider });

    const shellProvider = createShellProvider();
    const openExternalUrlUseCase = createOpenExternalUrlUseCase({ shellProvider });
    const openPathUseCase = createOpenPathUseCase({ shellProvider })

    const getProcessInfoUseCase = createGetProcessInfoUseCase({ processProvider });
    const getSystemMetricsUseCase = createGetSystemMetricsUseCase({ processProvider });
    const { isLinux } = await getProcessInfoUseCase();

    const dialogProvider = createDialogProvider();
    const dialogShowMessageBoxUseCase = createShowMessageBoxUseCase({ dialogProvider });
    const showOpenFileDialogUseCase = createShowOpenFileDialogUseCase({ dialogProvider });
    const showSaveFileDialogUseCase = createShowSaveFileDialogUseCase({ dialogProvider });
    const showOpenDirDialogUseCase = createShowOpenDirDialogUseCase({ dialogProvider });

    const appMenuProvider = createAppMenuProvider();
    const setAppMenuUseCase = createSetAppMenuUseCase({ appMenuProvider });
    const setAppMenuAutoHideUseCase = createSetAppMenuAutoHideUseCase({ appMenuProvider })

    const setMainShortcutUseCase = createSetMainShortcutUseCase({ globalShortcutProvider });

    // Assets are bundled next to the compiled main script (dist/main/assets),
    // both in the packaged asar and in local prod runs — app.getAppPath()
    // points at the app root, where no assets/ dir exists.
    const trayProvider = createTrayProvider(join(__dirname, 'assets', 'app-icons', '16.png'));
    const setTrayMenuUseCase = createSetTrayMenuUseCase({ trayProvider });
    const initTrayUseCase = createInitTrayUseCase({ trayProvider, setTrayMenuUseCase });

    const showBrowserWindowUseCase = createShowBrowserWindowUseCase();

    const appsProvider = createAppsProvider();
    const childProcessProvider = createChildProcessProvider();
    const execCmdLinesInTerminalUseCase = createExecCmdLinesInTerminalUseCase({ appsProvider, childProcessProvider, processProvider })

    const openAppUseCase = createOpenAppUseCase({ childProcessProvider, processProvider })

    const safeStorageProvider = createSafeStorageProvider();
    const safeStorageEncryptUseCase = createSafeStorageEncryptUseCase({ safeStorageProvider });
    const safeStorageDecryptUseCase = createSafeStorageDecryptUseCase({ safeStorageProvider });

    const pluginProvider = createPluginProvider();

    registerControllers(ipcMain, [
      ...createAppDataStorageControllers({ getTextFromAppDataStorageUseCase, setTextInAppDataStorageUseCase }),
      ...createWidgetDataStorageControllers({
        getTextFromWidgetDataStorageUseCase,
        setTextInWidgetDataStorageUseCase,
        clearWidgetDataStorageUseCase,
        deleteInWidgetDataStorageUseCase,
        getKeysFromWidgetDataStorageUseCase,
        copyWidgetDataStorageUseCase,
      }),
      ...createContextMenuControllers({ popupContextMenuUseCase }),
      ...createClipboardControllers({ writeBookmarkIntoClipboardUseCase, writeTextIntoClipboardUseCase, readTextFromClipboardUseCase }),
      ...createShellControllers({ openExternalUrlUseCase, openPathUseCase, openAppUseCase }),
      ...createProcessControllers({ getProcessInfoUseCase, getSystemMetricsUseCase }),
      ...createDialogControllers({
        showMessageBoxUseCase: dialogShowMessageBoxUseCase,
        showOpenDirDialogUseCase,
        showOpenFileDialogUseCase,
        showSaveFileDialogUseCase
      }),
      ...createAppMenuControllers({ setAppMenuUseCase, setAppMenuAutoHideUseCase }),
      ...createGlobalShortcutControllers({ setMainShortcutUseCase }),
      ...createTrayMenuControllers({ setTrayMenuUseCase }),
      ...createBrowserWindowControllers({ showBrowserWindowUseCase }),
      ...createTerminalControllers({ execCmdLinesInTerminalUseCase }),
      ...createSafeStorageControllers({ safeStorageEncryptUseCase, safeStorageDecryptUseCase }),
      ...createPluginControllers({ pluginProvider }),
      ...createProfileControllers({
        appDataStorage,
        widgetDataStorageManager,
        // the composition root knows the runtime window is a real Electron
        // BrowserWindow; the appWindow ref is typed as the narrow app interface
        getBrowserWindow: () => appWindow as unknown as ElectronBrowserWindow | null
      }),
      ...createFindInPageControllers({
        getBrowserWindow: () => appWindow as unknown as ElectronBrowserWindow | null
      }),
      ...createLoginItemControllers()
    ])

    const [windowStore] = createWindowStore({
      stateStorage: createWindowStateStorage(
        setTextOnlyIfChanged(withJson(appDataStorage))
      )
    }, {
      h: 0,
      w: 0,
      x: 0,
      y: 0,
      isFull: false,
      isMaxi: false,
      isMini: false
    }, () => {
      const getWindowStateUseCase = createGetWindowStateUseCase({ windowStore })
      const setWindowStateUseCase = createSetWindowStateUseCase({ windowStore })
      logToFile('info', 'creating app window');
      appWindow = createRendererWindow(
        // preload is built to dist/preload, next to dist/main (__dirname)
        join(__dirname, '..', 'preload', 'preload.js'),
        `${schemeFreeterFile}://${hostFreeterApp}/index.html`,
        isLinux ? join(__dirname, 'assets', 'app-icons', '256.png') : undefined,
        uaOriginal,
        {
          getWindowStateUseCase,
          setWindowStateUseCase
        },
        {
          devTools: isDevMode,
        }
      )

      app.on('browser-window-created', (_e, win) => {
        // Disable menu in child windows
        if (win !== appWindow) {
          win.removeMenu();
        }
      });

      initTrayUseCase(appWindow);
    })
  }).catch(err => reportFatalError('startup', err));

}
