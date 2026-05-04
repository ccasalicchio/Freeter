import { WidgetApi } from '@/widgets/appModules';

export const labelCopyFullText = 'Copy Full Text';
export const labelUndo = 'Undo';
export const labelRedo = 'Redo';
export const labelCut = 'Cut';
export const labelCopy = 'Copy';
export const labelPaste = 'Paste';
export const labelSelectAll = 'Select All';

export function canCopyFullText() {
  return true;
}

export function copyFullText(noteText: string, widgetApi: WidgetApi) {
  widgetApi.clipboard.writeText(noteText);
}
