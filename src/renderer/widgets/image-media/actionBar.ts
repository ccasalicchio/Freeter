import { ActionBarItems } from '@/base/actionBar';
import { openInViewerSvg } from './icons';
import { openInViewer } from './actions';
import { WidgetApi } from '@/widgets/appModules';

export function createActionBarItems(imagePath: string, widgetApi: WidgetApi): ActionBarItems {
  return [
    {
      enabled: !!imagePath,
      icon: openInViewerSvg,
      id: 'OPEN-IN-VIEWER',
      title: 'Open in Viewer',
      doAction: async () => openInViewer(imagePath, widgetApi)
    }
  ];
}
