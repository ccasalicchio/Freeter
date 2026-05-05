import { ActionBarItem, ActionBarItems } from '@/base/actionBar';
import { canGoBack, canGoForward, canGoHome, canReload, goBack, goForward, goHome, labelAutoReloadStart, labelAutoReloadStop, labelGoBack, labelGoForward, labelGoHome, labelOpenInBrowser, labelReload, openCurrentInBrowser, reload } from './actions';
import { backSvg, forwardSvg, homeSvg, openInBrowserSvg, reloadSvg, reloadStartSvg, reloadStopSvg, zoomInSvg, zoomOutSvg, muteSvg, unmuteSvg, findSvg } from './icons';
import { WidgetApi } from '@/base/widgetApi';

export function createActionBarItems(
  elWebview: Electron.WebviewTag | null,
  widgetApi: WidgetApi,
  homeUrl: string,
  autoReload: number,
  autoReloadStopped: boolean,
  setAutoReloadStopped: (val: boolean) => void,
  zoomFactor: number,
  isMuted: boolean,
  setZoomFactor: (val: number) => void,
  setIsMuted: (val: boolean) => void,
  toggleFind: () => void,
): ActionBarItems {
  if (!elWebview || !homeUrl) {
    return []
  }

  let reloadItems: ActionBarItem[] = [
    {
      enabled: canReload(),
      icon: reloadSvg,
      id: 'RELOAD',
      title: labelReload,
      doAction: async () => reload(elWebview)
    }
  ];
  if (autoReload > 0) {
    reloadItems = [{
      enabled: canReload(),
      icon: autoReloadStopped ? reloadStartSvg : reloadStopSvg,
      id: 'AUTO-RELOAD',
      title: autoReloadStopped ? labelAutoReloadStart : labelAutoReloadStop,
      doAction: async () => setAutoReloadStopped(!autoReloadStopped)
    }, ...reloadItems]
  }

  return [
    {
      enabled: canGoHome(elWebview, homeUrl),
      icon: homeSvg,
      id: 'HOME',
      title: labelGoHome,
      doAction: async () => goHome(elWebview, homeUrl)
    },
    {
      enabled: canGoBack(elWebview),
      icon: backSvg,
      id: 'BACK',
      title: labelGoBack,
      doAction: async () => goBack(elWebview)
    },
    {
      enabled: canGoForward(elWebview),
      icon: forwardSvg,
      id: 'FORWARD',
      title: labelGoForward,
      doAction: async () => goForward(elWebview)
    },
    ...reloadItems,
    {
      enabled: true,
      icon: openInBrowserSvg,
      id: 'OPEN-IN-BROWSER',
      title: labelOpenInBrowser,
      doAction: async () => openCurrentInBrowser(elWebview, widgetApi)
    },
    {
      enabled: true,
      icon: zoomInSvg,
      id: 'ZOOM-IN',
      title: 'Zoom In',
      doAction: async () => {
        const newZoom = Math.min(zoomFactor + 0.25, 5);
        setZoomFactor(newZoom);
        elWebview.setZoomFactor(newZoom);
      }
    },
    {
      enabled: true,
      icon: zoomOutSvg,
      id: 'ZOOM-OUT',
      title: 'Zoom Out',
      doAction: async () => {
        const newZoom = Math.max(zoomFactor - 0.25, 0.25);
        setZoomFactor(newZoom);
        elWebview.setZoomFactor(newZoom);
      }
    },
    {
      enabled: true,
      icon: isMuted ? unmuteSvg : muteSvg,
      id: 'MUTE',
      title: isMuted ? 'Unmute' : 'Mute',
      doAction: async () => {
        const newMuted = !elWebview.isAudioMuted();
        elWebview.setAudioMuted(newMuted);
        setIsMuted(newMuted);
      }
    },
    {
      enabled: true,
      icon: findSvg,
      id: 'FIND',
      title: 'Find in Page (Ctrl+F)',
      doAction: async () => toggleFind()
    },
  ];
}
