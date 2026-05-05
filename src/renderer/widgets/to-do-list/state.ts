import { List } from '@/base/list';

export const maxTextLength = 1000;

export type Priority = 'none' | 'low' | 'medium' | 'high';

export interface ToDoListItem {
  id: number;
  text: string;
  isDone: boolean;
  dueDate: string;
  priority: Priority;
}

export interface ToDoListState {
  items: List<ToDoListItem>;
  nextItemId: number;
}

export type ItemEditorId = 'add-top' | number | 'add-bottom';
export type ActiveItemEditorState = { id: ItemEditorId } | null;

export type GetToDoListState = () => ToDoListState;
export type SetToDoListState = (newState: ToDoListState) => void;

export type SetActiveItemEditorState = (newState: ActiveItemEditorState) => void;
