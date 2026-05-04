import { ActionBarItems } from '@/base/actionBar';
import { clearHistorySvg } from './icons';
import { clearHistory } from './actions';
import { GetClipboardState, SetClipboardState } from '@/widgets/clipboard-history/state';

export function createActionBarItems(
  getState: GetClipboardState,
  setState: SetClipboardState
): ActionBarItems {
  return [
    {
      enabled: getState().items.some(item => !item.pinned),
      icon: clearHistorySvg,
      id: 'CLEAR-HISTORY',
      title: 'Clear History',
      doAction: async () => clearHistory(getState, setState)
    }
  ];
}
