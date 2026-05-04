import { List } from '@/base/list';

export interface ClipboardItem {
  id: number;
  text: string;
  pinned: boolean;
  timestamp: number;
}

export interface ClipboardState {
  items: List<ClipboardItem>;
  nextItemId: number;
}

export type SetClipboardState = (state: ClipboardState) => void;
export type GetClipboardState = () => ClipboardState;
