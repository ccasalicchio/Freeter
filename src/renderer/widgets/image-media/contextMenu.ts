import { WidgetApi, WidgetContextMenuFactory, WidgetMenuItem } from '@/widgets/appModules';
import { openInViewer } from './actions';

export function createContextMenuFactory(imagePath: string, widgetApi: WidgetApi): WidgetContextMenuFactory {
  return () => {
    const items: WidgetMenuItem[] = []
    if (imagePath) {
      items.push({
        label: 'Open in Viewer',
        doAction: async () => openInViewer(imagePath, widgetApi)
      });
    }
    return items;
  }
}
