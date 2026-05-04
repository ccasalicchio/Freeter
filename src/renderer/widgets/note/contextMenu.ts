import { copyFullText, labelCopy, labelCopyFullText, labelCut, labelPaste, labelRedo, labelSelectAll, labelUndo } from './actions';
import { WidgetApi, WidgetContextMenuFactory, WidgetMenuItem } from '@/widgets/appModules';

export const textAreaContextId = 'textarea';
export function createContextMenuFactory(noteText: string | null, widgetApi: WidgetApi): WidgetContextMenuFactory {
  return (contextId) => {
    const items: WidgetMenuItem[] = []
    if (noteText !== null) {
      items.push({
        doAction: async () => copyFullText(noteText, widgetApi),
        label: labelCopyFullText
      });

      if (contextId === textAreaContextId) {
        items.push(
          { type: 'separator' },
          { label: labelUndo, role: 'undo' },
          { label: labelRedo, role: 'redo' },
          { type: 'separator' },
          { label: labelCut, role: 'cut' },
          { label: labelCopy, role: 'copy' },
          { label: labelPaste, role: 'paste' },
          { label: labelSelectAll, role: 'selectAll' }
        );
      }
    }

    return items;
  }
}
