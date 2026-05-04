import { ActionBarItems } from '@/base/actionBar';
import { canCopyFullText, copyFullText, labelCopyFullText } from './actions';
import { WidgetApi } from '@/widgets/appModules';
import { copyFullTextSvg } from './icons';

export function createActionBarItems(noteText: string, widgetApi: WidgetApi): ActionBarItems {
  return [
    {
      enabled: canCopyFullText(),
      icon: copyFullTextSvg,
      id: 'COPY-FULL-TEXT',
      title: labelCopyFullText,
      doAction: async () => copyFullText(noteText, widgetApi)
    }
  ];
}
